import { useMemo } from 'react';
import { Race, Category, Runner, TimingEvent, RaceResult, RaceStatistics } from '../types';
import { formatElapsedTime, calculatePace, formatGapTime } from '../utils/timeUtils';

export function useRaceResults(
  race: Race | null,
  categories: Category[],
  runners: Runner[],
  timingEvents: TimingEvent[]
) {
  return useMemo(() => {
    if (!race) {
      return {
        results: [],
        statistics: getEmptyStats(),
        teamStandings: [],
      };
    }

    const categoryMap = new Map<string, Category>();
    categories.forEach((c) => categoryMap.set(c.id, c));

    // Map of latest finish timing event per bib
    const finishEventsByBib = new Map<string, TimingEvent>();
    timingEvents
      .filter((t) => t.station === 'FINISH')
      .forEach((t) => {
        // Take the earliest valid finish time for each bib
        const existing = finishEventsByBib.get(t.bibNumber);
        if (!existing || t.timestampMs < existing.timestampMs) {
          finishEventsByBib.set(t.bibNumber, t);
        }
      });

    // Build runner results list
    const registeredRunnersByBib = new Map<string, Runner>();
    runners.forEach((r) => registeredRunnersByBib.set(r.bibNumber, r));

    // Find any un-enrolled bibs that crossed the finish line
    const allBibs = new Set<string>([
      ...runners.map((r) => r.bibNumber),
      ...Array.from(finishEventsByBib.keys()),
    ]);

    const rawList: {
      runner: Runner;
      timing: TimingEvent | null;
      category: Category | null;
      gunTimeMs: number | null;
      netTimeMs: number | null;
      status: Runner['status'];
    }[] = [];

    allBibs.forEach((bib) => {
      const runner = registeredRunnersByBib.get(bib) || {
        id: `guest_${bib}`,
        raceId: race.id,
        bibNumber: bib,
        firstName: `Runner`,
        lastName: `#${bib}`,
        gender: 'U',
        age: null,
        categoryId: categories[0]?.id || 'unknown',
        team: '',
        status: 'registered',
        wave: 1,
        emergencyContactName: '',
        emergencyContactPhone: '',
        notes: 'Encountered at finish line',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      };

      const timing = finishEventsByBib.get(bib) || null;
      const category = categoryMap.get(runner.categoryId) || null;
      const waveOffsetMs = category?.startOffsetMs || 0;

      let status = runner.status;
      if (timing) {
        status = 'finished';
      }

      let gunTimeMs: number | null = null;
      let netTimeMs: number | null = null;

      if (timing) {
        gunTimeMs = timing.elapsedTimeMs;
        netTimeMs = Math.max(0, gunTimeMs - waveOffsetMs);
      }

      rawList.push({
        runner,
        timing,
        category,
        gunTimeMs,
        netTimeMs,
        status,
      });
    });

    // Split finishers and non-finishers
    const finishers = rawList
      .filter((item) => item.gunTimeMs !== null && item.status === 'finished')
      .sort((a, b) => (a.gunTimeMs! - b.gunTimeMs!));

    const nonFinishers = rawList.filter((item) => item.gunTimeMs === null || item.status !== 'finished');

    const firstTimeMs = finishers.length > 0 ? finishers[0].gunTimeMs! : 0;

    // Track category ranks & gender ranks
    const catRankCounts = new Map<string, number>();
    const genderRankCounts = new Map<string, number>();

    const results: RaceResult[] = [];

    finishers.forEach((item, index) => {
      const overallRank = index + 1;
      const catId = item.category?.id || 'unknown';
      const catCurrent = (catRankCounts.get(catId) || 0) + 1;
      catRankCounts.set(catId, catCurrent);

      const gender = item.runner.gender || 'U';
      const genderCurrent = (genderRankCounts.get(gender) || 0) + 1;
      genderRankCounts.set(gender, genderCurrent);

      const gunMs = item.gunTimeMs!;
      const netMs = item.netTimeMs!;
      const gapMs = gunMs - firstTimeMs;
      const paces = calculatePace(gunMs, race.distanceMeters);

      results.push({
        rank: overallRank,
        categoryRank: catCurrent,
        genderRank: genderCurrent,
        runnerId: item.runner.id,
        bibNumber: item.runner.bibNumber,
        firstName: item.runner.firstName,
        lastName: item.runner.lastName,
        fullName: `${item.runner.firstName} ${item.runner.lastName}`.trim(),
        gender: item.runner.gender,
        age: item.runner.age,
        categoryId: catId,
        categoryName: item.category?.name || 'Open',
        categoryColor: item.category?.color || '#3B82F6',
        team: item.runner.team || '',
        gunTimeMs: gunMs,
        netTimeMs: netMs,
        formattedGunTime: formatElapsedTime(gunMs),
        formattedNetTime: formatElapsedTime(netMs),
        formattedPaceMinKm: paces.minKm,
        formattedPaceMinMile: paces.minMile,
        gapToFirstMs: gapMs,
        formattedGap: formatGapTime(gapMs),
        status: 'finished',
        timingEventId: item.timing?.id || '',
        timestampMs: item.timing?.timestampMs || 0,
      });
    });

    // Add DNF / DNS / In-progress runners
    nonFinishers.forEach((item) => {
      results.push({
        rank: 0,
        categoryRank: 0,
        genderRank: 0,
        runnerId: item.runner.id,
        bibNumber: item.runner.bibNumber,
        firstName: item.runner.firstName,
        lastName: item.runner.lastName,
        fullName: `${item.runner.firstName} ${item.runner.lastName}`.trim(),
        gender: item.runner.gender,
        age: item.runner.age,
        categoryId: item.category?.id || 'unknown',
        categoryName: item.category?.name || 'Open',
        categoryColor: item.category?.color || '#94A3B8',
        team: item.runner.team || '',
        gunTimeMs: 0,
        netTimeMs: 0,
        formattedGunTime: item.status.toUpperCase(),
        formattedNetTime: '-',
        formattedPaceMinKm: '-',
        formattedPaceMinMile: '-',
        gapToFirstMs: 0,
        formattedGap: '-',
        status: item.status,
        timingEventId: '',
        timestampMs: 0,
      });
    });

    // Compute Race Statistics
    const totalRegistered = runners.length;
    const finishersCount = finishers.length;
    const dnfCount = runners.filter((r) => r.status === 'dnf').length;
    const dnsCount = runners.filter((r) => r.status === 'dns').length;
    const inProgressCount = Math.max(0, totalRegistered - finishersCount - dnfCount - dnsCount);

    const finishTimes = finishers.map((f) => f.gunTimeMs!);
    const fastestTimeMs = finishTimes.length > 0 ? Math.min(...finishTimes) : null;
    const slowestTimeMs = finishTimes.length > 0 ? Math.max(...finishTimes) : null;
    const averageTimeMs =
      finishTimes.length > 0
        ? Math.round(finishTimes.reduce((a, b) => a + b, 0) / finishTimes.length)
        : null;

    let medianTimeMs: number | null = null;
    if (finishTimes.length > 0) {
      const mid = Math.floor(finishTimes.length / 2);
      medianTimeMs =
        finishTimes.length % 2 !== 0
          ? finishTimes[mid]
          : Math.round((finishTimes[mid - 1] + finishTimes[mid]) / 2);
    }

    const finishRatePercentage =
      totalRegistered > 0 ? Math.round((finishersCount / totalRegistered) * 100) : 0;

    const statistics: RaceStatistics = {
      totalRegistered,
      starters: totalRegistered - dnsCount,
      finishers: finishersCount,
      dnfCount,
      dnsCount,
      inProgressCount,
      fastestTimeMs,
      slowestTimeMs,
      averageTimeMs,
      medianTimeMs,
      finishRatePercentage,
    };

    // Compute Team Standings (Cross country scoring: sum of top 3 finishers per team)
    const teamMap = new Map<string, RaceResult[]>();
    results
      .filter((r) => r.status === 'finished' && r.team && r.team.trim().length > 0)
      .forEach((r) => {
        const list = teamMap.get(r.team) || [];
        list.push(r);
        teamMap.set(r.team, list);
      });

    const teamStandings = Array.from(teamMap.entries())
      .map(([teamName, teamRunners]) => {
        const topRunners = teamRunners.slice(0, 3);
        const totalScore = topRunners.reduce((acc, curr) => acc + curr.rank, 0);
        const totalTimeMs = topRunners.reduce((acc, curr) => acc + curr.gunTimeMs, 0);
        return {
          teamName,
          runnerCount: teamRunners.length,
          topRunnersCount: topRunners.length,
          score: totalScore,
          totalTimeMs,
          formattedTotalTime: formatElapsedTime(totalTimeMs),
          runners: teamRunners,
        };
      })
      .filter((t) => t.topRunnersCount >= 2) // At least 2 runners to qualify
      .sort((a, b) => a.score - b.score);

    return {
      results,
      statistics,
      teamStandings,
    };
  }, [race, categories, runners, timingEvents]);
}

function getEmptyStats(): RaceStatistics {
  return {
    totalRegistered: 0,
    starters: 0,
    finishers: 0,
    dnfCount: 0,
    dnsCount: 0,
    inProgressCount: 0,
    fastestTimeMs: null,
    slowestTimeMs: null,
    averageTimeMs: null,
    medianTimeMs: null,
    finishRatePercentage: 0,
  };
}
