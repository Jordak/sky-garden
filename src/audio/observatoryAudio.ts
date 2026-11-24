export const AUDIO_MUTED_STORAGE_KEY = 'sky-garden.audio-muted.v1';

let sharedAudioContext: AudioContext | null = null;
let cachedMuted: boolean | null = null;

export function loadAudioMuted(storage?: Pick<Storage, 'getItem'>): boolean {
  const targetStorage =
    storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!targetStorage) return false;
  try {
    const val = targetStorage.getItem(AUDIO_MUTED_STORAGE_KEY) === 'true';
    cachedMuted = val;
    return val;
  } catch {
    return false;
  }
}

export function saveAudioMuted(
  muted: boolean,
  storage?: Pick<Storage, 'setItem'>,
): void {
  cachedMuted = muted;
  const targetStorage =
    storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!targetStorage) return;
  try {
    targetStorage.setItem(AUDIO_MUTED_STORAGE_KEY, muted ? 'true' : 'false');
  } catch {
    // Ignore storage persistence errors
  }
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (cachedMuted === null) {
    cachedMuted = loadAudioMuted();
  }
  if (cachedMuted) return null;

  const AudioCtx =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (typeof AudioCtx !== 'function') return null;

  if (!sharedAudioContext) {
    try {
      sharedAudioContext = new AudioCtx();
    } catch {
      return null;
    }
  }
  if (sharedAudioContext.state === 'suspended') {
    void sharedAudioContext.resume().catch(() => undefined);
  }
  return sharedAudioContext;
}

function playToneSequence(
  notes: ReadonlyArray<{
    readonly freq: number;
    readonly endFreq?: number;
    readonly delaySec?: number;
    readonly durationSec: number;
    readonly gain: number;
    readonly type?: OscillatorType;
  }>,
): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  for (const note of notes) {
    const startAt = now + (note.delaySec ?? 0);
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = note.type ?? 'sine';
    osc.frequency.setValueAtTime(note.freq, startAt);
    if (note.endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(40, note.endFreq),
        startAt + note.durationSec,
      );
    }

    amp.gain.setValueAtTime(0.0001, startAt);
    amp.gain.linearRampToValueAtTime(note.gain, startAt + Math.min(0.014, note.durationSec * 0.25));
    amp.gain.exponentialRampToValueAtTime(0.0001, startAt + note.durationSec);

    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start(startAt);
    osc.stop(startAt + note.durationSec + 0.01);
  }
}

export function playClick(): void {
  playToneSequence([{ freq: 520, endFreq: 660, durationSec: 0.055, gain: 0.04, type: 'triangle' }]);
}

export function playStepAdvance(): void {
  playToneSequence([{ freq: 440, endFreq: 587, durationSec: 0.075, gain: 0.045, type: 'sine' }]);
}

export function playStepBack(): void {
  playToneSequence([{ freq: 520, endFreq: 392, durationSec: 0.075, gain: 0.04, type: 'sine' }]);
}

export function playObservationLogged(): void {
  playToneSequence([
    { freq: 523.25, durationSec: 0.11, gain: 0.055, type: 'sine' },
    { freq: 659.25, delaySec: 0.07, durationSec: 0.12, gain: 0.055, type: 'sine' },
    { freq: 783.99, delaySec: 0.14, durationSec: 0.18, gain: 0.05, type: 'triangle' },
  ]);
}

export function playPlaceGalaxy(): void {
  playToneSequence([
    { freq: 493.88, durationSec: 0.09, gain: 0.045, type: 'sine' },
    { freq: 739.99, delaySec: 0.06, durationSec: 0.14, gain: 0.05, type: 'sine' },
  ]);
}

export function playDomeRotate(): void {
  playToneSequence([
    { freq: 210, endFreq: 280, durationSec: 0.14, gain: 0.045, type: 'triangle' },
    { freq: 330, delaySec: 0.08, durationSec: 0.1, gain: 0.03, type: 'sine' },
  ]);
}

export function playHop(): void {
  playToneSequence([{ freq: 290, endFreq: 460, durationSec: 0.09, gain: 0.04, type: 'sine' }]);
}

export function playCatPurr(): void {
  playToneSequence([
    { freq: 680, endFreq: 880, durationSec: 0.07, gain: 0.045, type: 'sine' },
    { freq: 185, delaySec: 0.05, durationSec: 0.16, gain: 0.035, type: 'triangle' },
  ]);
}
