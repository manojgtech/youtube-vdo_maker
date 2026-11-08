/**
 * Synthesizes the transition sound effects into public/sfx/.
 *
 * Everything is generated from noise and sine waves here, so the sounds are
 * our own and carry no third-party licence. Re-run after changing a recipe:
 *   node scripts/make-sfx.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RATE = 44100;
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "sfx");

// Deterministic noise so re-running produces identical files.
let seed = 1234567;
const noise = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 2147483648 - 1;
};

/** Smooth 0→1→0 envelope peaking at `peak` (0–1 of the length). */
const swell = (t, peak, attack = 2.2, release = 1.6) =>
  t < peak ? Math.pow(t / peak, attack) : Math.pow(Math.max(0, 1 - (t - peak) / (1 - peak)), release);

/** Band-passed noise whose centre frequency follows `freq(t)`, panned by `pan(t)` (-1…1). */
function sweptNoise(seconds, { freq, q = 1.4, env, pan = () => 0 }) {
  const n = Math.round(seconds * RATE);
  const left = new Float32Array(n);
  const right = new Float32Array(n);
  let low = 0;
  let band = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const f = 2 * Math.sin((Math.PI * Math.min(freq(t), RATE / 6)) / RATE);
    low += f * band;
    const high = noise() - low - band / q;
    band += f * high;
    const v = band * env(t);
    const p = (pan(t) + 1) / 2;
    left[i] = v * Math.cos((p * Math.PI) / 2);
    right[i] = v * Math.sin((p * Math.PI) / 2);
  }
  return [left, right];
}

/** Sine whose pitch glides from `from` to `to` Hz with exponential decay. */
function glide(seconds, { from, to, decay, click = 0 }) {
  const n = Math.round(seconds * RATE);
  const out = new Float32Array(n);
  let phase = 0;
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const s = i / RATE;
    const t = i / n;
    const f = to + (from - to) * Math.exp(-t * 6);
    phase += (2 * Math.PI * f) / RATE;
    const attack = Math.min(1, s / 0.004);
    let v = Math.sin(phase) * Math.exp(-s / decay) * attack;
    if (click) {
      lp += 0.08 * (noise() - lp);
      v += lp * click * Math.exp(-s / 0.025);
    }
    out[i] = v;
  }
  return [out, out];
}

function mix(...tracks) {
  const n = Math.max(...tracks.map(([l]) => l.length));
  const l = new Float32Array(n);
  const r = new Float32Array(n);
  for (const [tl, tr, gain = 1] of tracks) {
    for (let i = 0; i < tl.length; i++) {
      l[i] += tl[i] * gain;
      r[i] += tr[i] * gain;
    }
  }
  return [l, r];
}

/** Normalize to `peakDb` dBFS with 4 ms fades at both ends (no clicks). */
function finish([l, r], peakDb = -3) {
  let peak = 0;
  for (let i = 0; i < l.length; i++) peak = Math.max(peak, Math.abs(l[i]), Math.abs(r[i]));
  const gain = Math.pow(10, peakDb / 20) / (peak || 1);
  const edge = Math.round(0.004 * RATE);
  for (let i = 0; i < l.length; i++) {
    const fade = Math.min(1, i / edge, (l.length - 1 - i) / edge);
    l[i] *= gain * fade;
    r[i] *= gain * fade;
  }
  return [l, r];
}

function writeWav(name, [l, r]) {
  const n = l.length;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 4, 4);
  buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(2, 22); // stereo
  buf.writeUInt32LE(RATE, 24);
  buf.writeUInt32LE(RATE * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, l[i])) * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, r[i])) * 32767), 46 + i * 4);
  }
  writeFileSync(join(OUT, name), buf);
  console.log(`public/sfx/${name}  ${(n / RATE).toFixed(2)}s`);
}

mkdirSync(OUT, { recursive: true });

// Air rushing past, left to right. Peaks at 40% (0.32 s): slides and zooms.
writeWav(
  "whoosh.wav",
  finish(
    sweptNoise(0.8, {
      freq: (t) => 280 + 2400 * swell(t, 0.4, 1.6, 1.2),
      q: 1.2,
      env: (t) => swell(t, 0.4),
      pan: (t) => -0.7 + 1.4 * t,
    }),
  ),
);

// Short, bright swish. Peaks at 35% (0.16 s): wipes and UGC cuts.
writeWav(
  "swish.wav",
  finish(
    sweptNoise(0.45, {
      freq: (t) => 1400 + 5200 * swell(t, 0.35, 1.4, 1),
      q: 1.6,
      env: (t) => swell(t, 0.35, 2.6, 2.2),
      pan: (t) => 0.6 - 1.2 * t,
    }),
    -4,
  ),
);

// Deep cinematic hit with a soft transient: title open and end card.
writeWav(
  "boom.wav",
  finish(
    mix(
      glide(1.8, { from: 110, to: 38, decay: 0.42, click: 2.2 }),
      [...sweptNoise(1.8, { freq: () => 160, q: 0.8, env: (t) => Math.exp(-t * 9) }), 0.6],
    ),
    -2,
  ),
);

// Gentle air for crossfades: low-passed and slow.
writeWav(
  "air.wav",
  finish(
    sweptNoise(1.0, {
      freq: (t) => 500 + 900 * swell(t, 0.45, 1.4, 1.4),
      q: 0.9,
      env: (t) => swell(t, 0.45, 1.8, 1.8),
      pan: (t) => -0.3 + 0.6 * t,
    }),
    -6,
  ),
);
