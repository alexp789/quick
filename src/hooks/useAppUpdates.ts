import { useState, useEffect } from 'react';
import { updateService, AppUpdateState } from '../utils/updateService';

export function useAppUpdates() {
  const [updateState, setUpdateState] = useState<AppUpdateState>({
    isUpdateAvailable: false,
    isDownloading: false,
    isReadyToApply: false,
  });

  useEffect(() => {
    const unsubscribe = updateService.subscribe(setUpdateState);
    return unsubscribe;
  }, []);

  const applyUpdate = () => {
    updateService.applyUpdate();
  };

  return {
    ...updateState,
    applyUpdate,
  };
}
