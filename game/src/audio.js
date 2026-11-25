// audio.js — every sound is synthesized with WebAudio. No audio files, no
// network: a handful of oscillators and filtered noise, kept short and soft
// so the kitchen never shouts.

let ctx = null;
let muted = false;

export function setMuted(value) {
  muted = value;
}

export function isMuted() {
  return muted;
}

// Browsers only allow audio after a user gesture; the start button calls this.
export function ensureAudio() {
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    } catch {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq, dur, type = 'sine', gain = 0.08, when = 0, slideTo = null) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(amp).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise(dur, filterFreq = 1200, gain = 0.08, when = 0, type = 'bandpass') {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + when;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = filterFreq;
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(gain, t0);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(amp).connect(ctx.destination);
  src.start(t0);
}

export const sfx = {
  click() { tone(660, 0.07, 'triangle', 0.06); },
  pickup() { tone(520, 0.09, 'triangle', 0.07, 0, 880); },
  place() { tone(340, 0.08, 'triangle', 0.07, 0, 240); },
  chop() {
    noise(0.06, 2600, 0.12);
    tone(180, 0.07, 'square', 0.05);
  },
  chopDone() { tone(740, 0.1, 'triangle', 0.07, 0, 990); },
  sizzle() { noise(0.5, 5200, 0.05, 0, 'highpass'); },
  cooked() {
    tone(880, 0.12, 'sine', 0.08);
    tone(1174, 0.16, 'sine', 0.08, 0.1);
  },
  burnt() {
    tone(160, 0.25, 'sawtooth', 0.06, 0, 90);
    noise(0.25, 500, 0.05);
  },
  serve() {
    tone(880, 0.12, 'sine', 0.09);
    tone(1108, 0.12, 'sine', 0.09, 0.09);
    tone(1318, 0.2, 'sine', 0.09, 0.18);
  },
  combo() {
    tone(990, 0.1, 'triangle', 0.08);
    tone(1480, 0.16, 'triangle', 0.08, 0.08);
  },
  expire() {
    tone(220, 0.22, 'sawtooth', 0.07, 0, 140);
    tone(175, 0.28, 'sawtooth', 0.06, 0.12, 110);
  },
  error() { tone(200, 0.12, 'square', 0.05, 0, 150); },
  tick() { tone(1200, 0.05, 'square', 0.035); },
  phase() {
    tone(440, 0.12, 'triangle', 0.08, 0, 660);
    tone(660, 0.12, 'triangle', 0.08, 0.1, 880);
    tone(880, 0.2, 'triangle', 0.08, 0.2, 1320);
  },
  star() {
    tone(1046, 0.14, 'sine', 0.09);
    tone(1568, 0.22, 'sine', 0.09, 0.12);
  },
};
