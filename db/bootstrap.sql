-- Reference schema for inspection only. Generate tracked Drizzle migrations
-- with npm run db:generate once dependencies are installed; deployment applies them.
CREATE TABLE vehicles (id TEXT PRIMARY KEY NOT NULL, data TEXT NOT NULL, updated_at INTEGER NOT NULL);
CREATE TABLE showroom (id TEXT PRIMARY KEY NOT NULL, data TEXT NOT NULL);
