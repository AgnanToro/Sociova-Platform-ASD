CREATE TABLE IF NOT EXISTS community_replies (
  id CHAR(36) NOT NULL,
  post_id CHAR(36) NOT NULL,
  author_id CHAR(36) NOT NULL,
  role ENUM('child', 'parent', 'teacher', 'therapist') NULL,
  content TEXT NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  INDEX idx_community_replies_post_date (post_id, created_at),
  CONSTRAINT fk_community_replies_post FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
