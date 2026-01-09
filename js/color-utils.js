// ==========================================
// CIELAB COLOR UTILITIES
// ==========================================
import { clamp } from './math-utils.js';

export function srgbToXyz(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
  return {
    x: r * 0.4124564 + g * 0.3575761 + b * 0.1804375,
    y: r * 0.2126729 + g * 0.7151522 + b * 0.0721750,
    z: r * 0.0193339 + g * 0.1191920 + b * 0.9503041
  };
}

export function xyzToLab(x, y, z) {
  const xn = 0.95047, yn = 1.0, zn = 1.08883;
  x /= xn; y /= yn; z /= zn;
  const f = t => t > 0.008856 ? Math.pow(t, 1/3) : (7.787 * t) + 16/116;
  return {
    L: (116 * f(y)) - 16,
    a: 500 * (f(x) - f(y)),
    b: 200 * (f(y) - f(z))
  };
}

export function labToXyz(L, a, b) {
  const xn = 0.95047, yn = 1.0, zn = 1.08883;
  const fy = (L + 16) / 116, fx = a / 500 + fy, fz = fy - b / 200;
  const f_inv = t => {
    const t3 = t * t * t;
    return t3 > 0.008856 ? t3 : (t - 16/116) / 7.787;
  };
  return {
    x: xn * f_inv(fx),
    y: yn * f_inv(fy),
    z: zn * f_inv(fz)
  };
}

export function xyzToSrgb(x, y, z) {
  let r = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
  let g = x * -0.9692660 + y * 1.8760108 + z * 0.0415560;
  let b = x * 0.0556434 + y * -0.2040259 + z * 1.0572252;
  const gamma = c => c > 0.0031308 ? 1.055 * Math.pow(c, 1/2.4) - 0.055 : 12.92 * c;
  return {
    r: clamp(Math.round(gamma(r) * 255), 0, 255),
    g: clamp(Math.round(gamma(g) * 255), 0, 255),
    b: clamp(Math.round(gamma(b) * 255), 0, 255)
  };
}

export function hexToLab(hex) {
  const r = parseInt(hex.slice(1,3), 16), g = parseInt(hex.slice(3,5), 16), b = parseInt(hex.slice(5,7), 16);
  const xyz = srgbToXyz(r, g, b);
  return xyzToLab(xyz.x, xyz.y, xyz.z);
}

export function labToHex(L, a, b) {
  const xyz = labToXyz(L, a, b), rgb = xyzToSrgb(xyz.x, xyz.y, xyz.z);
  return '#' + [rgb.r, rgb.g, rgb.b].map(c => c.toString(16).padStart(2, '0')).join('');
}

export function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) } : null;
}

export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('');
}

export function lerpColor(c1, c2, t) {
  const a = hexToRgb(c1), b = hexToRgb(c2);
  return rgbToHex(a.r + (b.r - a.r) * t, a.g + (b.g - a.g) * t, a.b + (b.b - a.b) * t);
}

