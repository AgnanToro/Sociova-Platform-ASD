-- Sociova: password_hash, unique email, child profile (no login), care team
-- Safe to re-run parts with IF NOT EXISTS / information_schema checks where possible.

-- 1) password_hash on profiles (seed/register need this column)
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'profiles'
    AND COLUMN_NAME = 'password_hash'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE profiles ADD COLUMN password_hash VARCHAR(255) NULL AFTER email',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) unique email on profiles
SET @idx_exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'profiles'
    AND INDEX_NAME = 'profiles_email_key'
);
SET @sql := IF(
  @idx_exists = 0,
  'ALTER TABLE profiles ADD UNIQUE KEY profiles_email_key (email)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3) Drop child login link (user_id) — child is profile only
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'children'
    AND COLUMN_NAME = 'user_id'
);
SET @sql := IF(
  @col_exists = 1,
  'ALTER TABLE children DROP COLUMN user_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4) Indexes for care-team FK fields
SET @idx_exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'children'
    AND INDEX_NAME = 'children_parent_id_idx'
);
SET @sql := IF(
  @idx_exists = 0,
  'ALTER TABLE children ADD INDEX children_parent_id_idx (parent_id), ADD INDEX children_teacher_id_idx (teacher_id), ADD INDEX children_therapist_id_idx (therapist_id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5) Care team members table
CREATE TABLE IF NOT EXISTS care_team_members (
  id         CHAR(36)     NOT NULL,
  child_id   CHAR(36)     NOT NULL,
  user_id    CHAR(36)     NOT NULL,
  role       ENUM('parent','teacher','therapist') NOT NULL,
  status     ENUM('pending','active','revoked') NOT NULL DEFAULT 'active',
  invited_by CHAR(36)     NULL,
  created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY care_team_members_child_id_user_id_role_key (child_id, user_id, role),
  KEY care_team_members_user_id_idx (user_id),
  CONSTRAINT care_team_members_child_id_fkey
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT care_team_members_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6) Remove obsolete child login roles (if any)
DELETE FROM user_roles WHERE role = 'child';
