-- Restore children.user_id for child login accounts created by parent

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'children'
    AND COLUMN_NAME = 'user_id'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE children ADD COLUMN user_id CHAR(36) NULL UNIQUE AFTER parent_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
