import { useState, useEffect } from 'react';

export function useAdReward(
  toolId?: string, 
  durationMinutes: number = 30, 
  unlockToolWithAd?: (toolId: string, durationMinutes: number) => void,
  closeGate?: () => void
) {
  const [adWatching, setAdWatching] = useState(false);
  const [adTimer, setAdTimer] = useState(15);
  const [adFinished, setAdFinished] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (adWatching && adTimer > 0) {
      interval = setInterval(() => {
        setAdTimer((t) => {
          if (t <= 1) {
            setAdFinished(true);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [adWatching, adTimer]);

  const handleStartAd = () => {
    setAdWatching(true);
    setAdTimer(15);
    setAdFinished(false);
  };

  const handleClaimReward = () => {
    if (toolId && unlockToolWithAd) {
      unlockToolWithAd(toolId, durationMinutes);
    }
    if (closeGate) {
      closeGate();
    }
  };

  const resetAd = () => {
    setAdWatching(false);
    setAdTimer(15);
    setAdFinished(false);
  };

  return {
    adWatching,
    adTimer,
    adFinished,
    handleStartAd,
    handleClaimReward,
    resetAd,
  };
}
