CREATE TABLE IF NOT EXISTS products (
  id            SERIAL PRIMARY KEY,
  title         TEXT        NOT NULL,
  author        TEXT,
  price         NUMERIC(10,2) NOT NULL,
  quantity      INTEGER     NOT NULL DEFAULT 0,
  description   TEXT,
  category      TEXT,
  image_url     TEXT,
  max_discount  NUMERIC(10,2) NOT NULL DEFAULT 0,
  swatch_color  TEXT,
  swatch_code   TEXT,
  variants      JSONB       DEFAULT '[]'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS author TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS max_discount NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS swatch_color TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS swatch_code TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS orders (
  id            SERIAL PRIMARY KEY,
  product_id    INTEGER     NOT NULL REFERENCES products(id),
  quantity      INTEGER     NOT NULL,
  total_price   NUMERIC(10,2) NOT NULL,
  order_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivery_at   TIMESTAMPTZ,
  status        TEXT        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','called','confirmed','dispatched','delivered','returned','cancelled')),
  sender_id     TEXT        NOT NULL,
  customer_name TEXT,
  phone         TEXT,
  channel       TEXT        DEFAULT 'messenger',
  receive_score INTEGER     DEFAULT 50,
  address       JSONB
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'messenger';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS receive_score INTEGER DEFAULT 50;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending','called','confirmed','dispatched','delivered','returned','cancelled'));

CREATE TABLE IF NOT EXISTS fb_contacts (
  sender_id   TEXT        PRIMARY KEY,
  first_name  TEXT,
  last_name   TEXT,
  profile_pic TEXT,
  fetched_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversations (
  id          SERIAL PRIMARY KEY,
  sender_id   TEXT        NOT NULL,
  role        TEXT        NOT NULL CHECK (role IN ('user','assistant')),
  content     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  id                    SERIAL PRIMARY KEY,
  store_name            TEXT        DEFAULT 'My Store',
  welcome_message       TEXT        DEFAULT 'Welcome! How can I help you today?',
  language              TEXT        DEFAULT 'bangla',
  currency              TEXT        DEFAULT '৳',
  facebook_page_token   TEXT,
  facebook_verify_token TEXT,
  facebook_app_secret   TEXT,
  facebook_page_id      TEXT,
  facebook_page_name    TEXT,
  facebook_connected    BOOLEAN     DEFAULT FALSE,
  telegram_bot_token    TEXT,
  telegram_chat_id      TEXT,
  telegram_connected    BOOLEAN     DEFAULT FALSE,
  onboarding_completed  BOOLEAN     DEFAULT FALSE,
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Seed a single settings row if none exists.
INSERT INTO settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Business identity/tone (sales-agent + assistant prompt personalization) and
-- the OpenAI key, kept separate from the Facebook/Telegram channel fields
-- above. Both env-fallback at read time when left null.
ALTER TABLE settings ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS product_type TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS tone_instructions TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS openai_api_key TEXT;

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS image_url TEXT;

CREATE TABLE IF NOT EXISTS demand_products (
  id            SERIAL PRIMARY KEY,
  product_name  TEXT        NOT NULL,
  sender_id     TEXT        NOT NULL,
  request_count INTEGER     NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_name, sender_id)
);

CREATE TABLE IF NOT EXISTS assistant_sessions (
  id          SERIAL PRIMARY KEY,
  title       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assistant_messages (
  id          SERIAL PRIMARY KEY,
  session_id  INTEGER     NOT NULL REFERENCES assistant_sessions(id) ON DELETE CASCADE,
  role        TEXT        NOT NULL CHECK (role IN ('user','assistant')),
  content     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS assistant_messages_session_idx ON assistant_messages(session_id, created_at);

-- Read-only role for the assistant's execute_query tool. SELECT-only on
-- products/orders — no access to settings (holds plaintext API keys) or
-- conversations. default_transaction_read_only blocks writes even if a grant
-- is ever added by mistake. Set READONLY_DATABASE_URL in .env with this
-- role's own password (change the placeholder below before running).
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'analyst_ro') THEN
    CREATE ROLE analyst_ro WITH LOGIN PASSWORD 'change-me';
  END IF;
END
$$;

ALTER ROLE analyst_ro SET statement_timeout = '5000';
ALTER ROLE analyst_ro SET default_transaction_read_only = on;

GRANT CONNECT ON DATABASE selling_copilot TO analyst_ro;
GRANT USAGE ON SCHEMA public TO analyst_ro;
GRANT SELECT ON products, orders TO analyst_ro;
REVOKE ALL ON settings, conversations, assistant_sessions, assistant_messages FROM analyst_ro;
