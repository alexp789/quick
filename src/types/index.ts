export type RaceStatus = 'draft' | 'ready' | 'in_progress' | 'completed' | 'archived';
export type StartType = 'mass' | 'wave';
export type RunnerGender = 'M' | 'F' | 'X' | 'U';
export type RunnerStatus = 'registered' | 'active' | 'finished' | 'dnf' | 'dns';
export type StationType = 'START' | 'SPLIT_1' | 'SPLIT_2' | 'FINISH';
export type SyncStatus = 'synced' | 'pending' | 'conflict';

export interface Race {
  id: string; // UUIDv4
  name: string;
  date: string; // ISO date string (YYYY-MM-DD)
  distanceMeters: number; // e.g. 5000 for 5K
  distanceLabel: string; // e.g. "5K", "10K", "Half Marathon"
  location: string;
  notes: string;
  status: RaceStatus;
  startType: StartType;
  startTimeMs: number | null; // Gun start timestamp in epoch ms
  endTimeMs: number | null; // Race completed timestamp
  createdAt: string;
  updatedAt: string;
  version: number;
  syncStatus: SyncStatus;
}

export interface Category {
  id: string; // UUIDv4
  raceId: string;
  name: string; // e.g. "Male Open", "Female 40-49", "Junior Boys"
  code: string; // e.g. "M_OPEN", "F40", "U18"
  minAge: number | null;
  maxAge: number | null;
  gender: 'M' | 'F' | 'X' | 'ALL';
  startOffsetMs: number; // Offset from race gun start in ms (for wave starts)
  color: string; // Hex color code for badges
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface Runner {
  id: string; // UUIDv4
  raceId: string;
  bibNumber: string; // e.g. "101", "A-42"
  firstName: string;
  lastName: string;
  gender: RunnerGender;
  age: number | null;
  categoryId: string; // foreign key to Category.id
  team: string; // Running Club / Team / School
  status: RunnerStatus;
  wave: number; // Wave number (1, 2, 3...)
  emergencyContactName: string;
  emergencyContactPhone: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface TimingEvent {
  id: string; // UUIDv4
  raceId: string;
  runnerId: string | null; // null if unassigned/unknown bib
  bibNumber: string;
  station: StationType;
  timestampMs: number; // Exact epoch ms of crossing
  elapsedTimeMs: number; // Calculated elapsed time from gun/wave start
  recordedBy: string; // Device or Marshal ID
  deviceId: string;
  notes: string;
  isManualOverride: boolean;
  createdAt: string;
  version: number;
  syncStatus: SyncStatus;
}

// Quick Finish Mark in the split-second crowd arrival queue
export interface UnassignedFinishMark {
  id: string;
  timestampMs: number;
  elapsedTimeMs: number;
  assignedBib: string | null;
  recordedAt: string;
}

// Computed Leaderboard Row
export interface RaceResult {
  rank: number;
  categoryRank: number;
  genderRank: number;
  runnerId: string;
  bibNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  gender: RunnerGender;
  age: number | null;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  team: string;
  gunTimeMs: number;
  netTimeMs: number; // Gun time minus category wave offset
  formattedGunTime: string;
  formattedNetTime: string;
  formattedPaceMinKm: string;
  formattedPaceMinMile: string;
  gapToFirstMs: number;
  formattedGap: string;
  status: RunnerStatus;
  timingEventId: string;
  timestampMs: number;
}

export interface RaceStatistics {
  totalRegistered: number;
  starters: number;
  finishers: number;
  dnfCount: number;
  dnsCount: number;
  inProgressCount: number;
  fastestTimeMs: number | null;
  slowestTimeMs: number | null;
  averageTimeMs: number | null;
  medianTimeMs: number | null;
  finishRatePercentage: number;
}

// Server Sync & Multi-Marshal Collaboration Models
export interface SyncDevice {
  deviceId: string;
  deviceName: string;
  role: 'starter' | 'timer' | 'registration' | 'viewer';
  lastSeenAt: string;
}

export interface MutationRecord {
  id: string;
  entityType: 'race' | 'category' | 'runner' | 'timing_event';
  entityId: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: string; // JSON string
  timestampMs: number;
  deviceId: string;
  synced: boolean;
}

export interface RacePackageBackup {
  exportVersion: string;
  exportedAt: string;
  race: Race;
  categories: Category[];
  runners: Runner[];
  timingEvents: TimingEvent[];
  unassignedMarks?: UnassignedFinishMark[];
}
