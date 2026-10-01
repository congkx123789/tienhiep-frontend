import { useState, useEffect, useRef } from 'react';

export function useSleepTimer(isPlaying: boolean, stopSpeaking: () => void) {
  const [sleepTimer, setSleepTimer] = useState<number>(0); // 0 (off), 15, 30, 45, 60 minutes
  const [timeLeftMin, setTimeLeftMin] = useState<number>(0);
  const sleepTimerRef = useRef<any>(null);

  useEffect(() => {
    if (sleepTimerRef.current) {
      clearInterval(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }

    if (sleepTimer > 0 && isPlaying) {
      setTimeLeftMin(sleepTimer);
      sleepTimerRef.current = setInterval(() => {
        setTimeLeftMin((prev) => {
          if (prev <= 1) {
            stopSpeaking();
            clearInterval(sleepTimerRef.current);
            sleepTimerRef.current = null;
            setSleepTimer(0);
            return 0;
          }
          return prev - 1;
        });
      }, 60000);
    }

    return () => {
      if (sleepTimerRef.current) {
        clearInterval(sleepTimerRef.current);
      }
    };
  }, [sleepTimer, isPlaying, stopSpeaking]);

  return {
    sleepTimer,
    setSleepTimer,
    timeLeftMin
  };
}
