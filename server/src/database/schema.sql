-- WorldBond / Bond Platform — PostgreSQL Schema
-- Run: psql $DATABASE_URL -f schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── USERS (auth layer) ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  phone           VARCHAR(50),
  password_hash   VARCHAR(255) NOT NULL,
  is_verified     BOOLEAN DEFAULT FALSE,
  verify_token    VARCHAR(255),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PROFILES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  display_name        VARCHAR(100) NOT NULL,
  age                 INTEGER CHECK (age >= 18 AND age <= 120),
  gender              VARCHAR(50),
  country             VARCHAR(100),
  city                VARCHAR(100),
  lat                 DECIMAL(10,8),
  lng                 DECIMAL(11,8),
  language            VARCHAR(10) DEFAULT 'en',
  languages_spoken    TEXT[]      DEFAULT '{}',
  bio                 TEXT,
  photo_url           TEXT,
  voice_note_url      TEXT,
  -- JSON blob from voice analysis: { pitch, pace, energy, tone }
  voice_tone_data     JSONB       DEFAULT '{}',
  -- e.g. ['dating','friendship','travel','language','mentorship']
  connection_types    TEXT[]      DEFAULT '{}',
  -- 1–5, decays from ghost behaviour
  ghost_score         DECIMAL(3,2) DEFAULT 5.0 CHECK (ghost_score >= 1 AND ghost_score <= 5),
  reputation_score    DECIMAL(3,2) DEFAULT 5.0 CHECK (reputation_score >= 1 AND reputation_score <= 5),
  last_active         TIMESTAMPTZ DEFAULT NOW(),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_country  ON profiles(country);
CREATE INDEX IF NOT EXISTS idx_profiles_language ON profiles(language);
CREATE INDEX IF NOT EXISTS idx_profiles_ghost    ON profiles(ghost_score);

-- ─── EXPERIENCES ─────────────────────────────────────────────────────────────
-- "I want to try street food in Bangkok with someone who can make me laugh"
CREATE TABLE IF NOT EXISTS experiences (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
  title             VARCHAR(200) NOT NULL,
  description       TEXT,
  category          VARCHAR(100),    -- food, travel, music, language, etc.
  connection_type   VARCHAR(50),     -- dating | friendship | travel | language | mentorship
  country           VARCHAR(100),
  city              VARCHAR(100),
  is_global         BOOLEAN DEFAULT FALSE,
  languages_wanted  TEXT[]  DEFAULT '{}',
  -- active | matched | expired | deleted
  status            VARCHAR(20) DEFAULT 'active',
  expires_at        TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_experiences_status          ON experiences(status);
CREATE INDEX IF NOT EXISTS idx_experiences_connection_type ON experiences(connection_type);
CREATE INDEX IF NOT EXISTS idx_experiences_country         ON experiences(country);

-- ─── EXPERIENCE APPLICATIONS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS experience_applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id   UUID REFERENCES experiences(id) ON DELETE CASCADE,
  applicant_id    UUID REFERENCES users(id)       ON DELETE CASCADE,
  message         TEXT,
  -- pending | accepted | rejected
  status          VARCHAR(20) DEFAULT 'pending',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(experience_id, applicant_id)
);

-- ─── MATCHES ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS matches (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id             UUID REFERENCES users(id) ON DELETE CASCADE,
  user2_id             UUID REFERENCES users(id) ON DELETE CASCADE,
  compatibility_score  DECIMAL(5,2),
  connection_type      VARCHAR(50),
  experience_id        UUID REFERENCES experiences(id),
  -- active | ended | blocked
  status               VARCHAR(20) DEFAULT 'active',
  matched_at           TIMESTAMPTZ DEFAULT NOW(),
  -- enforce user1_id < user2_id at insert time to prevent duplicates
  UNIQUE(user1_id, user2_id)
);

CREATE INDEX IF NOT EXISTS idx_matches_user1 ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2 ON matches(user2_id);

-- ─── MESSAGES (persistent) ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id         UUID REFERENCES matches(id) ON DELETE CASCADE,
  sender_id        UUID REFERENCES users(id)   ON DELETE CASCADE,
  content          TEXT NOT NULL,
  -- text | voice | image
  content_type     VARCHAR(20) DEFAULT 'text',
  original_content TEXT,
  -- { targetLanguage, translatedText, provider }
  translation_data JSONB DEFAULT '{}',
  read_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_match_id ON messages(match_id);

-- ─── DAILY MATCH QUEUE ───────────────────────────────────────────────────────
-- 5 AI-curated matches shown per user per day
CREATE TABLE IF NOT EXISTS daily_matches (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID REFERENCES users(id) ON DELETE CASCADE,
  matched_user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  compatibility_score  DECIMAL(5,2),
  score_breakdown      JSONB DEFAULT '{}',
  shown_date           DATE DEFAULT CURRENT_DATE,
  -- dismissed | connected | pending
  action               VARCHAR(20) DEFAULT 'pending',
  UNIQUE(user_id, matched_user_id, shown_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_matches_user_date ON daily_matches(user_id, shown_date);

-- ─── GHOST SCORE TRACKING ────────────────────────────────────────────────────
-- Every time a match is created we insert a row; update responded when they reply
CREATE TABLE IF NOT EXISTS interaction_tracking (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID REFERENCES users(id) ON DELETE CASCADE,
  match_id             UUID REFERENCES matches(id) ON DELETE CASCADE,
  responded            BOOLEAN DEFAULT FALSE,
  response_time_hours  DECIMAL(8,2),
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ─── BLOCKS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_blocks (
  blocker_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  blocked_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY(blocker_id, blocked_id)
);

-- ─── REFRESH TOKENS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  token       VARCHAR(500) UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PASSWORD RESET TOKENS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── UPDATED_AT TRIGGER ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'users_updated_at')    THEN CREATE TRIGGER users_updated_at    BEFORE UPDATE ON users    FOR EACH ROW EXECUTE FUNCTION set_updated_at(); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'profiles_updated_at') THEN CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at(); END IF;
END $$;
