-- Backend content + auth repair for Sociova

-- Ensure the signup trigger exists in the live database.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Add optional direct child login + professional links.
ALTER TABLE public.children
  ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS therapist_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Rebuild helper with direct child/linked professional access.
CREATE OR REPLACE FUNCTION public.can_access_child(_child_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.children c
    WHERE c.id = _child_id
      AND (
        c.parent_id = auth.uid()
        OR c.user_id = auth.uid()
        OR c.teacher_id = auth.uid()
        OR c.therapist_id = auth.uid()
        OR public.has_role(auth.uid(), 'therapist')
        OR public.has_role(auth.uid(), 'teacher')
      )
  );
$$;

-- Let a signed-in child read their own child row in addition to the existing parent/therapist rules.
DROP POLICY IF EXISTS "Child reads own profile" ON public.children;
CREATE POLICY "Child reads own profile"
ON public.children
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Professionals read linked children" ON public.children;
CREATE POLICY "Professionals read linked children"
ON public.children
FOR SELECT
TO authenticated
USING (auth.uid() = teacher_id OR auth.uid() = therapist_id);

-- Journey levels are product content available to logged-in users.
CREATE TABLE IF NOT EXISTS public.journey_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_order INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'message-circle',
  xp_reward INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.journey_levels TO authenticated;
GRANT ALL ON public.journey_levels TO service_role;
ALTER TABLE public.journey_levels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated reads journey levels" ON public.journey_levels;
CREATE POLICY "Authenticated reads journey levels"
ON public.journey_levels
FOR SELECT
TO authenticated
USING (true);

-- Per-child journey progress.
CREATE TABLE IF NOT EXISTS public.user_journey_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  journey_level_id UUID NOT NULL REFERENCES public.journey_levels(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('completed', 'in_progress', 'locked')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (child_id, journey_level_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_journey_progress TO authenticated;
GRANT ALL ON public.user_journey_progress TO service_role;
ALTER TABLE public.user_journey_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Access journey progress" ON public.user_journey_progress;
CREATE POLICY "Access journey progress"
ON public.user_journey_progress
FOR ALL
TO authenticated
USING (public.can_access_child(child_id))
WITH CHECK (public.can_access_child(child_id));

-- Daily/weekly mission catalog.
CREATE TABLE IF NOT EXISTS public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_type TEXT NOT NULL CHECK (mission_type IN ('daily', 'weekly')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target_count INTEGER NOT NULL DEFAULT 1,
  xp_reward INTEGER NOT NULL DEFAULT 50,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.missions TO authenticated;
GRANT ALL ON public.missions TO service_role;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated reads missions" ON public.missions;
CREATE POLICY "Authenticated reads missions"
ON public.missions
FOR SELECT
TO authenticated
USING (is_active = true);

-- Resource catalog for the resources page and dashboard recommendations.
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Guide',
  language TEXT NOT NULL DEFAULT 'id',
  url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.resources TO authenticated;
GRANT ALL ON public.resources TO service_role;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated reads resources" ON public.resources;
CREATE POLICY "Authenticated reads resources"
ON public.resources
FOR SELECT
TO authenticated
USING (is_active = true);

-- AI simulation scenario catalog.
CREATE TABLE IF NOT EXISTS public.simulation_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  opening_message TEXT NOT NULL,
  quick_replies JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.simulation_scenarios TO authenticated;
GRANT ALL ON public.simulation_scenarios TO service_role;
ALTER TABLE public.simulation_scenarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated reads simulation scenarios" ON public.simulation_scenarios;
CREATE POLICY "Authenticated reads simulation scenarios"
ON public.simulation_scenarios
FOR SELECT
TO authenticated
USING (is_active = true);

-- Updated timestamp triggers for new content tables.
DROP TRIGGER IF EXISTS trg_journey_levels_updated ON public.journey_levels;
CREATE TRIGGER trg_journey_levels_updated BEFORE UPDATE ON public.journey_levels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_journey_progress_updated ON public.user_journey_progress;
CREATE TRIGGER trg_journey_progress_updated BEFORE UPDATE ON public.user_journey_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_missions_updated ON public.missions;
CREATE TRIGGER trg_missions_updated BEFORE UPDATE ON public.missions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_resources_updated ON public.resources;
CREATE TRIGGER trg_resources_updated BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_simulation_scenarios_updated ON public.simulation_scenarios;
CREATE TRIGGER trg_simulation_scenarios_updated BEFORE UPDATE ON public.simulation_scenarios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- More robust signup automation.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role public.app_role;
  _full_name TEXT;
  _child_id UUID;
  _level RECORD;
BEGIN
  _full_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), NULLIF(NEW.raw_user_meta_data->>'name', ''), split_part(NEW.email, '@', 1), 'Sociova User');

  BEGIN
    _role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'parent'::public.app_role);
  EXCEPTION WHEN others THEN
    _role := 'parent'::public.app_role;
  END;

  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, _full_name, NEW.email)
  ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name, email = EXCLUDED.email;

  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  IF _role = 'child' THEN
    INSERT INTO public.children (parent_id, user_id, name, age, diagnosis_level, learning_goal)
    VALUES (NEW.id, NEW.id, _full_name, 8, 'ASD support profile', 'Melatih komunikasi sosial dengan bantuan Sova')
    ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO _child_id;

    INSERT INTO public.learning_progress (
      child_id, xp, level, streak, weekly_goal, completed_missions, total_missions,
      communication_score, confidence_score, empathy_score, greeting_score, listening_score, conversation_score
    )
    VALUES (_child_id, 0, 1, 0, 6, 0, 6, 0, 0, 0, 0, 0, 0)
    ON CONFLICT DO NOTHING;

    FOR _level IN SELECT id, level_order FROM public.journey_levels ORDER BY level_order LOOP
      INSERT INTO public.user_journey_progress (child_id, journey_level_id, status)
      VALUES (_child_id, _level.id, CASE WHEN _level.level_order = 1 THEN 'in_progress' ELSE 'locked' END)
      ON CONFLICT (child_id, journey_level_id) DO NOTHING;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed product/demo content. These rows are safe to re-run.
INSERT INTO public.journey_levels (level_order, title, description, icon, xp_reward)
VALUES
  (1, 'Greeting', 'Belajar menyapa dengan sopan dan memperkenalkan diri.', 'message-circle', 100),
  (2, 'Emotion', 'Kenali emosimu sendiri dan pahami perasaan orang lain.', 'smile', 120),
  (3, 'Conversation', 'Belajar berbicara bergantian dan menjaga alur percakapan.', 'bot', 150),
  (4, 'School', 'Berlatih berinteraksi dengan guru dan teman di sekolah.', 'school', 150),
  (5, 'Friendship', 'Membangun dan menjaga pertemanan yang baik.', 'heart-handshake', 180),
  (6, 'Presentation', 'Berlatih berbicara percaya diri di depan orang lain.', 'presentation', 200),
  (7, 'Real World', 'Menghadapi situasi sehari-hari seperti berbelanja dan naik transportasi umum.', 'bus', 220),
  (8, 'Celebrate', 'Berlatih bersosialisasi saat ulang tahun atau acara bersama.', 'party-popper', 240)
ON CONFLICT (level_order) DO UPDATE
SET title = EXCLUDED.title, description = EXCLUDED.description, icon = EXCLUDED.icon, xp_reward = EXCLUDED.xp_reward;

INSERT INTO public.missions (mission_type, title, description, target_count, xp_reward, is_active)
VALUES
  ('daily', 'Berkenalan dengan Teman Baru', 'Mulailah percakapan dengan menyapa teman, memperkenalkan diri, lalu tanyakan nama temanmu.', 4, 80, true),
  ('weekly', 'Selesaikan 6 simulasi sosial', 'Latih enam situasi sosial bersama Sova untuk membangun rasa percaya diri secara bertahap.', 6, 300, true)
ON CONFLICT DO NOTHING;

INSERT INTO public.simulation_scenarios (title, description, opening_message, quick_replies, sort_order, is_active)
VALUES
  ('Perkenalkan Dirimu', 'Latihan menyebutkan nama dan menyapa dengan ramah.', 'Halo! 😊 Namaku Sova. Boleh kenalan? Siapa namamu?', '["Namaku Bimo.", "Senang bertemu denganmu.", "Siapa namamu?"]'::jsonb, 1, true),
  ('Pergi ke Dokter Gigi', 'Latihan menyampaikan rasa takut dan mengikuti instruksi.', 'Halo, aku dokter gigi. Apa yang kamu rasakan hari ini?', '["Saya agak takut.", "Gigi saya sakit.", "Boleh dijelaskan dulu?"]'::jsonb, 2, true),
  ('Berbicara dengan Guru', 'Latihan bertanya kepada guru ketika membutuhkan bantuan.', 'Halo Bimo, kelihatannya kamu ingin bertanya. Apa yang ingin kamu sampaikan?', '["Bu, boleh saya bertanya?", "Saya belum paham.", "Tolong bantu saya."]'::jsonb, 3, true),
  ('Bertemu Teman Baru', 'Latihan memulai percakapan dengan teman baru.', 'Halo! Aku Sova 😊 Hari ini kita belajar berkenalan dengan teman baru. Siapa namamu?', '["Namaku Bimo.", "Senang bertemu denganmu.", "Apa hobimu?"]'::jsonb, 4, true),
  ('Membeli Makanan di Kantin', 'Latihan meminta bantuan dan memesan makanan dengan sopan.', 'Halo, aku penjaga kantin. Kamu ingin membeli apa hari ini?', '["Saya mau roti, Bu.", "Berapa harganya?", "Terima kasih."]'::jsonb, 5, true),
  ('Presentasi di Depan Kelas', 'Latihan memperkenalkan ide dengan kalimat pendek dan jelas.', 'Sekarang giliranmu berbicara di depan kelas. Kamu bisa mulai pelan-pelan.', '["Halo teman-teman.", "Saya ingin bercerita.", "Terima kasih sudah mendengarkan."]'::jsonb, 6, true),
  ('Naik Transportasi Umum', 'Latihan meminta informasi dan menjaga keamanan di tempat umum.', 'Halo! Kita akan naik bus bersama. Apa yang perlu kita lakukan dulu?', '["Menunggu di halte.", "Bertanya tujuan bus.", "Duduk dengan tenang."]'::jsonb, 7, true),
  ('Menghadiri Pesta Ulang Tahun', 'Latihan memberi ucapan dan bermain bersama teman.', 'Selamat datang di pesta ulang tahun! Apa yang ingin kamu katakan kepada temanmu?', '["Selamat ulang tahun!", "Boleh aku ikut bermain?", "Terima kasih sudah mengundangku."]'::jsonb, 8, true)
ON CONFLICT (title) DO UPDATE
SET description = EXCLUDED.description, opening_message = EXCLUDED.opening_message, quick_replies = EXCLUDED.quick_replies, sort_order = EXCLUDED.sort_order, is_active = true;

INSERT INTO public.resources (title, description, category, language, url, is_active)
VALUES
  ('Panduan Social Story untuk Rutinitas Baru', 'Langkah sederhana membantu anak memahami situasi baru dengan cerita yang menenangkan.', 'Guide', 'id', NULL, true),
  ('Latihan Napas 4-4-4 bersama Anak', 'Aktivitas regulasi emosi singkat untuk digunakan sebelum sekolah atau kegiatan sosial.', 'Exercise', 'id', NULL, true),
  ('Checklist Komunikasi Rumah dan Sekolah', 'Daftar observasi ringkas untuk orang tua dan guru saat memantau perkembangan sosial.', 'Checklist', 'id', NULL, true)
ON CONFLICT DO NOTHING;

-- Demo community content is created only if the community is empty.
INSERT INTO public.community_posts (author_id, role, content, likes, comments)
SELECT auth.uid(), 'parent', 'Hari ini Bimo berhasil memperkenalkan diri kepada teman barunya setelah latihan di Sociova. Senang sekali melihat perkembangannya. 💙', 24, 6
WHERE auth.uid() IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.community_posts LIMIT 1);

-- Keep function execution private.
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_primary_role(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.can_access_child(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;