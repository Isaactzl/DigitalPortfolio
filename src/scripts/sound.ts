/**
 * Small sounds, made in the browser rather than loaded as files. Off unless the
 * visitor switches them on, and the choice is remembered.
 */
let context: AudioContext | null = null;

export const soundIsOn = () => {
  try {
    return localStorage.getItem('sound') === 'on';
  } catch {
    return false;
  }
};

function audio() {
  // Browsers only allow audio after a user gesture, and the switch is that gesture.
  context ??= new AudioContext();
  if (context.state === 'suspended') void context.resume();
  return context;
}

export function setSound(on: boolean) {
  try {
    localStorage.setItem('sound', on ? 'on' : 'off');
  } catch {
    // Storage blocked: the setting lasts for this visit only.
  }
  if (on) audio();
}

/** A rubber stamp landing on paper: a low knock with a short papery burst. */
export function playThunk() {
  if (!soundIsOn()) return;
  const ctx = audio();
  const now = ctx.currentTime;

  const knock = ctx.createOscillator();
  const knockGain = ctx.createGain();
  knock.type = 'sine';
  knock.frequency.setValueAtTime(140, now);
  knock.frequency.exponentialRampToValueAtTime(55, now + 0.12);
  knockGain.gain.setValueAtTime(0.5, now);
  knockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
  knock.connect(knockGain).connect(ctx.destination);
  knock.start(now);
  knock.stop(now + 0.2);

  const noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.06), ctx.sampleRate);
  const samples = noise.getChannelData(0);
  for (let i = 0; i < samples.length; i++)
    samples[i] = (Math.random() * 2 - 1) * (1 - i / samples.length);
  const burst = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const burstGain = ctx.createGain();
  burst.buffer = noise;
  filter.type = 'lowpass';
  filter.frequency.value = 1800;
  burstGain.gain.value = 0.25;
  burst.connect(filter).connect(burstGain).connect(ctx.destination);
  burst.start(now);
}

/** A light switch: one short tick. */
export function playClick() {
  if (!soundIsOn()) return;
  const ctx = audio();
  const now = ctx.currentTime;
  const tick = ctx.createOscillator();
  const gain = ctx.createGain();
  tick.type = 'square';
  tick.frequency.setValueAtTime(2200, now);
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
  tick.connect(gain).connect(ctx.destination);
  tick.start(now);
  tick.stop(now + 0.04);
}

/** A basketball landing: a hollow, ringing thud, quieter as the bounces die down. */
export function playBounce(impact: number) {
  if (!soundIsOn()) return;
  const ctx = audio();
  const now = ctx.currentTime;
  const loudness = Math.min(0.4, impact * 0.08);
  const body = ctx.createOscillator();
  const gain = ctx.createGain();
  body.type = 'sine';
  body.frequency.setValueAtTime(180, now);
  body.frequency.exponentialRampToValueAtTime(90, now + 0.15);
  gain.gain.setValueAtTime(loudness, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
  body.connect(gain).connect(ctx.destination);
  body.start(now);
  body.stop(now + 0.25);
}
