// ==========================================
// GENETICS SYSTEM
// ==========================================
import { randomNormal, randomSkewNormal, clamp, weightedRandom, generateId } from './math-utils.js';
import { labToHex } from './color-utils.js';
import { getGeneticsConfig } from './config-loader.js';

export function createGenome() {
  return {
    layers: { mean: 6, stdDev: 2, skew: 0 },
    basePetals: { mean: 8, stdDev: 3, skew: 0.5 },
    petalMultiplier: { mean: 1.0, stdDev: 0.15, skew: 0 },
    outerRadius: { mean: 0.85, stdDev: 0.1, skew: -0.5 },
    thickness: { mean: 0.4, stdDev: 0.12, skew: 0.3 },
    midpoint: { mean: 0.5, stdDev: 0.12, skew: 0 },
    curvature: { mean: 0.4, stdDev: 0.2, skew: 0 },
    scale: { mean: 0.82, stdDev: 0.08, skew: 0 },
    jiggle: { mean: 0.05, stdDev: 0.05, skew: 1.0 },
    tangent: { value: 45 },
    rotation: { value: 22 },
    petalMode: { value: 'fixed' },
    fibonacciStart: { value: 3 },
    colorOuter: { L: 35, a: -20, b: 15 },
    colorInner: { L: 25, a: -15, b: 10 },
    seed: Math.random() * 10000
  };
}

export function inheritContinuousGene(cfg, pA, pB) {
  const probs = cfg.inheritProbs, roll = Math.random();
  let result = { mean: 0, stdDev: 0, skew: 0 };
  if (roll < probs.singleParent) {
    const p = Math.random() < 0.5 ? pA : pB;
    result = { mean: p.mean, stdDev: p.stdDev, skew: p.skew };
  } else if (roll < probs.singleParent + probs.blend) {
    const w = 0.3 + Math.random() * 0.4;
    result.mean = pA.mean * w + pB.mean * (1 - w) + randomNormal(0, (pA.stdDev + pB.stdDev) / 4);
    result.stdDev = (pA.stdDev + pB.stdDev) / 2;
    result.skew = pA.skew * w + pB.skew * (1 - w);
  } else {
    const init = cfg.initial;
    result = {
      mean: randomSkewNormal(init.mean, init.stdDev, init.skew),
      stdDev: init.stdDev * (0.5 + Math.random()),
      skew: init.skew + randomNormal(0, 0.3)
    };
  }
  const GeneticsConfig = getGeneticsConfig();
  const stdCfg = GeneticsConfig.stdDevInheritance;
  result.stdDev *= (stdCfg.bounds.minRatio + Math.random() * (stdCfg.bounds.maxRatio - stdCfg.bounds.minRatio));
  result.stdDev = Math.max(0.01, result.stdDev);
  result.mean = clamp(result.mean, cfg.bounds.min, cfg.bounds.max);
  if (cfg.round) result.mean = Math.round(result.mean);
  return result;
}

export function inheritUniformGene(cfg, pA, pB) {
  const probs = cfg.inheritProbs, roll = Math.random();
  let value;
  if (roll < probs.singleParent) {
    value = Math.random() < 0.5 ? pA.value : pB.value;
  } else if (roll < probs.singleParent + probs.blend) {
    const min = Math.min(pA.value, pB.value), max = Math.max(pA.value, pB.value);
    value = min + Math.random() * (max - min);
  } else {
    const init = cfg.initial;
    value = init.min + Math.random() * (init.max - init.min);
  }
  value = clamp(value, cfg.bounds.min, cfg.bounds.max);
  if (cfg.round) value = Math.round(value);
  return { value };
}

export function inheritDiscreteGene(cfg, pA, pB) {
  const probs = cfg.inheritProbs, roll = Math.random();
  let value;
  if (roll < probs.singleParent) {
    value = Math.random() < 0.5 ? pA.value : pB.value;
  } else if (roll < probs.singleParent + probs.blend) {
    if (typeof pA.value === 'number' && typeof pB.value === 'number') {
      const avg = (pA.value + pB.value) / 2;
      value = Math.random() < 0.5 ? Math.floor(avg) : Math.ceil(avg);
    } else {
      value = Math.random() < 0.5 ? pA.value : pB.value;
    }
  } else {
    value = weightedRandom(cfg.options);
  }
  return { value };
}

export function inheritColorGene(cfg, pA, pB) {
  const probs = cfg.inheritProbs, roll = Math.random();
  let L, a, b;
  if (roll < probs.singleParent) {
    const p = Math.random() < 0.5 ? pA : pB;
    L = p.L; a = p.a; b = p.b;
  } else if (roll < probs.singleParent + probs.blend) {
    const w = 0.3 + Math.random() * 0.4;
    L = pA.L * w + pB.L * (1 - w) + randomNormal(0, 5);
    a = pA.a * w + pB.a * (1 - w) + randomNormal(0, 8);
    b = pA.b * w + pB.b * (1 - w) + randomNormal(0, 8);
  } else {
    const init = cfg.initial;
    L = init.L.min + Math.random() * (init.L.max - init.L.min);
    a = init.a.min + Math.random() * (init.a.max - init.a.min);
    b = init.b.min + Math.random() * (init.b.max - init.b.min);
  }
  return {
    L: clamp(L, 0, 100),
    a: clamp(a, -128, 127),
    b: clamp(b, -128, 127)
  };
}

export function crossbreed(gA, gB, parentAId = null, parentBId = null, generation = null) {
  const GeneticsConfig = getGeneticsConfig();
  const o = createGenome(), cfg = GeneticsConfig.genes;
  o.layers = inheritContinuousGene(cfg.layers, gA.layers, gB.layers);
  o.basePetals = inheritContinuousGene(cfg.basePetals, gA.basePetals, gB.basePetals);
  o.petalMultiplier = inheritContinuousGene(cfg.petalMultiplier, gA.petalMultiplier, gB.petalMultiplier);
  o.outerRadius = inheritContinuousGene(cfg.outerRadius, gA.outerRadius, gB.outerRadius);
  o.thickness = inheritContinuousGene(cfg.thickness, gA.thickness, gB.thickness);
  o.midpoint = inheritContinuousGene(cfg.midpoint, gA.midpoint, gB.midpoint);
  o.curvature = inheritContinuousGene(cfg.curvature, gA.curvature, gB.curvature);
  o.scale = inheritContinuousGene(cfg.scale, gA.scale, gB.scale);
  o.jiggle = inheritContinuousGene(cfg.jiggle, gA.jiggle, gB.jiggle);
  o.tangent = inheritUniformGene(cfg.tangent, gA.tangent, gB.tangent);
  o.rotation = inheritUniformGene(cfg.rotation, gA.rotation, gB.rotation);
  o.petalMode = inheritDiscreteGene(cfg.petalMode, gA.petalMode, gB.petalMode);
  o.fibonacciStart = inheritDiscreteGene(cfg.fibonacciStart, gA.fibonacciStart, gB.fibonacciStart);
  o.colorOuter = inheritColorGene(cfg.colorOuter, gA.colorOuter, gB.colorOuter);
  o.colorInner = inheritColorGene(cfg.colorInner, gA.colorInner, gB.colorInner);
  o.seed = Math.random() * 10000;
  
  // If parent IDs and generation are provided, return a specimen object
  if (parentAId !== null && parentBId !== null && generation !== null) {
    return {
      id: generateId(),
      genome: o,
      parentA: parentAId,
      parentB: parentBId,
      generation
    };
  }
  return o;
}

export function randomGenome() {
  const GeneticsConfig = getGeneticsConfig();
  const g = createGenome(), cfg = GeneticsConfig.genes;
  
  for (const key of ['layers', 'basePetals', 'petalMultiplier', 'outerRadius', 'thickness', 'midpoint', 'curvature', 'scale', 'jiggle']) {
    const c = cfg[key], init = c.initial;
    let mean = randomSkewNormal(init.mean, init.stdDev, init.skew);
    mean = clamp(mean, c.bounds.min, c.bounds.max);
    if (c.round) mean = Math.round(mean);
    g[key] = {
      mean,
      stdDev: init.stdDev * (0.5 + Math.random()),
      skew: init.skew + randomNormal(0, 0.2)
    };
  }
  
  for (const key of ['tangent', 'rotation']) {
    const c = cfg[key], init = c.initial;
    let v = init.min + Math.random() * (init.max - init.min);
    if (c.round) v = Math.round(v);
    g[key] = { value: v };
  }
  
  g.petalMode = { value: weightedRandom(cfg.petalMode.options) };
  g.fibonacciStart = { value: weightedRandom(cfg.fibonacciStart.options) };
  
  for (const key of ['colorOuter', 'colorInner']) {
    const init = cfg[key].initial;
    g[key] = {
      L: init.L.min + Math.random() * (init.L.max - init.L.min),
      a: init.a.min + Math.random() * (init.a.max - init.a.min),
      b: init.b.min + Math.random() * (init.b.max - init.b.min)
    };
  }
  
  g.seed = Math.random() * 10000;
  return g;
}

export function getPhenotype(g) {
  return {
    layers: g.layers.mean,
    petalMode: g.petalMode.value,
    basePetals: g.basePetals.mean,
    fibonacciStart: g.fibonacciStart.value,
    petalMultiplier: g.petalMultiplier.mean,
    outerRadius: g.outerRadius.mean,
    thickness: g.thickness.mean,
    midpoint: g.midpoint.mean,
    curvature: g.curvature.mean,
    tangent: g.tangent.value,
    scale: g.scale.mean,
    rotation: g.rotation.value,
    jiggle: g.jiggle.mean,
    colorOuter: labToHex(g.colorOuter.L, g.colorOuter.a, g.colorOuter.b),
    colorInner: labToHex(g.colorInner.L, g.colorInner.a, g.colorInner.b),
    seed: g.seed
  };
}

export function encodeGenome(g) {
  return btoa(JSON.stringify(g));
}

export function decodeGenome(s) {
  try {
    return JSON.parse(atob(s));
  } catch (e) {
    return null;
  }
}

