export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS races (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  distanceMeters INTEGER NOT NULL,
  distanceLabel TEXT NOT NULL,
  location TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  startType TEXT NOT NULL DEFAULT 'mass',
  startTimeMs INTEGER,
  endTimeMs INTEGER,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  syncStatus TEXT NOT NULL DEFAULT 'synced'
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY NOT NULL,
  raceId TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  minAge INTEGER,
  maxAge INTEGER,
  gender TEXT NOT NULL DEFAULT 'ALL',
  startOffsetMs INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (raceId) REFERENCES races (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS runners (
  id TEXT PRIMARY KEY NOT NULL,
  raceId TEXT NOT NULL,
  bibNumber TEXT NOT NULL,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  gender TEXT NOT NULL DEFAULT 'U',
  age INTEGER,
  categoryId TEXT NOT NULL,
  team TEXT,
  status TEXT NOT NULL DEFAULT 'registered',
  wave INTEGER NOT NULL DEFAULT 1,
  emergencyContactName TEXT,
  emergencyContactPhone TEXT,
  notes TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (raceId) REFERENCES races (id) ON DELETE CASCADE,
  FOREIGN KEY (categoryId) REFERENCES categories (id)
);

CREATE TABLE IF NOT EXISTS timing_events (
  id TEXT PRIMARY KEY NOT NULL,
  raceId TEXT NOT NULL,
  runnerId TEXT,
  bibNumber TEXT NOT NULL,
  station TEXT NOT NULL DEFAULT 'FINISH',
  timestampMs INTEGER NOT NULL,
  elapsedTimeMs INTEGER NOT NULL,
  recordedBy TEXT NOT NULL DEFAULT 'marshal_1',
  deviceId TEXT NOT NULL DEFAULT 'device_main',
  notes TEXT,
  isManualOverride INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  syncStatus TEXT NOT NULL DEFAULT 'synced',
  FOREIGN KEY (raceId) REFERENCES races (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS unassigned_marks (
  id TEXT PRIMARY KEY NOT NULL,
  raceId TEXT NOT NULL,
  timestampMs INTEGER NOT NULL,
  elapsedTimeMs INTEGER NOT NULL,
  assignedBib TEXT,
  recordedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS mutation_log (
  id TEXT PRIMARY KEY NOT NULL,
  entityType TEXT NOT NULL,
  entityId TEXT NOT NULL,
  action TEXT NOT NULL,
  payload TEXT NOT NULL,
  timestampMs INTEGER NOT NULL,
  deviceId TEXT NOT NULL,
  synced INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_runners_race ON runners(raceId);
CREATE INDEX IF NOT EXISTS idx_runners_bib ON runners(raceId, bibNumber);
CREATE INDEX IF NOT EXISTS idx_categories_race ON categories(raceId);
CREATE INDEX IF NOT EXISTS idx_timing_race ON timing_events(raceId);
CREATE INDEX IF NOT EXISTS idx_timing_bib ON timing_events(raceId, bibNumber);
`;
