import { Platform } from 'react-native';

class SoundController {
  private audioCtx: any = null;

  private getAudioContext(): any {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
    try {
      const AudioCtxClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass && !this.audioCtx) {
        this.audioCtx = new AudioCtxClass();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  public playBeep(freq = 880, duration = 0.12, type: OscillatorType = 'sine') {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio playback ignore
    }
  }

  public playFinishSound() {
    this.playBeep(980, 0.15, 'sine');
  }

  public playGunStartSound() {
    this.playBeep(440, 0.08, 'square');
    setTimeout(() => this.playBeep(880, 0.3, 'sine'), 90);
  }

  public playWarningSound() {
    this.playBeep(330, 0.2, 'sawtooth');
  }
}

export const soundManager = new SoundController();
