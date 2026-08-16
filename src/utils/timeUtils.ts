/**
 * Utility functions for precise race timing, pace calculation, and formatting.
 */

export function formatElapsedTime(ms: number | null | undefined, includeTenths = true): string {
  if (ms === null || ms === undefined || isNaN(ms) || ms < 0) {
    return '--:--';
  }

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((ms % 1000) / 100);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    const base = `${hours}:${pad(minutes)}:${pad(seconds)}`;
    return includeTenths ? `${base}.${tenths}` : base;
  }

  const base = `${pad(minutes)}:${pad(seconds)}`;
  return includeTenths ? `${base}.${tenths}` : base;
}

export function formatDigitalClock(ms: number): {
  hours: string;
  minutes: string;
  seconds: string;
  tenths: string;
  hasHours: boolean;
} {
  if (ms < 0 || isNaN(ms)) {
    return { hours: '00', minutes: '00', seconds: '00', tenths: '0', hasHours: false };
  }

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((ms % 1000) / 100).toString();

  const pad = (n: number) => n.toString().padStart(2, '0');

  return {
    hours: pad(hours),
    minutes: pad(minutes),
    seconds: pad(seconds),
    tenths,
    hasHours: hours > 0,
  };
}

export function calculatePace(elapsedMs: number, distanceMeters: number): {
  minKm: string;
  minMile: string;
} {
  if (!distanceMeters || distanceMeters <= 0 || !elapsedMs || elapsedMs <= 0) {
    return { minKm: '-:--', minMile: '-:--' };
  }

  const totalSeconds = elapsedMs / 1000;
  const km = distanceMeters / 1000;
  const miles = distanceMeters / 1609.344;

  const secondsPerKm = totalSeconds / km;
  const kmMinutes = Math.floor(secondsPerKm / 60);
  const kmSecs = Math.round(secondsPerKm % 60);

  const secondsPerMile = totalSeconds / miles;
  const mileMinutes = Math.floor(secondsPerMile / 60);
  const mileSecs = Math.round(secondsPerMile % 60);

  const pad = (n: number) => n.toString().padStart(2, '0');

  return {
    minKm: `${kmMinutes}:${pad(kmSecs)} /km`,
    minMile: `${mileMinutes}:${pad(mileSecs)} /mi`,
  };
}

export function formatTimeOfDay(epochMs: number | null | undefined): string {
  if (!epochMs) return '--:--:--';
  const date = new Date(epochMs);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function formatGapTime(gapMs: number): string {
  if (gapMs <= 0 || isNaN(gapMs)) return '-';
  const totalSeconds = Math.floor(gapMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((gapMs % 1000) / 100);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (minutes > 0) {
    return `+${minutes}:${pad(seconds)}.${tenths}`;
  }
  return `+${seconds}.${tenths}s`;
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
