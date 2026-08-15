-- Initial schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Phrases table
CREATE TABLE phrases (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    text TEXT NOT NULL,
    variants TEXT,
    weight INT NOT NULL DEFAULT 1,
    category VARCHAR(50) NOT NULL,
    lang VARCHAR(10) NOT NULL DEFAULT 'ru',
    tags TEXT
);

CREATE UNIQUE INDEX idx_phrase_text ON phrases(text) WHERE deleted_at IS NULL;
CREATE INDEX idx_phrase_category ON phrases(category);
CREATE INDEX idx_phrase_weight ON phrases(weight DESC);

-- Events table
CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    phrase_id INT NOT NULL REFERENCES phrases(id),
    category VARCHAR(50) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    anon_hash VARCHAR(128) NOT NULL,
    user_id INT REFERENCES users(id)
);

CREATE INDEX idx_events_created_at ON events(created_at DESC);
CREATE INDEX idx_events_phrase_id ON events(phrase_id);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_platform ON events(platform);
CREATE INDEX idx_events_anon_hash ON events(anon_hash);
CREATE INDEX idx_events_user_id ON events(user_id);

-- Card presets table
CREATE TABLE card_presets (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    name VARCHAR(100) NOT NULL,
    phrases TEXT NOT NULL,
    size INT NOT NULL DEFAULT 5,
    is_public BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_card_presets_public ON card_presets(is_public) WHERE deleted_at IS NULL;

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    nickname VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    anon_hash VARCHAR(128) NOT NULL UNIQUE,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_users_nickname ON users(nickname);
CREATE INDEX idx_users_anon_hash ON users(anon_hash);

-- Daily phrase stats materialized view
CREATE MATERIALIZED VIEW daily_phrase_stats AS
SELECT
    DATE(created_at) AS date,
    phrase_id,
    category,
    COUNT(*) AS count,
    COUNT(DISTINCT anon_hash) AS unique_users
FROM events
GROUP BY DATE(created_at), phrase_id, category;

CREATE UNIQUE INDEX idx_daily_phrase_stats ON daily_phrase_stats(date, phrase_id, category);
CREATE INDEX idx_daily_phrase_stats_date ON daily_phrase_stats(date DESC);