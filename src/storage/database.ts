import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SCHEMA_SQL } from './schema';
import { Race, Category, Runner, TimingEvent, UnassignedFinishMark, MutationRecord } from '../types';

let sqliteDb: any = null;
let isNativeSqlite = false;

// Storage Keys for AsyncStorage fallback
const STORAGE_KEYS = {
  RACES: 'quick_races_v1',
  CATEGORIES: 'quick_categories_v1',
  RUNNERS: 'quick_runners_v1',
  TIMING_EVENTS: 'quick_timing_events_v1',
  UNASSIGNED_MARKS: 'quick_unassigned_marks_v1',
  MUTATIONS: 'quick_mutations_v1',
};

export async function initDatabase(): Promise<void> {
  if (Platform.OS !== 'web') {
    try {
      const SQLite = await import('expo-sqlite');
      sqliteDb = await SQLite.openDatabaseAsync('quick_running_race.db');
      await sqliteDb.execAsync(SCHEMA_SQL);
      isNativeSqlite = true;
      return;
    } catch (e) {
      console.warn('Fallback to AsyncStorage due to SQLite init error:', e);
      isNativeSqlite = false;
    }
  } else {
    isNativeSqlite = false;
  }
}

// Fallback helper for AsyncStorage
async function getJsonList<T>(key: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function setJsonList<T>(key: string, list: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(list));
}

// Database API
export const db = {
  // RACES
  async getAllRaces(): Promise<Race[]> {
    if (isNativeSqlite && sqliteDb) {
      return await sqliteDb.getAllAsync('SELECT * FROM races ORDER BY createdAt DESC');
    }
    const races = await getJsonList<Race>(STORAGE_KEYS.RACES);
    return races.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getRaceById(id: string): Promise<Race | null> {
    if (isNativeSqlite && sqliteDb) {
      return (await sqliteDb.getFirstAsync('SELECT * FROM races WHERE id = ?', [id])) || null;
    }
    const races = await getJsonList<Race>(STORAGE_KEYS.RACES);
    return races.find((r) => r.id === id) || null;
  },

  async saveRace(race: Race): Promise<void> {
    if (isNativeSqlite && sqliteDb) {
      await sqliteDb.runAsync(
        `INSERT OR REPLACE INTO races (
          id, name, date, distanceMeters, distanceLabel, location, notes, status, 
          startType, startTimeMs, endTimeMs, createdAt, updatedAt, version, syncStatus
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          race.id,
          race.name,
          race.date,
          race.distanceMeters,
          race.distanceLabel,
          race.location || '',
          race.notes || '',
          race.status,
          race.startType,
          race.startTimeMs,
          race.endTimeMs,
          race.createdAt,
          race.updatedAt,
          race.version,
          race.syncStatus,
        ]
      );
      return;
    }
    const races = await getJsonList<Race>(STORAGE_KEYS.RACES);
    const idx = races.findIndex((r) => r.id === race.id);
    if (idx >= 0) {
      races[idx] = race;
    } else {
      races.unshift(race);
    }
    await setJsonList(STORAGE_KEYS.RACES, races);
  },

  async deleteRace(id: string): Promise<void> {
    if (isNativeSqlite && sqliteDb) {
      await sqliteDb.runAsync('DELETE FROM races WHERE id = ?', [id]);
      await sqliteDb.runAsync('DELETE FROM categories WHERE raceId = ?', [id]);
      await sqliteDb.runAsync('DELETE FROM runners WHERE raceId = ?', [id]);
      await sqliteDb.runAsync('DELETE FROM timing_events WHERE raceId = ?', [id]);
      await sqliteDb.runAsync('DELETE FROM unassigned_marks WHERE raceId = ?', [id]);
      return;
    }
    const races = (await getJsonList<Race>(STORAGE_KEYS.RACES)).filter((r) => r.id !== id);
    const categories = (await getJsonList<Category>(STORAGE_KEYS.CATEGORIES)).filter((c) => c.raceId !== id);
    const runners = (await getJsonList<Runner>(STORAGE_KEYS.RUNNERS)).filter((r) => r.raceId !== id);
    const timing = (await getJsonList<TimingEvent>(STORAGE_KEYS.TIMING_EVENTS)).filter((t) => t.raceId !== id);
    const unassigned = (await getJsonList<UnassignedFinishMark>(STORAGE_KEYS.UNASSIGNED_MARKS)).filter((u: any) => u.raceId !== id);

    await setJsonList(STORAGE_KEYS.RACES, races);
    await setJsonList(STORAGE_KEYS.CATEGORIES, categories);
    await setJsonList(STORAGE_KEYS.RUNNERS, runners);
    await setJsonList(STORAGE_KEYS.TIMING_EVENTS, timing);
    await setJsonList(STORAGE_KEYS.UNASSIGNED_MARKS, unassigned);
  },

  // CATEGORIES
  async getCategoriesByRace(raceId: string): Promise<Category[]> {
    if (isNativeSqlite && sqliteDb) {
      return await sqliteDb.getAllAsync('SELECT * FROM categories WHERE raceId = ? ORDER BY name ASC', [raceId]);
    }
    const categories = await getJsonList<Category>(STORAGE_KEYS.CATEGORIES);
    return categories.filter((c) => c.raceId === raceId);
  },

  async saveCategory(category: Category): Promise<void> {
    if (isNativeSqlite && sqliteDb) {
      await sqliteDb.runAsync(
        `INSERT OR REPLACE INTO categories (
          id, raceId, name, code, minAge, maxAge, gender, startOffsetMs, color, createdAt, updatedAt, version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          category.id,
          category.raceId,
          category.name,
          category.code,
          category.minAge,
          category.maxAge,
          category.gender,
          category.startOffsetMs || 0,
          category.color,
          category.createdAt,
          category.updatedAt,
          category.version,
        ]
      );
      return;
    }
    const categories = await getJsonList<Category>(STORAGE_KEYS.CATEGORIES);
    const idx = categories.findIndex((c) => c.id === category.id);
    if (idx >= 0) {
      categories[idx] = category;
    } else {
      categories.push(category);
    }
    await setJsonList(STORAGE_KEYS.CATEGORIES, categories);
  },

  async saveCategoriesBulk(categories: Category[]): Promise<void> {
    for (const cat of categories) {
      await this.saveCategory(cat);
    }
  },

  async deleteCategory(id: string): Promise<void> {
    if (isNativeSqlite && sqliteDb) {
      await sqliteDb.runAsync('DELETE FROM categories WHERE id = ?', [id]);
      return;
    }
    const categories = (await getJsonList<Category>(STORAGE_KEYS.CATEGORIES)).filter((c) => c.id !== id);
    await setJsonList(STORAGE_KEYS.CATEGORIES, categories);
  },

  // RUNNERS
  async getRunnersByRace(raceId: string): Promise<Runner[]> {
    if (isNativeSqlite && sqliteDb) {
      return await sqliteDb.getAllAsync('SELECT * FROM runners WHERE raceId = ? ORDER BY CAST(bibNumber AS INTEGER) ASC, bibNumber ASC', [raceId]);
    }
    const runners = await getJsonList<Runner>(STORAGE_KEYS.RUNNERS);
    return runners
      .filter((r) => r.raceId === raceId)
      .sort((a, b) => {
        const numA = parseInt(a.bibNumber, 10);
        const numB = parseInt(b.bibNumber, 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.bibNumber.localeCompare(b.bibNumber);
      });
  },

  async saveRunner(runner: Runner): Promise<void> {
    if (isNativeSqlite && sqliteDb) {
      await sqliteDb.runAsync(
        `INSERT OR REPLACE INTO runners (
          id, raceId, bibNumber, firstName, lastName, gender, age, categoryId, team,
          status, wave, emergencyContactName, emergencyContactPhone, notes, createdAt, updatedAt, version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          runner.id,
          runner.raceId,
          runner.bibNumber.trim(),
          runner.firstName.trim(),
          runner.lastName.trim(),
          runner.gender,
          runner.age,
          runner.categoryId,
          runner.team || '',
          runner.status,
          runner.wave || 1,
          runner.emergencyContactName || '',
          runner.emergencyContactPhone || '',
          runner.notes || '',
          runner.createdAt,
          runner.updatedAt,
          runner.version,
        ]
      );
      return;
    }
    const runners = await getJsonList<Runner>(STORAGE_KEYS.RUNNERS);
    const idx = runners.findIndex((r) => r.id === runner.id);
    if (idx >= 0) {
      runners[idx] = runner;
    } else {
      runners.push(runner);
    }
    await setJsonList(STORAGE_KEYS.RUNNERS, runners);
  },

  async saveRunnersBulk(runners: Runner[]): Promise<void> {
    for (const runner of runners) {
      await this.saveRunner(runner);
    }
  },

  async deleteRunner(id: string): Promise<void> {
    if (isNativeSqlite && sqliteDb) {
      await sqliteDb.runAsync('DELETE FROM runners WHERE id = ?', [id]);
      await sqliteDb.runAsync('DELETE FROM timing_events WHERE runnerId = ?', [id]);
      return;
    }
    const runners = (await getJsonList<Runner>(STORAGE_KEYS.RUNNERS)).filter((r) => r.id !== id);
    const timing = (await getJsonList<TimingEvent>(STORAGE_KEYS.TIMING_EVENTS)).filter((t) => t.runnerId !== id);
    await setJsonList(STORAGE_KEYS.RUNNERS, runners);
    await setJsonList(STORAGE_KEYS.TIMING_EVENTS, timing);
  },

  // TIMING EVENTS
  async getTimingEventsByRace(raceId: string): Promise<TimingEvent[]> {
    if (isNativeSqlite && sqliteDb) {
      return await sqliteDb.getAllAsync(
        'SELECT * FROM timing_events WHERE raceId = ? ORDER BY timestampMs ASC',
        [raceId]
      );
    }
    const events = await getJsonList<TimingEvent>(STORAGE_KEYS.TIMING_EVENTS);
    return events
      .filter((e) => e.raceId === raceId)
      .sort((a, b) => a.timestampMs - b.timestampMs);
  },

  async saveTimingEvent(event: TimingEvent): Promise<void> {
    if (isNativeSqlite && sqliteDb) {
      await sqliteDb.runAsync(
        `INSERT OR REPLACE INTO timing_events (
          id, raceId, runnerId, bibNumber, station, timestampMs, elapsedTimeMs,
          recordedBy, deviceId, notes, isManualOverride, createdAt, version, syncStatus
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          event.id,
          event.raceId,
          event.runnerId,
          event.bibNumber.trim(),
          event.station,
          event.timestampMs,
          event.elapsedTimeMs,
          event.recordedBy,
          event.deviceId,
          event.notes || '',
          event.isManualOverride ? 1 : 0,
          event.createdAt,
          event.version,
          event.syncStatus,
        ]
      );
      return;
    }
    const events = await getJsonList<TimingEvent>(STORAGE_KEYS.TIMING_EVENTS);
    const idx = events.findIndex((e) => e.id === event.id);
    if (idx >= 0) {
      events[idx] = event;
    } else {
      events.push(event);
    }
    await setJsonList(STORAGE_KEYS.TIMING_EVENTS, events);
  },

  async deleteTimingEvent(id: string): Promise<void> {
    if (isNativeSqlite && sqliteDb) {
      await sqliteDb.runAsync('DELETE FROM timing_events WHERE id = ?', [id]);
      return;
    }
    const events = (await getJsonList<TimingEvent>(STORAGE_KEYS.TIMING_EVENTS)).filter((e) => e.id !== id);
    await setJsonList(STORAGE_KEYS.TIMING_EVENTS, events);
  },

  // UNASSIGNED MARKS (Fast Tap Queue)
  async getUnassignedMarks(raceId: string): Promise<UnassignedFinishMark[]> {
    if (isNativeSqlite && sqliteDb) {
      const rows = await sqliteDb.getAllAsync(
        'SELECT * FROM unassigned_marks WHERE raceId = ? AND assignedBib IS NULL ORDER BY timestampMs ASC',
        [raceId]
      );
      return rows as UnassignedFinishMark[];
    }
    const marks = await getJsonList<any>(STORAGE_KEYS.UNASSIGNED_MARKS);
    return marks.filter((m) => m.raceId === raceId && !m.assignedBib);
  },

  async saveUnassignedMark(raceId: string, mark: UnassignedFinishMark): Promise<void> {
    if (isNativeSqlite && sqliteDb) {
      await sqliteDb.runAsync(
        'INSERT OR REPLACE INTO unassigned_marks (id, raceId, timestampMs, elapsedTimeMs, assignedBib, recordedAt) VALUES (?, ?, ?, ?, ?, ?)',
        [mark.id, raceId, mark.timestampMs, mark.elapsedTimeMs, mark.assignedBib, mark.recordedAt]
      );
      return;
    }
    const marks = await getJsonList<any>(STORAGE_KEYS.UNASSIGNED_MARKS);
    marks.push({ ...mark, raceId });
    await setJsonList(STORAGE_KEYS.UNASSIGNED_MARKS, marks);
  },

  async updateUnassignedMarkBib(id: string, bib: string): Promise<void> {
    if (isNativeSqlite && sqliteDb) {
      await sqliteDb.runAsync('UPDATE unassigned_marks SET assignedBib = ? WHERE id = ?', [bib, id]);
      return;
    }
    const marks = await getJsonList<any>(STORAGE_KEYS.UNASSIGNED_MARKS);
    const target = marks.find((m) => m.id === id);
    if (target) {
      target.assignedBib = bib;
      await setJsonList(STORAGE_KEYS.UNASSIGNED_MARKS, marks);
    }
  },

  async deleteUnassignedMark(id: string): Promise<void> {
    if (isNativeSqlite && sqliteDb) {
      await sqliteDb.runAsync('DELETE FROM unassigned_marks WHERE id = ?', [id]);
      return;
    }
    const marks = (await getJsonList<any>(STORAGE_KEYS.UNASSIGNED_MARKS)).filter((m) => m.id !== id);
    await setJsonList(STORAGE_KEYS.UNASSIGNED_MARKS, marks);
  },

  // MUTATION LOG (For Future Server / Peer Sync)
  async recordMutation(record: MutationRecord): Promise<void> {
    if (isNativeSqlite && sqliteDb) {
      await sqliteDb.runAsync(
        'INSERT INTO mutation_log (id, entityType, entityId, action, payload, timestampMs, deviceId, synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [record.id, record.entityType, record.entityId, record.action, record.payload, record.timestampMs, record.deviceId, record.synced ? 1 : 0]
      );
      return;
    }
    const mutations = await getJsonList<MutationRecord>(STORAGE_KEYS.MUTATIONS);
    mutations.push(record);
    await setJsonList(STORAGE_KEYS.MUTATIONS, mutations);
  },

  async getPendingMutations(): Promise<MutationRecord[]> {
    if (isNativeSqlite && sqliteDb) {
      const rows = await sqliteDb.getAllAsync('SELECT * FROM mutation_log WHERE synced = 0 ORDER BY timestampMs ASC');
      return rows.map((r: any) => ({ ...r, synced: Boolean(r.synced) }));
    }
    const mutations = await getJsonList<MutationRecord>(STORAGE_KEYS.MUTATIONS);
    return mutations.filter((m) => !m.synced);
  },

  async markMutationsSynced(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    if (isNativeSqlite && sqliteDb) {
      const placeholders = ids.map(() => '?').join(',');
      await sqliteDb.runAsync(`UPDATE mutation_log SET synced = 1 WHERE id IN (${placeholders})`, ids);
      return;
    }
    const mutations = await getJsonList<MutationRecord>(STORAGE_KEYS.MUTATIONS);
    mutations.forEach((m) => {
      if (ids.includes(m.id)) m.synced = true;
    });
    await setJsonList(STORAGE_KEYS.MUTATIONS, mutations);
  },
};
