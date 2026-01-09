// ==========================================
// MATH UTILITIES
// ==========================================

export function randomNormal(mean = 0, stdDev = 1) {
  const u1 = Math.random(), u2 = Math.random();
  return mean + Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * stdDev;
}

export function randomSkewNormal(mean, stdDev, skew) {
  const u0 = randomNormal(0, 1), v = randomNormal(0, 1);
  const delta = skew / Math.sqrt(1 + skew * skew);
  const u1 = delta * u0 + Math.sqrt(1 - delta * delta) * v;
  return mean + stdDev * (u0 >= 0 ? u1 : -u1);
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function weightedRandom(options) {
  const total = options.reduce((s, o) => s + o.weight, 0);
  let r = Math.random() * total;
  for (const o of options) {
    r -= o.weight;
    if (r <= 0) return o.value;
  }
  return options[options.length - 1].value;
}

export function fibonacci(n) {
  const seq = [1, 1];
  for (let i = 2; i <= n; i++) {
    seq[i] = seq[i-1] + seq[i-2];
  }
  return seq[n];
}

export function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function generateId() {
  return Math.random().toString(36).substr(2, 8);
}

