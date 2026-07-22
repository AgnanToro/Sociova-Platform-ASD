CREATE TABLE IF NOT EXISTS community_likes (
  id CHAR(36) NOT NULL,
  post_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_community_like_post_user (post_id, user_id),
  INDEX idx_community_likes_user (user_id),
  CONSTRAINT fk_community_likes_post FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
