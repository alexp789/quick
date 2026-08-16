import { Race, Category, Runner, TimingEvent } from '../types';
import { generateUUID } from './timeUtils';

export function createSampleRaceData(): {
  race: Race;
  categories: Category[];
  runners: Runner[];
  timingEvents: TimingEvent[];
} {
  const raceId = generateUUID();
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  const race: Race = {
    id: raceId,
    name: 'Pine Valley Community 5K Run',
    date: dateStr,
    distanceMeters: 5000,
    distanceLabel: '5K',
    location: 'Pine Valley Park, Trailhead A',
    notes: 'Annual community charity run. 2 loops around the lake.',
    status: 'completed',
    startType: 'mass',
    startTimeMs: Date.now() - 3600000, // 1 hour ago
    endTimeMs: Date.now() - 1200000,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    syncStatus: 'synced',
  };

  const catMOpen: Category = {
    id: generateUUID(),
    raceId,
    name: 'Male Open (19-39)',
    code: 'M_OPEN',
    minAge: 19,
    maxAge: 39,
    gender: 'M',
    startOffsetMs: 0,
    color: '#3B82F6', // Blue
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  };

  const catFOpen: Category = {
    id: generateUUID(),
    raceId,
    name: 'Female Open (19-39)',
    code: 'F_OPEN',
    minAge: 19,
    maxAge: 39,
    gender: 'F',
    startOffsetMs: 0,
    color: '#EC4899', // Pink
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  };

  const catM40: Category = {
    id: generateUUID(),
    raceId,
    name: 'Male Masters (40+)',
    code: 'M_40+',
    minAge: 40,
    maxAge: 99,
    gender: 'M',
    startOffsetMs: 0,
    color: '#10B981', // Green
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  };

  const catF40: Category = {
    id: generateUUID(),
    raceId,
    name: 'Female Masters (40+)',
    code: 'F_40+',
    minAge: 40,
    maxAge: 99,
    gender: 'F',
    startOffsetMs: 0,
    color: '#8B5CF6', // Purple
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  };

  const catJunior: Category = {
    id: generateUUID(),
    raceId,
    name: 'Junior Youth (Under 18)',
    code: 'JUNIOR',
    minAge: 0,
    maxAge: 18,
    gender: 'ALL',
    startOffsetMs: 0,
    color: '#F59E0B', // Amber
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  };

  const categories = [catMOpen, catFOpen, catM40, catF40, catJunior];

  const sampleRunnersRaw = [
    { bib: '101', first: 'Marcus', last: 'Vance', gender: 'M' as const, age: 28, cat: catMOpen, team: 'Valley Striders', offsetSec: 1042 }, // 17:22
    { bib: '102', first: 'Elena', last: 'Rostova', gender: 'F' as const, age: 26, cat: catFOpen, team: 'Harbor Track Club', offsetSec: 1115 }, // 18:35
    { bib: '103', first: 'David', last: 'Chen', gender: 'M' as const, age: 44, cat: catM40, team: 'Metro Road Runners', offsetSec: 1148 }, // 19:08
    { bib: '104', first: 'Sarah', last: 'Jenkins', gender: 'F' as const, age: 31, cat: catFOpen, team: 'Valley Striders', offsetSec: 1192 }, // 19:52
    { bib: '105', first: 'Liam', last: 'O\'Connor', gender: 'M' as const, age: 16, cat: catJunior, team: 'High School XC', offsetSec: 1224 }, // 20:24
    { bib: '106', first: 'Arthur', last: 'Pendleton', gender: 'M' as const, age: 52, cat: catM40, team: 'Pine Valley Harriers', offsetSec: 1270 }, // 21:10
    { bib: '107', first: 'Rachel', last: 'Kim', gender: 'F' as const, age: 42, cat: catF40, team: 'Metro Road Runners', offsetSec: 1312 }, // 21:52
    { bib: '108', first: 'James', last: 'Wilson', gender: 'M' as const, age: 34, cat: catMOpen, team: '', offsetSec: 1365 }, // 22:45
    { bib: '109', first: 'Maya', last: 'Patel', gender: 'F' as const, age: 15, cat: catJunior, team: 'High School XC', offsetSec: 1410 }, // 23:30
    { bib: '110', first: 'Carlos', last: 'Gomez', gender: 'M' as const, age: 29, cat: catMOpen, team: 'Oakwood Runners', offsetSec: 1458 }, // 24:18
    { bib: '111', first: 'Hannah', last: 'Scott', gender: 'F' as const, age: 38, cat: catFOpen, team: 'Valley Striders', offsetSec: 1520 }, // 25:20
    { bib: '112', first: 'Robert', last: 'Taylor', gender: 'M' as const, age: 48, cat: catM40, team: '', offsetSec: 1595 }, // 26:35
    { bib: '113', first: 'Chloe', last: 'Bennett', gender: 'F' as const, age: 46, cat: catF40, team: 'Pine Valley Harriers', offsetSec: 1680 }, // 28:00
    { bib: '114', first: 'Samuel', last: 'Adams', gender: 'M' as const, age: 22, cat: catMOpen, team: '', offsetSec: 1740 }, // 29:00
    { bib: '115', first: 'Grace', last: 'Hopper', gender: 'F' as const, age: 60, cat: catF40, team: 'Masters Athletics', offsetSec: 1890 }, // 31:30
  ];

  const runners: Runner[] = [];
  const timingEvents: TimingEvent[] = [];

  sampleRunnersRaw.forEach((r) => {
    const runnerId = generateUUID();
    const elapsedMs = r.offsetSec * 1000;
    const finishTimestamp = (race.startTimeMs || Date.now()) + elapsedMs;

    const runner: Runner = {
      id: runnerId,
      raceId,
      bibNumber: r.bib,
      firstName: r.first,
      lastName: r.last,
      gender: r.gender,
      age: r.age,
      categoryId: r.cat.id,
      team: r.team,
      status: 'finished',
      wave: 1,
      emergencyContactName: 'Emergency Contact',
      emergencyContactPhone: '555-0199',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };
    runners.push(runner);

    const timing: TimingEvent = {
      id: generateUUID(),
      raceId,
      runnerId,
      bibNumber: r.bib,
      station: 'FINISH',
      timestampMs: finishTimestamp,
      elapsedTimeMs: elapsedMs,
      recordedBy: 'marshal_1',
      deviceId: 'device_primary',
      notes: '',
      isManualOverride: false,
      createdAt: new Date(finishTimestamp).toISOString(),
      version: 1,
      syncStatus: 'synced',
    };
    timingEvents.push(timing);
  });

  return { race, categories, runners, timingEvents };
}
