-- Full content for user materials (card keeps short description)
ALTER TABLE resources ADD COLUMN body LONGTEXT NULL AFTER description;
