// ==========================================
// FLORA DRAWING
// ==========================================
import { getPhenotype } from './genetics.js';
import { clamp, mulberry32, fibonacci } from './math-utils.js';
import { lerpColor } from './color-utils.js';

export function drawPetal(ctx, cx, cy, baseR, p, rng) {
  const outerR = baseR * p.outerRadius, petalW = baseR * p.thickness, midR = outerR * p.midpoint;
  const tangentRad = (p.tangent * Math.PI) / 180, curveInf = p.curvature;
  const jf = p.jiggle, jo = 1 + (rng() - 0.5) * jf, jm = 1 + (rng() - 0.5) * jf, jw = 1 + (rng() - 0.5) * jf;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  const wAtMid = petalW * jw, ctrlX = wAtMid * (0.5 + curveInf * 0.5), ctrlY = midR * jm, tangX = Math.sin(tangentRad) * wAtMid * 0.3;
  ctx.quadraticCurveTo(cx + ctrlX + tangX, cy - ctrlY, cx, cy - outerR * jo);
  ctx.quadraticCurveTo(cx - ctrlX - tangX, cy - ctrlY, cx, cy);
  ctx.closePath();
}

export function getPetalCount(p, layer) {
  switch (p.petalMode) {
    case 'fixed':
      return Math.round(p.basePetals);
    case 'fibonacci':
      return fibonacci(Math.min(p.fibonacciStart + layer, 12));
    case 'multiplier':
      return Math.round(p.basePetals * Math.pow(p.petalMultiplier, layer));
    default:
      return Math.round(p.basePetals);
  }
}

export function drawFlora(canvas, genome) {
  const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height, cx = w / 2, cy = h / 2;
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, w, h);
  const p = getPhenotype(genome), rng = mulberry32(p.seed), baseR = Math.min(w, h) * 0.42;
  
  for (let layer = 0; layer < p.layers; layer++) {
    const layerScale = Math.pow(p.scale, layer), layerR = baseR * layerScale, layerRot = (p.rotation * layer * Math.PI) / 180;
    let petalCount = clamp(getPetalCount(p, layer), 3, 36);
    const colorT = layer / Math.max(1, p.layers - 1), layerColor = lerpColor(p.colorOuter, p.colorInner, colorT);
    
    for (let petal = 0; petal < petalCount; petal++) {
      const angle = (petal * 2 * Math.PI) / petalCount + layerRot;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.translate(-cx, -cy);
      drawPetal(ctx, cx, cy, layerR, p, rng);
      ctx.fillStyle = layerColor;
      ctx.fill();
      ctx.strokeStyle = lerpColor(layerColor, '#000000', 0.3);
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.restore();
    }
  }
}

