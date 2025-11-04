DROP TABLE IF EXISTS blogs CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  user_id       VARCHAR(255) PRIMARY KEY,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE blogs (
  blog_id         SERIAL PRIMARY KEY,
  creator_user_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  creator_name    VARCHAR(255) NOT NULL,
  title           VARCHAR(255) NOT NULL,
  body            TEXT NOT NULL,
  date_created    TIMESTAMP NOT NULL DEFAULT NOW(),
  date_updated    TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_blogs_date_created ON blogs(date_created DESC);