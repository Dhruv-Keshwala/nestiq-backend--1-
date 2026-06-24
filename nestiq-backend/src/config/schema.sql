-- ════════════════════════════════════════════════════════════════
-- NESTIQ — Auth Schema (PostgreSQL)
--
-- Run this once against your database before starting the server:
--
--   psql -U postgres -d nestiq -f src/config/schema.sql
--
-- Or, from inside psql:
--   \i src/config/schema.sql
-- ════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- gives us gen_random_uuid()

CREATE TABLE IF NOT EXISTS users (
  user_id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR(100)  NOT NULL,
  email            VARCHAR(255)  NOT NULL UNIQUE,
  phone            VARCHAR(20)   UNIQUE,
  password_hash    TEXT          NOT NULL,
  role             VARCHAR(20)   NOT NULL DEFAULT 'renter'
                   CHECK (role IN ('renter','buyer','agent','admin','superadmin')),
  avatar_url       TEXT,
  is_verified      BOOLEAN       DEFAULT FALSE,
  is_active        BOOLEAN       DEFAULT TRUE,
  email_verified   BOOLEAN       DEFAULT FALSE,
  phone_verified   BOOLEAN       DEFAULT FALSE,
  preferences_json JSONB         DEFAULT '{}',
  failed_login_attempts INT      DEFAULT 0,
  locked_until     TIMESTAMP,
  last_login_at    TIMESTAMP,
  created_at       TIMESTAMP     DEFAULT NOW(),
  updated_at       TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email  ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role   ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

CREATE TABLE IF NOT EXISTS sessions (
  session_id   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID          NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  token_hash   TEXT          NOT NULL UNIQUE,
  device_info  JSONB         DEFAULT '{}',
  ip_address   VARCHAR(45),
  is_active    BOOLEAN       DEFAULT TRUE,
  expires_at   TIMESTAMP     NOT NULL,
  created_at   TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user  ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);

-- Auto-update `updated_at` on every UPDATE to users
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated ON users;
CREATE TRIGGER trg_users_updated
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();
