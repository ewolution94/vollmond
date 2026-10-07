// The game's sounds, made on the spot with Web Audio: no files, nothing fetched. Short and quiet:
// a howl when night falls, a bell at dawn, a gong for a death, a drum for the vote, a paper flick
// for a card, a little fanfare at the end. Browsers only start audio after a tap; the first tap on
// the page (joining is one) unlocks it.

export type Sound = 'night' | 'dawn' | 'death' | 'vote' | 'flip' | 'win' | 'tick';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function audio() {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.28;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Wakes the audio on a tap, so later sounds may play. */
export function unlockAudio() {
  const once = () => {
    audio();
    removeEventListener('pointerdown', once);
    removeEventListener('keydown', once);
  };
  addEventListener('pointerdown', once);
  addEventListener('keydown', once);
}

function noise(c: AudioContext, seconds: number) {
  const buffer = c.createBuffer(1, Math.ceil(c.sampleRate * seconds), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  return src;
}

function envelope(c: AudioContext, at: number, attack: number, hold: number, release: number, peak = 1) {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + attack);
  g.gain.setValueAtTime(peak, at + attack + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, at + attack + hold + release);
  g.connect(master!);
  return g;
}

function tone(c: AudioContext, type: OscillatorType, freq: number, at: number, length: number, peak: number) {
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  o.connect(envelope(c, at, 0.01, 0, length, peak));
  o.start(at);
  o.stop(at + length + 0.05);
  return o;
}

const PLAY: Record<Sound, (c: AudioContext, t: number) => void> = {
  // A wolf far off: a sine that rises, wavers and falls, with a breath of noise.
  night(c, t) {
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(330, t);
    o.frequency.exponentialRampToValueAtTime(620, t + 0.7);
    o.frequency.setValueAtTime(620, t + 1.5);
    o.frequency.exponentialRampToValueAtTime(410, t + 2.4);
    const vib = c.createOscillator();
    vib.frequency.value = 5.5;
    const depth = c.createGain();
    depth.gain.value = 9;
    vib.connect(depth).connect(o.frequency);
    o.connect(envelope(c, t, 0.5, 1.2, 0.9, 0.5));
    o.start(t);
    vib.start(t);
    o.stop(t + 2.7);
    vib.stop(t + 2.7);
    const n = noise(c, 2.6);
    const band = c.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 900;
    band.Q.value = 0.8;
    n.connect(band).connect(envelope(c, t, 0.6, 1, 0.9, 0.05));
    n.start(t);
  },
  // A village bell: a few inharmonic partials that ring out.
  dawn(c, t) {
    for (const [ratio, gain] of [[1, 0.5], [2.01, 0.25], [2.76, 0.18], [5.4, 0.08]] as const) {
      const o = c.createOscillator();
      o.frequency.value = 392 * ratio;
      o.connect(envelope(c, t, 0.005, 0, 2.6 / ratio + 0.6, gain));
      o.start(t);
      o.stop(t + 3.4);
    }
  },
  death(c, t) {
    for (const [freq, gain] of [[98, 0.6], [147, 0.3], [233, 0.15]] as const) {
      const o = c.createOscillator();
      o.frequency.setValueAtTime(freq, t);
      o.frequency.exponentialRampToValueAtTime(freq * 0.94, t + 2);
      o.connect(envelope(c, t, 0.01, 0, 2.2, gain));
      o.start(t);
      o.stop(t + 2.4);
    }
  },
  vote(c, t) {
    for (const at of [t, t + 0.18]) {
      const o = c.createOscillator();
      o.frequency.setValueAtTime(140, at);
      o.frequency.exponentialRampToValueAtTime(55, at + 0.25);
      o.connect(envelope(c, at, 0.005, 0, 0.3, 0.7));
      o.start(at);
      o.stop(at + 0.4);
      const n = noise(c, 0.2);
      const low = c.createBiquadFilter();
      low.type = 'lowpass';
      low.frequency.value = 600;
      n.connect(low).connect(envelope(c, at, 0.002, 0, 0.15, 0.25));
      n.start(at);
    }
  },
  flip(c, t) {
    const n = noise(c, 0.12);
    const high = c.createBiquadFilter();
    high.type = 'highpass';
    high.frequency.value = 2400;
    n.connect(high).connect(envelope(c, t, 0.003, 0.01, 0.07, 0.35));
    n.start(t);
  },
  win(c, t) {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(c, 'triangle', f, t + i * 0.13, i === 3 ? 0.9 : 0.25, 0.35));
  },
  tick(c, t) {
    tone(c, 'square', 1800, t, 0.03, 0.05);
  },
};

export function play(sound: Sound) {
  const c = audio();
  if (!c || c.state !== 'running') return;
  try {
    PLAY[sound](c, c.currentTime + 0.02);
  } catch {
    // a browser without some node: stay silent
  }
}
