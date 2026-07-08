
-- ============ ENUM ============
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'app_role'
    ) THEN
        CREATE TYPE public.app_role AS ENUM (
            'child',
            'parent',
            'teacher',
            'therapist'
        );
    END IF;
END $$;
-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  language_mode TEXT NOT NULL DEFAULT 'hybrid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============ USER_ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.get_primary_role(_user_id UUID)
RETURNS public.app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id ORDER BY created_at ASC LIMIT 1;
$$;

-- ============ CHILDREN ============
CREATE TABLE public.children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER,
  diagnosis_level TEXT,
  learning_goal TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.children TO authenticated;
GRANT ALL ON public.children TO service_role;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parent manages own children" ON public.children FOR ALL TO authenticated USING (auth.uid() = parent_id) WITH CHECK (auth.uid() = parent_id);
CREATE POLICY "Therapist reads children" ON public.children FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'therapist'));

-- Helper: is caller allowed to see a child row?
CREATE OR REPLACE FUNCTION public.can_access_child(_child_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.children c
    WHERE c.id = _child_id
      AND (c.parent_id = auth.uid()
           OR public.has_role(auth.uid(), 'therapist')
           OR public.has_role(auth.uid(), 'teacher'))
  );
$$;

-- ============ LEARNING_PROGRESS ============
CREATE TABLE public.learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  streak INTEGER NOT NULL DEFAULT 0,
  weekly_goal INTEGER NOT NULL DEFAULT 5,
  completed_missions INTEGER NOT NULL DEFAULT 0,
  total_missions INTEGER NOT NULL DEFAULT 0,
  communication_score INTEGER NOT NULL DEFAULT 0,
  confidence_score INTEGER NOT NULL DEFAULT 0,
  empathy_score INTEGER NOT NULL DEFAULT 0,
  greeting_score INTEGER NOT NULL DEFAULT 0,
  listening_score INTEGER NOT NULL DEFAULT 0,
  conversation_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_progress TO authenticated;
GRANT ALL ON public.learning_progress TO service_role;
ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Access learning progress" ON public.learning_progress FOR ALL TO authenticated USING (public.can_access_child(child_id)) WITH CHECK (public.can_access_child(child_id));

-- ============ SIMULATION_SESSIONS ============
CREATE TABLE public.simulation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  scenario TEXT NOT NULL,
  conversation JSONB NOT NULL DEFAULT '[]'::jsonb,
  score INTEGER,
  feedback TEXT,
  strength TEXT,
  suggestion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.simulation_sessions TO authenticated;
GRANT ALL ON public.simulation_sessions TO service_role;
ALTER TABLE public.simulation_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Access simulation sessions" ON public.simulation_sessions FOR ALL TO authenticated USING (public.can_access_child(child_id)) WITH CHECK (public.can_access_child(child_id));

-- ============ SOCIAL_STORIES ============
CREATE TABLE public.social_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  situation TEXT NOT NULL,
  generated_story TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_stories TO authenticated;
GRANT ALL ON public.social_stories TO service_role;
ALTER TABLE public.social_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Access social stories" ON public.social_stories FOR ALL TO authenticated USING (public.can_access_child(child_id)) WITH CHECK (public.can_access_child(child_id));

-- ============ EMOTION_ANALYSES ============
CREATE TABLE public.emotion_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  input_text TEXT NOT NULL,
  detected_emotion TEXT,
  confidence NUMERIC(5,2),
  recommendation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emotion_analyses TO authenticated;
GRANT ALL ON public.emotion_analyses TO service_role;
ALTER TABLE public.emotion_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Access emotion analyses" ON public.emotion_analyses FOR ALL TO authenticated USING (public.can_access_child(child_id)) WITH CHECK (public.can_access_child(child_id));

-- ============ ACHIEVEMENTS ============
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.achievements TO authenticated;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Access achievements" ON public.achievements FOR ALL TO authenticated USING (public.can_access_child(child_id)) WITH CHECK (public.can_access_child(child_id));

-- ============ COMMUNITY_POSTS ============
CREATE TABLE public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role,
  content TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_posts TO authenticated;
GRANT ALL ON public.community_posts TO service_role;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated reads posts" ON public.community_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Author inserts own posts" ON public.community_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Author updates own posts" ON public.community_posts FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Author deletes own posts" ON public.community_posts FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- ============ USER_SETTINGS ============
CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_mission_reminder BOOLEAN NOT NULL DEFAULT true,
  weekly_progress_report BOOLEAN NOT NULL DEFAULT true,
  community_replies BOOLEAN NOT NULL DEFAULT false,
  large_font BOOLEAN NOT NULL DEFAULT false,
  high_contrast BOOLEAN NOT NULL DEFAULT false,
  reduce_motion BOOLEAN NOT NULL DEFAULT false,
  screen_reader BOOLEAN NOT NULL DEFAULT true,
  allow_research_data BOOLEAN NOT NULL DEFAULT false,
  share_with_therapist BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_settings TO authenticated;
GRANT ALL ON public.user_settings TO service_role;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User manages own settings" ON public.user_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ TIMESTAMP TRIGGER ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_children_updated BEFORE UPDATE ON public.children FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_progress_updated BEFORE UPDATE ON public.learning_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ AUTO PROFILE / SETTINGS / ROLE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _role public.app_role;
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.email
  );

  INSERT INTO public.user_settings (user_id) VALUES (NEW.id);

  BEGIN
    _role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'parent'::public.app_role);
  EXCEPTION WHEN others THEN
    _role := 'parent'::public.app_role;
  END;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
