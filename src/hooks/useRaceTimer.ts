import { useState, useEffect, useRef } from 'react';
import { Race } from '../types';
import { formatDigitalClock, formatElapsedTime } from '../utils/timeUtils';

export function useRaceTimer(race: Race | null) {
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    if (!race || !race.startTimeMs) {
      setElapsedMs(0);
      return;
    }

    if (race.status === 'completed' && race.endTimeMs) {
      setElapsedMs(Math.max(0, race.endTimeMs - race.startTimeMs));
      return;
    }

    if (race.status === 'in_progress') {
      const updateTimer = () => {
        const now = Date.now();
        const currentElapsed = Math.max(0, now - (race.startTimeMs || now));
        setElapsedMs(currentElapsed);
      };

      updateTimer();
      // Tick every ~50ms for smooth 10th-of-a-second display
      intervalRef.current = setInterval(updateTimer, 50);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      };
    } else {
      setElapsedMs(0);
    }
  }, [race?.id, race?.status, race?.startTimeMs, race?.endTimeMs]);

  const digitalClock = formatDigitalClock(elapsedMs);
  const formattedTime = formatElapsedTime(elapsedMs);

  return {
    elapsedMs,
    digitalClock,
    formattedTime,
    isRunning: race?.status === 'in_progress',
  };
}
