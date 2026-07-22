CREATE TABLE IF NOT EXISTS activity_history (
  id CHAR(36) NOT NULL,
  child_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  detail TEXT NULL,
  score INT NULL,
  completed_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  INDEX idx_activity_history_child_completed (child_id, completed_at),
  CONSTRAINT fk_activity_history_child FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS weekly_progress (
  id CHAR(36) NOT NULL,
  child_id CHAR(36) NOT NULL,
  week_start DATE NOT NULL,
  communication_score INT NOT NULL,
  confidence_score INT NOT NULL,
  empathy_score INT NOT NULL,
  completed_activities INT NOT NULL,
  summary TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_weekly_progress_child_week (child_id, week_start),
  CONSTRAINT fk_weekly_progress_child FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS teacher_observations (
  id CHAR(36) NOT NULL,
  child_id CHAR(36) NOT NULL,
  teacher_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  observation TEXT NOT NULL,
  support_plan TEXT NULL,
  observed_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  INDEX idx_teacher_observations_child_date (child_id, observed_at),
  CONSTRAINT fk_teacher_observations_child FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS therapist_notes (
  id CHAR(36) NOT NULL,
  child_id CHAR(36) NOT NULL,
  therapist_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  note TEXT NOT NULL,
  next_focus TEXT NULL,
  session_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  INDEX idx_therapist_notes_child_date (child_id, session_at),
  CONSTRAINT fk_therapist_notes_child FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS recommendations (
  id CHAR(36) NOT NULL,
  child_id CHAR(36) NOT NULL,
  author_id CHAR(36) NULL,
  audience ENUM('child', 'parent', 'teacher', 'therapist') NOT NULL DEFAULT 'parent',
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  INDEX idx_recommendations_child_date (child_id, created_at),
  CONSTRAINT fk_recommendations_child FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
