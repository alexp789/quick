import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Race, Category, Runner, TimingEvent, UnassignedFinishMark, RacePackageBackup, RunnerStatus } from '../types';
import { db, initDatabase } from '../storage/database';
import { generateUUID } from '../utils/timeUtils';
import { triggerHaptic } from '../utils/hapticsUtils';
import { soundManager } from '../utils/soundUtils';
import { createSampleRaceData } from '../utils/sampleData';

interface RaceContextType {
  races: Race[];
  activeRace: Race | null;
  categories: Category[];
  runners: Runner[];
  timingEvents: TimingEvent[];
  unassignedMarks: UnassignedFinishMark[];
  isLoading: boolean;
  activeDeviceId: string;

  // Race Management
  selectRace: (raceId: string) => Promise<void>;
  deselectRace: () => void;
  createRace: (data: Partial<Race>) => Promise<Race>;
  updateRace: (race: Race) => Promise<void>;
  deleteRace: (raceId: string) => Promise<void>;
  startRace: (customStartMs?: number) => Promise<void>;
  finishRace: () => Promise<void>;
  resetRaceTimer: () => Promise<void>;

  // Fast-Tap & Bib Timing
  recordFinishBib: (bibNumber: string, customTimeMs?: number, notes?: string) => Promise<{ success: boolean; message: string; runner?: Runner; timing?: TimingEvent }>;
  recordFastTapFinishMark: () => Promise<UnassignedFinishMark>;
  assignMarkToBib: (markId: string, bibNumber: string) => Promise<boolean>;
  deleteUnassignedMark: (markId: string) => Promise<void>;
  deleteTimingEvent: (eventId: string) => Promise<void>;
  updateTimingEvent: (eventId: string, newBib: string, newElapsedMs: number) => Promise<void>;

  // Categories
  addCategory: (data: Partial<Category>) => Promise<Category>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;

  // Runners
  addRunner: (data: Partial<Runner>) => Promise<Runner>;
  updateRunner: (runner: Runner) => Promise<void>;
  deleteRunner: (runnerId: string) => Promise<void>;
  importRunners: (runnersList: Partial<Runner>[]) => Promise<{ addedCount: number; updatedCount: number }>;
  setRunnerStatus: (runnerId: string, status: RunnerStatus) => Promise<void>;

  // Backup & Samples
  loadSampleRace: () => Promise<void>;
  exportRaceBackup: () => Promise<RacePackageBackup | null>;
  importRaceBackup: (backup: RacePackageBackup) => Promise<void>;
  refreshAll: () => Promise<void>;
}

const RaceContext = createContext<RaceContextType | undefined>(undefined);

export const RaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [races, setRaces] = useState<Race[]>([]);
  const [activeRace, setActiveRace] = useState<Race | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [runners, setRunners] = useState<Runner[]>([]);
  const [timingEvents, setTimingEvents] = useState<TimingEvent[]>([]);
  const [unassignedMarks, setUnassignedMarks] = useState<UnassignedFinishMark[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeDeviceId] = useState<string>(() => `marshal_${Math.floor(1000 + Math.random() * 9000)}`);

  // Initialize DB & Load Initial Data
  const refreshAll = useCallback(async () => {
    try {
      const allRaces = await db.getAllRaces();
      setRaces(allRaces);

      if (activeRace?.id) {
        const current = allRaces.find((r) => r.id === activeRace.id);
        if (current) {
          setActiveRace(current);
          await loadRaceSubData(current.id);
        } else {
          setActiveRace(null);
          setCategories([]);
          setRunners([]);
          setTimingEvents([]);
          setUnassignedMarks([]);
        }
      } else {
        // Initially no race is selected
        setActiveRace(null);
        setCategories([]);
        setRunners([]);
        setTimingEvents([]);
        setUnassignedMarks([]);
      }
    } catch (e) {
      console.warn('Failed to refresh data:', e);
    } finally {
      setIsLoading(false);
    }
  }, [activeRace?.id]);

  const loadRaceSubData = async (raceId: string) => {
    const [cats, runns, events, marks] = await Promise.all([
      db.getCategoriesByRace(raceId),
      db.getRunnersByRace(raceId),
      db.getTimingEventsByRace(raceId),
      db.getUnassignedMarks(raceId),
    ]);
    setCategories(cats);
    setRunners(runns);
    setTimingEvents(events);
    setUnassignedMarks(marks);
  };

  useEffect(() => {
    initDatabase().then(() => {
      refreshAll();
    });
  }, []);

  const selectRace = async (raceId: string) => {
    const target = races.find((r) => r.id === raceId) || (await db.getRaceById(raceId));
    if (target) {
      setActiveRace(target);
      await loadRaceSubData(target.id);
    }
  };

  const deselectRace = () => {
    setActiveRace(null);
    setCategories([]);
    setRunners([]);
    setTimingEvents([]);
    setUnassignedMarks([]);
  };

  // CREATE RACE
  const createRace = async (data: Partial<Race>): Promise<Race> => {
    const raceId = data.id || generateUUID();
    const newRace: Race = {
      id: raceId,
      name: data.name?.trim() || 'Community 5K Race',
      date: data.date || new Date().toISOString().split('T')[0],
      distanceMeters: data.distanceMeters || 5000,
      distanceLabel: data.distanceLabel || '5K',
      location: data.location?.trim() || '',
      notes: data.notes || '',
      status: 'ready',
      startType: data.startType || 'mass',
      startTimeMs: null,
      endTimeMs: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      syncStatus: 'synced',
    };

    await db.saveRace(newRace);

    // Create default starter categories
    const defaultCats: Category[] = [
      {
        id: generateUUID(),
        raceId,
        name: 'Male Open',
        code: 'M_OPEN',
        minAge: 0,
        maxAge: 99,
        gender: 'M',
        startOffsetMs: 0,
        color: '#3B82F6',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      },
      {
        id: generateUUID(),
        raceId,
        name: 'Female Open',
        code: 'F_OPEN',
        minAge: 0,
        maxAge: 99,
        gender: 'F',
        startOffsetMs: 0,
        color: '#EC4899',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      },
      {
        id: generateUUID(),
        raceId,
        name: 'Open / Non-Binary',
        code: 'OPEN',
        minAge: 0,
        maxAge: 99,
        gender: 'ALL',
        startOffsetMs: 0,
        color: '#10B981',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      },
    ];

    await db.saveCategoriesBulk(defaultCats);

    await db.recordMutation({
      id: generateUUID(),
      entityType: 'race',
      entityId: raceId,
      action: 'INSERT',
      payload: JSON.stringify(newRace),
      timestampMs: Date.now(),
      deviceId: activeDeviceId,
      synced: false,
    });

    await refreshAll();
    setActiveRace(newRace);
    await loadRaceSubData(raceId);
    return newRace;
  };

  // UPDATE RACE
  const updateRace = async (race: Race) => {
    const updated = { ...race, updatedAt: new Date().toISOString(), version: race.version + 1 };
    await db.saveRace(updated);
    setActiveRace(updated);
    setRaces((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));

    await db.recordMutation({
      id: generateUUID(),
      entityType: 'race',
      entityId: updated.id,
      action: 'UPDATE',
      payload: JSON.stringify(updated),
      timestampMs: Date.now(),
      deviceId: activeDeviceId,
      synced: false,
    });
  };

  // DELETE RACE
  const deleteRace = async (raceId: string) => {
    await db.deleteRace(raceId);
    await db.recordMutation({
      id: generateUUID(),
      entityType: 'race',
      entityId: raceId,
      action: 'DELETE',
      payload: JSON.stringify({ id: raceId }),
      timestampMs: Date.now(),
      deviceId: activeDeviceId,
      synced: false,
    });
    await refreshAll();
  };

  // START RACE (Gun start)
  const startRace = async (customStartMs?: number) => {
    if (!activeRace) return;
    const startMs = customStartMs || Date.now();
    const updated: Race = {
      ...activeRace,
      status: 'in_progress',
      startTimeMs: startMs,
      endTimeMs: null,
      updatedAt: new Date().toISOString(),
    };
    await db.saveRace(updated);
    setActiveRace(updated);
    setRaces((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    soundManager.playGunStartSound();
    triggerHaptic('success');
  };

  // FINISH RACE
  const finishRace = async () => {
    if (!activeRace) return;
    const updated: Race = {
      ...activeRace,
      status: 'completed',
      endTimeMs: Date.now(),
      updatedAt: new Date().toISOString(),
    };
    await db.saveRace(updated);
    setActiveRace(updated);
    setRaces((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    triggerHaptic('medium');
  };

  // RESET TIMER
  const resetRaceTimer = async () => {
    if (!activeRace) return;
    const updated: Race = {
      ...activeRace,
      status: 'ready',
      startTimeMs: null,
      endTimeMs: null,
      updatedAt: new Date().toISOString(),
    };
    await db.saveRace(updated);
    setActiveRace(updated);
    setRaces((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    triggerHaptic('warning');
  };

  // RECORD BIB FINISH
  const recordFinishBib = async (
    bibNumber: string,
    customElapsedMs?: number,
    notes?: string
  ): Promise<{ success: boolean; message: string; runner?: Runner; timing?: TimingEvent }> => {
    if (!activeRace) {
      return { success: false, message: 'No active race selected.' };
    }

    const cleanBib = bibNumber.trim();
    if (!cleanBib) {
      return { success: false, message: 'Bib number cannot be empty.' };
    }

    const now = Date.now();
    let elapsedMs = 0;

    if (customElapsedMs !== undefined) {
      elapsedMs = customElapsedMs;
    } else if (activeRace.startTimeMs) {
      elapsedMs = Math.max(0, now - activeRace.startTimeMs);
    } else {
      elapsedMs = 0;
    }

    // Check if runner registered
    let runner = runners.find((r) => r.bibNumber.toLowerCase() === cleanBib.toLowerCase());

    if (!runner) {
      // Auto-create guest runner if unknown bib
      const newGuest: Runner = {
        id: generateUUID(),
        raceId: activeRace.id,
        bibNumber: cleanBib,
        firstName: 'Runner',
        lastName: `#${cleanBib}`,
        gender: 'U',
        age: null,
        categoryId: categories[0]?.id || 'unknown',
        team: '',
        status: 'finished',
        wave: 1,
        emergencyContactName: '',
        emergencyContactPhone: '',
        notes: 'Unregistered bib captured at finish line',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      };
      await db.saveRunner(newGuest);
      setRunners((prev) => [...prev, newGuest]);
      runner = newGuest;
    } else {
      // Update runner status to finished
      const updatedRunner: Runner = {
        ...runner,
        status: 'finished',
        updatedAt: new Date().toISOString(),
      };
      await db.saveRunner(updatedRunner);
      setRunners((prev) => prev.map((r) => (r.id === updatedRunner.id ? updatedRunner : r)));
      runner = updatedRunner;
    }

    const timingEvent: TimingEvent = {
      id: generateUUID(),
      raceId: activeRace.id,
      runnerId: runner.id,
      bibNumber: cleanBib,
      station: 'FINISH',
      timestampMs: activeRace.startTimeMs ? activeRace.startTimeMs + elapsedMs : now,
      elapsedTimeMs: elapsedMs,
      recordedBy: activeDeviceId,
      deviceId: activeDeviceId,
      notes: notes || '',
      isManualOverride: customElapsedMs !== undefined,
      createdAt: new Date().toISOString(),
      version: 1,
      syncStatus: 'synced',
    };

    await db.saveTimingEvent(timingEvent);
    setTimingEvents((prev) => [...prev, timingEvent]);

    await db.recordMutation({
      id: generateUUID(),
      entityType: 'timing_event',
      entityId: timingEvent.id,
      action: 'INSERT',
      payload: JSON.stringify(timingEvent),
      timestampMs: now,
      deviceId: activeDeviceId,
      synced: false,
    });

    soundManager.playFinishSound();
    triggerHaptic('success');

    return {
      success: true,
      message: `Bib #${cleanBib} recorded!`,
      runner,
      timing: timingEvent,
    };
  };

  // RECORD FAST TAP FINISH MARK (Split-second crowd queue)
  const recordFastTapFinishMark = async (): Promise<UnassignedFinishMark> => {
    if (!activeRace) throw new Error('No active race');
    const now = Date.now();
    const elapsedMs = activeRace.startTimeMs ? Math.max(0, now - activeRace.startTimeMs) : 0;

    const mark: UnassignedFinishMark = {
      id: generateUUID(),
      timestampMs: now,
      elapsedTimeMs: elapsedMs,
      assignedBib: null,
      recordedAt: new Date().toISOString(),
    };

    await db.saveUnassignedMark(activeRace.id, mark);
    setUnassignedMarks((prev) => [...prev, mark]);

    soundManager.playBeep(1100, 0.08);
    triggerHaptic('medium');

    return mark;
  };

  // ASSIGN MARK TO BIB
  const assignMarkToBib = async (markId: string, bibNumber: string): Promise<boolean> => {
    const mark = unassignedMarks.find((m) => m.id === markId);
    if (!mark || !activeRace) return false;

    // Record finish with the mark's exact timestamp
    const res = await recordFinishBib(bibNumber, mark.elapsedTimeMs, 'Recorded via Fast-Tap queue');
    if (res.success) {
      await db.updateUnassignedMarkBib(markId, bibNumber);
      setUnassignedMarks((prev) => prev.filter((m) => m.id !== markId));
      return true;
    }
    return false;
  };

  // DELETE UNASSIGNED MARK
  const deleteUnassignedMark = async (markId: string) => {
    await db.deleteUnassignedMark(markId);
    setUnassignedMarks((prev) => prev.filter((m) => m.id !== markId));
    triggerHaptic('light');
  };

  // DELETE TIMING EVENT
  const deleteTimingEvent = async (eventId: string) => {
    await db.deleteTimingEvent(eventId);
    setTimingEvents((prev) => prev.filter((e) => e.id !== eventId));
    triggerHaptic('light');
  };

  // UPDATE TIMING EVENT
  const updateTimingEvent = async (eventId: string, newBib: string, newElapsedMs: number) => {
    const target = timingEvents.find((e) => e.id === eventId);
    if (!target || !activeRace) return;

    const updated: TimingEvent = {
      ...target,
      bibNumber: newBib.trim(),
      elapsedTimeMs: newElapsedMs,
      timestampMs: (activeRace.startTimeMs || Date.now()) + newElapsedMs,
      isManualOverride: true,
      version: target.version + 1,
    };

    await db.saveTimingEvent(updated);
    setTimingEvents((prev) => prev.map((e) => (e.id === eventId ? updated : e)));
    triggerHaptic('success');
  };

  // CATEGORIES CRUD
  const addCategory = async (data: Partial<Category>): Promise<Category> => {
    if (!activeRace) throw new Error('No active race');
    const cat: Category = {
      id: data.id || generateUUID(),
      raceId: activeRace.id,
      name: data.name?.trim() || 'New Category',
      code: data.code?.trim().toUpperCase() || 'CAT',
      minAge: data.minAge ?? null,
      maxAge: data.maxAge ?? null,
      gender: data.gender || 'ALL',
      startOffsetMs: data.startOffsetMs || 0,
      color: data.color || '#3B82F6',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };
    await db.saveCategory(cat);
    setCategories((prev) => [...prev, cat]);
    return cat;
  };

  const updateCategory = async (category: Category) => {
    const updated = { ...category, updatedAt: new Date().toISOString(), version: category.version + 1 };
    await db.saveCategory(updated);
    setCategories((prev) => prev.map((c) => (c.id === category.id ? updated : c)));
  };

  const deleteCategory = async (categoryId: string) => {
    await db.deleteCategory(categoryId);
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
  };

  // RUNNERS CRUD
  const addRunner = async (data: Partial<Runner>): Promise<Runner> => {
    if (!activeRace) throw new Error('No active race');
    const runner: Runner = {
      id: data.id || generateUUID(),
      raceId: activeRace.id,
      bibNumber: data.bibNumber?.trim() || '',
      firstName: data.firstName?.trim() || 'Runner',
      lastName: data.lastName?.trim() || '',
      gender: data.gender || 'U',
      age: data.age ?? null,
      categoryId: data.categoryId || categories[0]?.id || 'unknown',
      team: data.team?.trim() || '',
      status: data.status || 'registered',
      wave: data.wave || 1,
      emergencyContactName: data.emergencyContactName?.trim() || '',
      emergencyContactPhone: data.emergencyContactPhone?.trim() || '',
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };
    await db.saveRunner(runner);
    setRunners((prev) => [...prev, runner]);
    return runner;
  };

  const updateRunner = async (runner: Runner) => {
    const updated = { ...runner, updatedAt: new Date().toISOString(), version: runner.version + 1 };
    await db.saveRunner(updated);
    setRunners((prev) => prev.map((r) => (r.id === runner.id ? updated : r)));
  };

  const deleteRunner = async (runnerId: string) => {
    await db.deleteRunner(runnerId);
    setRunners((prev) => prev.filter((r) => r.id !== runnerId));
    setTimingEvents((prev) => prev.filter((e) => e.runnerId !== runnerId));
  };

  const importRunners = async (
    runnersList: Partial<Runner>[]
  ): Promise<{ addedCount: number; updatedCount: number }> => {
    if (!activeRace) return { addedCount: 0, updatedCount: 0 };
    let addedCount = 0;
    let updatedCount = 0;

    const existingMap = new Map<string, Runner>();
    runners.forEach((r) => existingMap.set(r.bibNumber.toLowerCase(), r));

    for (const r of runnersList) {
      if (!r.bibNumber) continue;
      const existing = existingMap.get(r.bibNumber.toLowerCase());
      if (existing) {
        const updated: Runner = {
          ...existing,
          firstName: r.firstName || existing.firstName,
          lastName: r.lastName !== undefined ? r.lastName : existing.lastName,
          gender: r.gender || existing.gender,
          age: r.age !== undefined ? r.age : existing.age,
          categoryId: r.categoryId || existing.categoryId,
          team: r.team !== undefined ? r.team : existing.team,
          updatedAt: new Date().toISOString(),
          version: existing.version + 1,
        };
        await db.saveRunner(updated);
        updatedCount++;
      } else {
        const newRunner: Runner = {
          id: generateUUID(),
          raceId: activeRace.id,
          bibNumber: r.bibNumber.trim(),
          firstName: r.firstName?.trim() || `Runner ${r.bibNumber}`,
          lastName: r.lastName?.trim() || '',
          gender: r.gender || 'U',
          age: r.age ?? null,
          categoryId: r.categoryId || categories[0]?.id || 'unknown',
          team: r.team?.trim() || '',
          status: 'registered',
          wave: r.wave || 1,
          emergencyContactName: r.emergencyContactName || '',
          emergencyContactPhone: r.emergencyContactPhone || '',
          notes: r.notes || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
        };
        await db.saveRunner(newRunner);
        addedCount++;
      }
    }

    await loadRaceSubData(activeRace.id);
    return { addedCount, updatedCount };
  };

  const setRunnerStatus = async (runnerId: string, status: RunnerStatus) => {
    const runner = runners.find((r) => r.id === runnerId);
    if (!runner) return;
    const updated = { ...runner, status, updatedAt: new Date().toISOString() };
    await db.saveRunner(updated);
    setRunners((prev) => prev.map((r) => (r.id === runnerId ? updated : r)));
  };

  // LOAD SAMPLE RACE
  const loadSampleRace = async () => {
    const sample = createSampleRaceData();
    await db.saveRace(sample.race);
    await db.saveCategoriesBulk(sample.categories);
    await db.saveRunnersBulk(sample.runners);
    for (const t of sample.timingEvents) {
      await db.saveTimingEvent(t);
    }
    await refreshAll();
    setActiveRace(sample.race);
    await loadRaceSubData(sample.race.id);
    triggerHaptic('success');
  };

  // EXPORT RACE BACKUP BUNDLE
  const exportRaceBackup = async (): Promise<RacePackageBackup | null> => {
    if (!activeRace) return null;
    return {
      exportVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      race: activeRace,
      categories,
      runners,
      timingEvents,
      unassignedMarks,
    };
  };

  // IMPORT RACE BACKUP BUNDLE
  const importRaceBackup = async (backup: RacePackageBackup) => {
    if (!backup.race) return;
    await db.saveRace(backup.race);
    await db.saveCategoriesBulk(backup.categories || []);
    await db.saveRunnersBulk(backup.runners || []);
    for (const t of backup.timingEvents || []) {
      await db.saveTimingEvent(t);
    }
    await refreshAll();
    setActiveRace(backup.race);
    await loadRaceSubData(backup.race.id);
    triggerHaptic('success');
  };

  return (
    <RaceContext.Provider
      value={{
        races,
        activeRace,
        categories,
        runners,
        timingEvents,
        unassignedMarks,
        isLoading,
        activeDeviceId,
        selectRace,
        deselectRace,
        createRace,
        updateRace,
        deleteRace,
        startRace,
        finishRace,
        resetRaceTimer,
        recordFinishBib,
        recordFastTapFinishMark,
        assignMarkToBib,
        deleteUnassignedMark,
        deleteTimingEvent,
        updateTimingEvent,
        addCategory,
        updateCategory,
        deleteCategory,
        addRunner,
        updateRunner,
        deleteRunner,
        importRunners,
        setRunnerStatus,
        loadSampleRace,
        exportRaceBackup,
        importRaceBackup,
        refreshAll,
      }}
    >
      {children}
    </RaceContext.Provider>
  );
};

export const useRaceContext = () => {
  const context = useContext(RaceContext);
  if (!context) {
    throw new Error('useRaceContext must be used within a RaceProvider');
  }
  return context;
};
