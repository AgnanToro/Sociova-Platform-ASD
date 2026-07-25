-- Add admin to AppRole enums used by user_roles and care_team_members

ALTER TABLE user_roles
  MODIFY COLUMN role ENUM('child','parent','teacher','therapist','admin') NOT NULL;

ALTER TABLE care_team_members
  MODIFY COLUMN role ENUM('parent','teacher','therapist','admin') NOT NULL;
