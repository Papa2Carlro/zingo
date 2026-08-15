-- Migration 001: Initial schema
CREATE TABLE phrases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  text TEXT NOT NULL UNIQUE,
  variants TEXT,
  weight INTEGER NOT NULL DEFAULT 1,
  category TEXT NOT NULL,
  lang TEXT NOT NULL DEFAULT 'ru',
  tags TEXT
);

CREATE INDEX idx_phrase_category ON phrases(category);
CREATE INDEX idx_phrase_text ON phrases(text);

CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT DEFAULT (datetime('now')),
  phrase_id INTEGER NOT NULL,
  category TEXT NOT NULL,
  platform TEXT NOT NULL,
  anon_hash TEXT NOT NULL,
  user_id INTEGER,
  FOREIGN KEY (phrase_id) REFERENCES phrases(id)
);

CREATE INDEX idx_event_phrase ON events(phrase_id);
CREATE INDEX idx_event_category ON events(category);
CREATE INDEX idx_event_platform ON events(platform);
CREATE INDEX idx_event_anon_hash ON events(anon_hash);

CREATE TABLE card_presets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  name TEXT NOT NULL,
  phrases TEXT NOT NULL,
  size INTEGER NOT NULL DEFAULT 5,
  is_public INTEGER DEFAULT 1
);

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  nickname TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  email TEXT UNIQUE,
  anon_hash TEXT NOT NULL UNIQUE,
  is_admin INTEGER DEFAULT 0
);

CREATE TABLE daily_phrase_stats (
  date TEXT NOT NULL,
  phrase_id INTEGER NOT NULL,
  category TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  unique_users INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (date, phrase_id, category),
  FOREIGN KEY (phrase_id) REFERENCES phrases(id)
);

CREATE TABLE moderation_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT DEFAULT (datetime('now')),
  phrase_id INTEGER,
  phrase_text TEXT,
  action TEXT NOT NULL, -- 'approved' | 'rejected'
  moderator_note TEXT
);

CREATE INDEX idx_moderation_phrase ON moderation_log(phrase_id);
CREATE INDEX idx_moderation_action ON moderation_log(action);