-- =============================================================
-- Sociova — MySQL Migration
-- Converted from Supabase PostgreSQL migrations
-- Run against: mysql://root@127.0.0.1:3306/sociova
-- =============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- PROFILES
-- Mirrors Supabase auth.users — user_id is the Supabase UUID
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id           CHAR(36)     NOT NULL DEFAULT (UUID()),
  user_id      CHAR(36)     NOT NULL UNIQUE,
  full_name    VARCHAR(255) NULL,
  email        VARCHAR(255) NULL,
  avatar_url   TEXT         NULL,
  language_mode VARCHAR(50) NOT NULL DEFAULT 'hybrid',
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- USER_ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS user_roles (
  id         CHAR(36)    NOT NULL DEFAULT (UUID()),
  user_id    CHAR(36)    NOT NULL,
  role       ENUM('child','parent','teacher','therapist') NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_role (user_id, role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- CHILDREN
-- parent_id, user_id, teacher_id, therapist_id are Supabase UUIDs
-- ============================================================
CREATE TABLE IF NOT EXISTS children (
  id              CHAR(36)     NOT NULL DEFAULT (UUID()),
  parent_id       CHAR(36)     NOT NULL,
  user_id         CHAR(36)     NULL UNIQUE,
  teacher_id      CHAR(36)     NULL,
  therapist_id    CHAR(36)     NULL,
  name            VARCHAR(255) NOT NULL,
  age             INT          NULL,
  diagnosis_level VARCHAR(100) NULL,
  learning_goal   TEXT         NULL,
  created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- LEARNING_PROGRESS
-- ============================================================
CREATE TABLE IF NOT EXISTS learning_progress (
  id                  CHAR(36)    NOT NULL DEFAULT (UUID()),
  child_id            CHAR(36)    NOT NULL,
  xp                  INT         NOT NULL DEFAULT 0,
  level               INT         NOT NULL DEFAULT 1,
  streak              INT         NOT NULL DEFAULT 0,
  weekly_goal         INT         NOT NULL DEFAULT 5,
  completed_missions  INT         NOT NULL DEFAULT 0,
  total_missions      INT         NOT NULL DEFAULT 0,
  communication_score INT         NOT NULL DEFAULT 0,
  confidence_score    INT         NOT NULL DEFAULT 0,
  empathy_score       INT         NOT NULL DEFAULT 0,
  greeting_score      INT         NOT NULL DEFAULT 0,
  listening_score     INT         NOT NULL DEFAULT 0,
  conversation_score  INT         NOT NULL DEFAULT 0,
  created_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT fk_lp_child FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SIMULATION_SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS simulation_sessions (
  id           CHAR(36)     NOT NULL DEFAULT (UUID()),
  child_id     CHAR(36)     NOT NULL,
  scenario     VARCHAR(255) NOT NULL,
  conversation JSON         NOT NULL DEFAULT ('[]'),
  score        INT          NULL,
  feedback     TEXT         NULL,
  strength     TEXT         NULL,
  suggestion   TEXT         NULL,
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT fk_ss_child FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SOCIAL_STORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS social_stories (
  id              CHAR(36)     NOT NULL DEFAULT (UUID()),
  child_id        CHAR(36)     NOT NULL,
  title           VARCHAR(255) NOT NULL,
  situation       TEXT         NOT NULL,
  generated_story TEXT         NOT NULL,
  created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT fk_story_child FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- EMOTION_ANALYSES
-- ============================================================
CREATE TABLE IF NOT EXISTS emotion_analyses (
  id               CHAR(36)     NOT NULL DEFAULT (UUID()),
  child_id         CHAR(36)     NOT NULL,
  input_text       TEXT         NOT NULL,
  detected_emotion VARCHAR(100) NULL,
  confidence       DECIMAL(5,2) NULL,
  recommendation   TEXT         NULL,
  created_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT fk_ea_child FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- ACHIEVEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS achievements (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  child_id    CHAR(36)     NOT NULL,
  name        VARCHAR(255) NOT NULL,
  description TEXT         NULL,
  unlocked_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT fk_ach_child FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- COMMUNITY_POSTS
-- author_id is the Supabase user UUID
-- ============================================================
CREATE TABLE IF NOT EXISTS community_posts (
  id         CHAR(36)    NOT NULL DEFAULT (UUID()),
  author_id  CHAR(36)    NOT NULL,
  role       ENUM('child','parent','teacher','therapist') NULL,
  content    TEXT        NOT NULL,
  likes      INT         NOT NULL DEFAULT 0,
  comments   INT         NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- USER_SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS user_settings (
  id                     CHAR(36)    NOT NULL DEFAULT (UUID()),
  user_id                CHAR(36)    NOT NULL UNIQUE,
  daily_mission_reminder TINYINT(1)  NOT NULL DEFAULT 1,
  weekly_progress_report TINYINT(1)  NOT NULL DEFAULT 1,
  community_replies      TINYINT(1)  NOT NULL DEFAULT 0,
  large_font             TINYINT(1)  NOT NULL DEFAULT 0,
  high_contrast          TINYINT(1)  NOT NULL DEFAULT 0,
  reduce_motion          TINYINT(1)  NOT NULL DEFAULT 0,
  screen_reader          TINYINT(1)  NOT NULL DEFAULT 1,
  allow_research_data    TINYINT(1)  NOT NULL DEFAULT 0,
  share_with_therapist   TINYINT(1)  NOT NULL DEFAULT 1,
  created_at             DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at             DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- JOURNEY_LEVELS (product content)
-- ============================================================
CREATE TABLE IF NOT EXISTS journey_levels (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  level_order INT          NOT NULL UNIQUE,
  title       VARCHAR(255) NOT NULL,
  description TEXT         NOT NULL,
  icon        VARCHAR(100) NOT NULL DEFAULT 'message-circle',
  xp_reward   INT          NOT NULL DEFAULT 100,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- USER_JOURNEY_PROGRESS
-- ============================================================
CREATE TABLE IF NOT EXISTS user_journey_progress (
  id               CHAR(36)    NOT NULL DEFAULT (UUID()),
  child_id         CHAR(36)    NOT NULL,
  journey_level_id CHAR(36)    NOT NULL,
  status           ENUM('completed','in_progress','locked') NOT NULL DEFAULT 'locked',
  completed_at     DATETIME(3) NULL,
  created_at       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_child_level (child_id, journey_level_id),
  CONSTRAINT fk_ujp_child FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
  CONSTRAINT fk_ujp_level FOREIGN KEY (journey_level_id) REFERENCES journey_levels(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- MISSIONS (catalog)
-- ============================================================
CREATE TABLE IF NOT EXISTS missions (
  id           CHAR(36)     NOT NULL DEFAULT (UUID()),
  mission_type VARCHAR(20)  NOT NULL COMMENT 'daily or weekly',
  title        VARCHAR(255) NOT NULL,
  description  TEXT         NOT NULL,
  target_count INT          NOT NULL DEFAULT 1,
  xp_reward    INT          NOT NULL DEFAULT 50,
  is_active    TINYINT(1)   NOT NULL DEFAULT 1,
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- RESOURCES (catalog)
-- ============================================================
CREATE TABLE IF NOT EXISTS resources (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  title       VARCHAR(255) NOT NULL,
  description TEXT         NOT NULL,
  category    VARCHAR(100) NOT NULL DEFAULT 'Guide',
  language    VARCHAR(10)  NOT NULL DEFAULT 'id',
  url         TEXT         NULL,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SIMULATION_SCENARIOS (catalog)
-- ============================================================
CREATE TABLE IF NOT EXISTS simulation_scenarios (
  id              CHAR(36)     NOT NULL DEFAULT (UUID()),
  title           VARCHAR(255) NOT NULL UNIQUE,
  description     TEXT         NOT NULL,
  opening_message TEXT         NOT NULL,
  quick_replies   JSON         NOT NULL DEFAULT ('[]'),
  sort_order      INT          NOT NULL DEFAULT 0,
  is_active       TINYINT(1)   NOT NULL DEFAULT 1,
  created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================
-- SEED DATA
-- =============================================================

-- Journey levels
INSERT INTO journey_levels (id, level_order, title, description, icon, xp_reward) VALUES
  (UUID(), 1, 'Greeting',      'Belajar menyapa dengan sopan dan memperkenalkan diri.',                               'message-circle', 100),
  (UUID(), 2, 'Emotion',       'Kenali emosimu sendiri dan pahami perasaan orang lain.',                              'smile',          120),
  (UUID(), 3, 'Conversation',  'Belajar berbicara bergantian dan menjaga alur percakapan.',                           'bot',            150),
  (UUID(), 4, 'School',        'Berlatih berinteraksi dengan guru dan teman di sekolah.',                             'school',         150),
  (UUID(), 5, 'Friendship',    'Membangun dan menjaga pertemanan yang baik.',                                          'heart-handshake',180),
  (UUID(), 6, 'Presentation',  'Berlatih berbicara percaya diri di depan orang lain.',                                'presentation',   200),
  (UUID(), 7, 'Real World',    'Menghadapi situasi sehari-hari seperti berbelanja dan naik transportasi umum.',        'bus',            220),
  (UUID(), 8, 'Celebrate',     'Berlatih bersosialisasi saat ulang tahun atau acara bersama.',                        'party-popper',   240)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description),
  icon = VALUES(icon),
  xp_reward = VALUES(xp_reward);

-- Missions
INSERT INTO missions (id, mission_type, title, description, target_count, xp_reward, is_active) VALUES
  (UUID(), 'daily',  'Berkenalan dengan Teman Baru',   'Mulailah percakapan dengan menyapa teman, memperkenalkan diri, lalu tanyakan nama temanmu.', 4, 80,  1),
  (UUID(), 'weekly', 'Selesaikan 6 simulasi sosial',   'Latih enam situasi sosial bersama Sova untuk membangun rasa percaya diri secara bertahap.',  6, 300, 1);

-- Simulation scenarios
INSERT INTO simulation_scenarios (id, title, description, opening_message, quick_replies, sort_order, is_active) VALUES
  (UUID(), 'Perkenalkan Dirimu',         'Latihan menyebutkan nama dan menyapa dengan ramah.',                      'Halo! 😊 Namaku Sova. Boleh kenalan? Siapa namamu?',                                     '["Namaku Bimo.", "Senang bertemu denganmu.", "Siapa namamu?"]',             1, 1),
  (UUID(), 'Bertemu Teman Baru',         'Latihan memulai percakapan dengan teman baru.',                           'Halo! Aku Sova 😊 Hari ini kita belajar berkenalan dengan teman baru. Siapa namamu?',   '["Namaku Bimo.", "Senang bertemu denganmu.", "Apa hobimu?"]',               2, 1),
  (UUID(), 'Membeli Makanan di Kantin',  'Latihan meminta bantuan dan memesan makanan dengan sopan.',               'Halo, aku penjaga kantin. Kamu ingin membeli apa hari ini?',                             '["Saya mau roti, Bu.", "Berapa harganya?", "Terima kasih."]',              3, 1),
  (UUID(), 'Berbicara dengan Guru',      'Latihan bertanya kepada guru ketika membutuhkan bantuan.',                 'Halo Bimo, kelihatannya kamu ingin bertanya. Apa yang ingin kamu sampaikan?',             '["Bu, boleh saya bertanya?", "Saya belum paham.", "Tolong bantu saya."]', 4, 1),
  (UUID(), 'Presentasi di Depan Kelas', 'Latihan memperkenalkan ide dengan kalimat pendek dan jelas.',             'Sekarang giliranmu berbicara di depan kelas. Kamu bisa mulai pelan-pelan.',               '["Halo teman-teman.", "Saya ingin bercerita.", "Terima kasih sudah mendengarkan."]', 5, 1),
  (UUID(), 'Pergi ke Dokter Gigi',       'Latihan menyampaikan rasa takut dan mengikuti instruksi.',                'Halo, aku dokter gigi. Apa yang kamu rasakan hari ini?',                                 '["Saya agak takut.", "Gigi saya sakit.", "Boleh dijelaskan dulu?"]',       6, 1),
  (UUID(), 'Naik Transportasi Umum',    'Latihan meminta informasi dan menjaga keamanan di tempat umum.',          'Halo! Kita akan naik bus bersama. Apa yang perlu kita lakukan dulu?',                    '["Menunggu di halte.", "Bertanya tujuan bus.", "Duduk dengan tenang."]',   7, 1),
  (UUID(), 'Menghadiri Pesta Ulang Tahun', 'Latihan memberi ucapan dan bermain bersama teman.',                    'Selamat datang di pesta ulang tahun! Apa yang ingin kamu katakan kepada temanmu?',      '["Selamat ulang tahun!", "Boleh aku ikut bermain?", "Terima kasih sudah mengundangku."]', 8, 1)
ON DUPLICATE KEY UPDATE
  description     = VALUES(description),
  opening_message = VALUES(opening_message),
  quick_replies   = VALUES(quick_replies),
  sort_order      = VALUES(sort_order),
  is_active       = VALUES(is_active);

-- Resources
INSERT INTO resources (id, title, description, category, language, url, is_active) VALUES
  (UUID(), 'Panduan Social Story untuk Rutinitas Baru', 'Langkah sederhana membantu anak memahami situasi baru dengan cerita yang menenangkan.', 'Guide',     'id', NULL, 1),
  (UUID(), 'Latihan Napas 4-4-4 bersama Anak',         'Aktivitas regulasi emosi singkat untuk digunakan sebelum sekolah atau kegiatan sosial.', 'Exercise', 'id', NULL, 1),
  (UUID(), 'Checklist Komunikasi Rumah dan Sekolah',   'Daftar observasi ringkas untuk orang tua dan guru saat memantau perkembangan sosial.',   'Checklist', 'id', NULL, 1);
