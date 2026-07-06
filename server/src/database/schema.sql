-- WorldBond / Bond Platform — PostgreSQL Schema
-- Run: psql $DATABASE_URL -f schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── USERS (auth layer) ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  phone           VARCHAR(50),
  password_hash   VARCHAR(255) NOT NULL,
  date_of_birth   DATE,
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
  gallery_photos      TEXT[]      DEFAULT '{}',
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

-- Safe migrations
ALTER TABLE users    ADD COLUMN IF NOT EXISTS date_of_birth        DATE;
ALTER TABLE users    ADD COLUMN IF NOT EXISTS signup_ip            TEXT;
ALTER TABLE users    ADD COLUMN IF NOT EXISTS device_fingerprint   TEXT;
ALTER TABLE users    ADD COLUMN IF NOT EXISTS is_suspended         BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gallery_photos       TEXT[]  DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coin_balance         INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_account_id   TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_payout_at       TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_id_verified       BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_bond_pass        BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bond_pass_expires_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bond_pass_receipt_hash TEXT;

-- Binds one Apple subscription (by its stable original_transaction_id, which
-- survives renewals) to exactly one WorldBond account — prevents a single
-- legitimate Bond Pass receipt being replayed across many accounts to grant
-- everyone free premium.
CREATE TABLE IF NOT EXISTS bond_pass_subscriptions (
  original_transaction_id  TEXT PRIMARY KEY,
  user_id                  UUID REFERENCES users(id) ON DELETE CASCADE,
  expires_at               TIMESTAMPTZ,
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_days          INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_last_checkin  DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_longest       INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_shield_month  VARCHAR(7);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_coins_earned   INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_coins_date     DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tagline              VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bond_style           VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vibe_tags            TEXT[]  DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests            TEXT[]  DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_photo_url      TEXT;

-- ─── IAP RECEIPT LOG — prevents replay attacks ────────────────────────────────
CREATE TABLE IF NOT EXISTS iap_receipts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
  receipt_hash   VARCHAR(512) UNIQUE NOT NULL,
  product_id     VARCHAR(255),
  environment    VARCHAR(20) DEFAULT 'production',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_iap_receipts_hash ON iap_receipts(receipt_hash);

-- ─── PAYOUT AUDIT LOG — immutable record of every payout ─────────────────────
CREATE TABLE IF NOT EXISTS payout_audit (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  coins_deducted  INTEGER NOT NULL,
  amount_cents    INTEGER NOT NULL,
  payout_rate     DECIMAL(4,2) NOT NULL,
  stripe_tx_id    TEXT,
  ip_address      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payout_audit_user ON payout_audit(user_id);
-- ─── TRANSFER STATUS — tracks Stripe transfer events and status ──────────────────
CREATE TABLE IF NOT EXISTS transfer_status (
  transfer_id TEXT PRIMARY KEY,
  user_id     UUID REFERENCES users(id),
  coins_deducted INTEGER NOT NULL,
  amount_cents   INTEGER NOT NULL,
  status      VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed, refunded
  stripe_status JSONB DEFAULT '{}', -- Full Stripe response
  completed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_transfer_status_user ON transfer_status(user_id);
CREATE INDEX IF NOT EXISTS idx_transfer_status_status ON transfer_status(status);



-- ─── FRAUD FLAGS — manual and automated review flags ─────────────────────────
CREATE TABLE IF NOT EXISTS fraud_flags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  flag_type   VARCHAR(100) NOT NULL,
  details     JSONB DEFAULT '{}',
  resolved    BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fraud_flags_user ON fraud_flags(user_id, resolved);

-- ─── USER REPORTS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  target_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  reason       VARCHAR(50) NOT NULL,
  context      JSONB DEFAULT '{}',
  resolved     BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_reports_target ON user_reports(target_id, resolved);

-- ─── YEARLY CHALLENGE PROGRESS (server-authoritative, one row per user per year) ─
CREATE TABLE IF NOT EXISTS yearly_challenge_progress (
  user_id              UUID REFERENCES users(id) ON DELETE CASCADE,
  year                 INTEGER NOT NULL,
  streams_completed    INTEGER DEFAULT 0,     -- World Streamer: 5+ hr streams
  stream_hours         DECIMAL(10,2) DEFAULT 0, -- Bond Marathon: cumulative hours
  total_viewers        INTEGER DEFAULT 0,     -- Bond Elite: cumulative unique viewers
  stamp_wins           INTEGER DEFAULT 0,     -- Globe Trotter: Country Stamp wins
  monument_wins        INTEGER DEFAULT 0,     -- Globe Trotter: Bond Monument wins
  gifts_received_bc    INTEGER DEFAULT 0,     -- Gift Legend: BC received in gifts
  total_bond_heat      INTEGER DEFAULT 0,     -- Bond Inferno: viewers + gifts×5 accumulated
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, year)
);
CREATE INDEX IF NOT EXISTS idx_yearly_progress_user ON yearly_challenge_progress(user_id);

-- ─── STREAM SESSIONS — tamper-proof record of every live session ──────────────
CREATE TABLE IF NOT EXISTS stream_sessions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID REFERENCES users(id) ON DELETE CASCADE,
  stream_socket_id     TEXT NOT NULL,
  started_at           TIMESTAMPTZ NOT NULL,
  ended_at             TIMESTAMPTZ,
  duration_minutes     INTEGER,               -- computed on end
  peak_viewers         INTEGER DEFAULT 0,
  total_unique_viewers INTEGER DEFAULT 0,
  gift_count           INTEGER DEFAULT 0,
  bond_heat            INTEGER DEFAULT 0,     -- peak_viewers + gift_count × 5
  counted_for_yearly   BOOLEAN DEFAULT FALSE, -- true only if duration >= 300 min (5 hrs)
  year                 INTEGER NOT NULL,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stream_sessions_user ON stream_sessions(user_id, year);

-- ─── CHALLENGE WIN LOG — rate-limited audit of stamp/monument wins ────────────
CREATE TABLE IF NOT EXISTS challenge_wins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  win_type    VARCHAR(20) NOT NULL,  -- 'stamp' or 'monument'
  target_id   TEXT NOT NULL,         -- flag emoji or monument id
  won_at      TIMESTAMPTZ DEFAULT NOW(),
  year        INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_challenge_wins_user ON challenge_wins(user_id, year);
-- Prevents recording more than 1 win per target per 30 days (enforced in app logic)

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

-- ─── GIFT EARNINGS — timestamped ledger of every real coin transfer from a ────
-- live-stream gift (sender → recipient). This is the source of truth for
-- "top 3 monthly streamers" ranking and for streamer payout balances.
-- stream_session_id is informational only (no FK) — the stream_sessions row
-- for a just-started stream is inserted fire-and-forget and may not have
-- landed yet when the first gift of that stream arrives.
CREATE TABLE IF NOT EXISTS gift_earnings (
  id                 BIGSERIAL PRIMARY KEY,
  recipient_user_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  sender_user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  stream_session_id  UUID,
  gift_id            VARCHAR(50) NOT NULL,
  coins              INTEGER NOT NULL,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gift_earnings_recipient_month ON gift_earnings(recipient_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_gift_earnings_month           ON gift_earnings(created_at);

-- ─── MONTHLY TOP CREATORS — locked-in top 3 earners for a completed month ────
-- Computed lazily (see creators.js) the first time it's requested after the
-- month ends, then frozen — so a streamer's payout rate for a given month
-- can never be gamed by earning more after the fact.
CREATE TABLE IF NOT EXISTS monthly_top_creators (
  year_month    VARCHAR(7) NOT NULL,  -- e.g. '2026-07'
  rank          INTEGER NOT NULL CHECK (rank BETWEEN 1 AND 3),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  coins_earned  INTEGER NOT NULL,
  locked_at     TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (year_month, rank)
);

-- ─── COUNTRY STAMPS — 1-of-1 collectible per country, real global ownership ──
-- Previously simulated entirely on-device (DEMO_STAMPS in WalletContext.js),
-- meaning two different users' phones could each believe they held the same
-- flag. This table is the single source of truth for who actually holds one.
CREATE TABLE IF NOT EXISTS country_stamps (
  flag           VARCHAR(8) PRIMARY KEY,
  holder_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  coins_earned   INTEGER DEFAULT 0,
  claimed_at     TIMESTAMPTZ,
  last_activity  TIMESTAMPTZ
);
INSERT INTO country_stamps (flag) VALUES
  ('🇺🇸'),('🇧🇷'),('🇰🇷'),('🇯🇵'),('🇬🇧'),('🇲🇽'),('🇦🇺'),('🇮🇩'),('🇹🇷'),('🇩🇪'),
  ('🇦🇷'),('🇷🇺'),('🇫🇷'),('🇪🇸'),('🇨🇦'),('🇮🇳'),('🇵🇭'),('🇸🇦'),('🇵🇱'),('🇹🇭'),
  ('🇸🇪'),('🇳🇱'),('🇵🇹'),('🇨🇴')
ON CONFLICT (flag) DO NOTHING;

-- ─── BOND MONUMENTS — 1-of-1 collectible per famous world landmark ───────────
CREATE TABLE IF NOT EXISTS bond_monuments (
  monument_id    VARCHAR(50) PRIMARY KEY,
  holder_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  coins_earned   INTEGER DEFAULT 0,
  claimed_at     TIMESTAMPTZ,
  last_activity  TIMESTAMPTZ
);
INSERT INTO bond_monuments (monument_id) VALUES
  ('liberty'),('grand_canyon'),('christ'),('amazon'),('gyeongbok'),('fuji'),
  ('fushimi'),('gate'),('bigben'),('eiffel'),('sagrada'),('red_square'),
  ('niagara'),('chichen'),('taj'),('borobudur'),('hagia'),('opera'),
  ('colosseum'),('great_wall')
ON CONFLICT (monument_id) DO NOTHING;

-- Needed to know which country's live streams a monument's 2% royalty applies
-- to (see collectibles.js payCollectibleRoyalties) — not present when the
-- table was first created.
ALTER TABLE bond_monuments ADD COLUMN IF NOT EXISTS country VARCHAR(8);
UPDATE bond_monuments SET country = v.country FROM (VALUES
  ('liberty','🇺🇸'),('grand_canyon','🇺🇸'),('christ','🇧🇷'),('amazon','🇧🇷'),
  ('gyeongbok','🇰🇷'),('fuji','🇯🇵'),('fushimi','🇯🇵'),('gate','🇩🇪'),
  ('bigben','🇬🇧'),('eiffel','🇫🇷'),('sagrada','🇪🇸'),('red_square','🇷🇺'),
  ('niagara','🇨🇦'),('chichen','🇲🇽'),('taj','🇮🇳'),('borobudur','🇮🇩'),
  ('hagia','🇹🇷'),('opera','🇦🇺'),('colosseum','🇮🇹'),('great_wall','🇨🇳')
) AS v(monument_id, country)
WHERE bond_monuments.monument_id = v.monument_id AND bond_monuments.country IS NULL;

-- ─── YEARLY CHALLENGE ENTRIES — Bond Pass-gated buy-in that locks in real ────
-- prize eligibility. progress_at_entry snapshots the relevant metric at the
-- moment of buy-in so only progress made AFTER buying in counts toward the
-- goal — see yearlyChallenges.js.
CREATE TABLE IF NOT EXISTS yearly_challenge_entries (
  user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
  year              INTEGER NOT NULL,
  challenge_key     VARCHAR(30) NOT NULL,
  progress_at_entry NUMERIC DEFAULT 0,
  bought_in_at      TIMESTAMPTZ DEFAULT NOW(),
  prize_paid_at     TIMESTAMPTZ,
  PRIMARY KEY (user_id, year, challenge_key)
);

-- ─── COIN BURNS — audit log of coins destroyed (not transferred to anyone) ───
-- Entry fees and yearly buy-ins are burned, not collected as platform
-- revenue — this table exists purely for accounting/audit visibility.
CREATE TABLE IF NOT EXISTS coin_burns (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  amount      INTEGER NOT NULL,
  reason      VARCHAR(50) NOT NULL,
  meta        JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_coin_burns_user ON coin_burns(user_id);

-- ─── UPDATED_AT TRIGGER ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'users_updated_at')    THEN CREATE TRIGGER users_updated_at    BEFORE UPDATE ON users    FOR EACH ROW EXECUTE FUNCTION set_updated_at(); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'profiles_updated_at') THEN CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at(); END IF;
END $$;
