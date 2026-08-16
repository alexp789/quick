import { Platform } from 'react-native';

export interface AppUpdateState {
  isUpdateAvailable: boolean;
  isDownloading: boolean;
  isReadyToApply: boolean;
  versionInfo?: string;
}

type UpdateListener = (state: AppUpdateState) => void;

class UpdateService {
  private listeners: Set<UpdateListener> = new Set();
  private state: AppUpdateState = {
    isUpdateAvailable: false,
    isDownloading: false,
    isReadyToApply: false,
  };
  private waitingWorker: any = null;

  constructor() {
    if (Platform.OS === 'web') {
      this.initWebUpdater();
    } else {
      this.initNativeUpdater();
    }
  }

  public subscribe(listener: UpdateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l(this.state));
  }

  // --- Web / PWA Updater ---
  private initWebUpdater() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[Quick PWA] Service Worker registered:', reg.scope);

          // Check if an update was already waiting in the background
          if (reg.waiting) {
            this.waitingWorker = reg.waiting;
            this.state = {
              isUpdateAvailable: true,
              isDownloading: false,
              isReadyToApply: true,
            };
            this.notify();
          }

          // Listen for new service worker installation
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (!newWorker) return;

            this.state = { ...this.state, isDownloading: true };
            this.notify();

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New update is installed and waiting to take over
                this.waitingWorker = newWorker;
                this.state = {
                  isUpdateAvailable: true,
                  isDownloading: false,
                  isReadyToApply: true,
                };
                this.notify();
              }
            });
          });

          // Check for server updates when the app regains focus or comes online
          const checkForUpdates = () => {
            if (navigator.onLine) {
              reg.update().catch(() => {});
            }
          };

          window.addEventListener('focus', checkForUpdates);
          window.addEventListener('online', checkForUpdates);
          // Initial check on load
          checkForUpdates();
        })
        .catch((err) => {
          console.warn('[Quick PWA] Service worker registration error:', err);
        });

      // Reload window when new service worker takes control
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    });
  }

  // --- Native iOS/Android Updater ---
  private async initNativeUpdater() {
    try {
      const Updates = await import('expo-updates');
      if (!Updates.isEnabled) return;

      const checkNativeUpdate = async () => {
        try {
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            this.state = { ...this.state, isUpdateAvailable: true, isDownloading: true };
            this.notify();

            await Updates.fetchUpdateAsync();
            this.state = {
              isUpdateAvailable: true,
              isDownloading: false,
              isReadyToApply: true,
            };
            this.notify();
          }
        } catch {
          // Ignore offline check errors
        }
      };

      // Check on startup
      checkNativeUpdate();
    } catch {
      // In dev client or non-expo-updates environments
    }
  }

  // User or Auto trigger to apply update and reload
  public async applyUpdate(): Promise<void> {
    if (Platform.OS === 'web') {
      if (this.waitingWorker) {
        this.waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      } else if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } else {
      try {
        const Updates = await import('expo-updates');
        if (Updates.isEnabled) {
          await Updates.reloadAsync();
        }
      } catch {
        // Fallback
      }
    }
  }
}

export const updateService = new UpdateService();
