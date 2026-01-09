// ==========================================
// GENERATOR MODE LOGIC
// ==========================================
import { randomGenome, crossbreed, encodeGenome, decodeGenome, getPhenotype } from './genetics.js';
import { drawFlora } from './drawing.js';
import { labToHex, hexToLab } from './color-utils.js';
import { fibonacci } from './math-utils.js';

let currentMode = 'single';
let singleGenome = null;
let parentAGenome = null;
let parentBGenome = null;
let offspringGenome = null;
let activeGenome = null;
let panelOpen = false;

export function initGenerator() {
  // Initialize genomes
  singleGenome = randomGenome();
  parentAGenome = randomGenome();
  parentBGenome = randomGenome();
  offspringGenome = crossbreed(parentAGenome, parentBGenome);
  activeGenome = singleGenome;
  
  // Setup UI
  updateParamDisplays();
  render();
  setupEventListeners();
}

function updateParamDisplays() {
  const g = activeGenome;
  document.getElementById('layersValue').textContent = Math.round(g.layers.mean);
  document.getElementById('layersMeta').textContent = `σ: ${g.layers.stdDev.toFixed(2)} | skew: ${g.layers.skew.toFixed(1)}`;
  document.getElementById('layers').value = g.layers.mean;
  document.getElementById('petalModeValue').textContent = g.petalMode.value;
  document.getElementById('petalMode').value = g.petalMode.value;
  document.getElementById('basePetalsValue').textContent = Math.round(g.basePetals.mean);
  document.getElementById('basePetalsMeta').textContent = `σ: ${g.basePetals.stdDev.toFixed(2)} | skew: ${g.basePetals.skew.toFixed(1)}`;
  document.getElementById('basePetals').value = g.basePetals.mean;
  document.getElementById('fibStartValue').textContent = `F(${g.fibonacciStart.value})=${fibonacci(g.fibonacciStart.value)}`;
  document.getElementById('fibStart').value = g.fibonacciStart.value;
  document.getElementById('petalMultValue').textContent = g.petalMultiplier.mean.toFixed(2);
  document.getElementById('petalMultMeta').textContent = `σ: ${g.petalMultiplier.stdDev.toFixed(2)} | skew: ${g.petalMultiplier.skew.toFixed(1)}`;
  document.getElementById('petalMult').value = g.petalMultiplier.mean;
  document.getElementById('outerRadiusValue').textContent = g.outerRadius.mean.toFixed(2);
  document.getElementById('outerRadiusMeta').textContent = `σ: ${g.outerRadius.stdDev.toFixed(2)} | skew: ${g.outerRadius.skew.toFixed(1)}`;
  document.getElementById('outerRadius').value = g.outerRadius.mean;
  document.getElementById('thicknessValue').textContent = g.thickness.mean.toFixed(2);
  document.getElementById('thicknessMeta').textContent = `σ: ${g.thickness.stdDev.toFixed(2)} | skew: ${g.thickness.skew.toFixed(1)}`;
  document.getElementById('thickness').value = g.thickness.mean;
  document.getElementById('midpointValue').textContent = g.midpoint.mean.toFixed(2);
  document.getElementById('midpointMeta').textContent = `σ: ${g.midpoint.stdDev.toFixed(2)} | skew: ${g.midpoint.skew.toFixed(1)}`;
  document.getElementById('midpoint').value = g.midpoint.mean;
  document.getElementById('curvatureValue').textContent = g.curvature.mean.toFixed(2);
  document.getElementById('curvatureMeta').textContent = `σ: ${g.curvature.stdDev.toFixed(2)} | skew: ${g.curvature.skew.toFixed(1)}`;
  document.getElementById('curvature').value = g.curvature.mean;
  document.getElementById('tangentValue').textContent = g.tangent.value + '°';
  document.getElementById('tangent').value = g.tangent.value;
  document.getElementById('scaleValue').textContent = g.scale.mean.toFixed(2);
  document.getElementById('scaleMeta').textContent = `σ: ${g.scale.stdDev.toFixed(2)} | skew: ${g.scale.skew.toFixed(1)}`;
  document.getElementById('scale').value = g.scale.mean;
  document.getElementById('rotationValue').textContent = g.rotation.value + '°';
  document.getElementById('rotation').value = g.rotation.value;
  document.getElementById('jiggleValue').textContent = g.jiggle.mean.toFixed(2);
  document.getElementById('jiggleMeta').textContent = `σ: ${g.jiggle.stdDev.toFixed(2)} | skew: ${g.jiggle.skew.toFixed(1)}`;
  document.getElementById('jiggle').value = g.jiggle.mean;
  document.getElementById('colorOuter').value = labToHex(g.colorOuter.L, g.colorOuter.a, g.colorOuter.b);
  document.getElementById('colorInner').value = labToHex(g.colorInner.L, g.colorInner.a, g.colorInner.b);
  document.getElementById('dnaString').value = encodeGenome(g);
  document.getElementById('fibStartGroup').style.display = g.petalMode.value === 'fibonacci' ? 'block' : 'none';
  document.getElementById('petalMultGroup').style.display = g.petalMode.value === 'multiplier' ? 'block' : 'none';
}

function render() {
  if (currentMode === 'single') {
    drawFlora(document.getElementById('singleCanvas'), singleGenome);
  } else {
    drawFlora(document.getElementById('parentACanvas'), parentAGenome);
    drawFlora(document.getElementById('parentBCanvas'), parentBGenome);
    drawFlora(document.getElementById('offspringCanvas'), offspringGenome);
  }
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

function updateModeUI() {
  const sf = document.getElementById('singleFrame');
  const paf = document.getElementById('parentAFrame');
  const pbf = document.getElementById('parentBFrame');
  const of = document.getElementById('offspringFrame');
  const conn = document.getElementById('connector');
  const rb = document.getElementById('randomizeBtn');
  const rab = document.getElementById('randomizeABtn');
  const rbb = document.getElementById('randomizeBBtn');
  const bb = document.getElementById('breedBtn');
  
  if (currentMode === 'single') {
    sf.classList.remove('hidden');
    paf.classList.add('hidden');
    pbf.classList.add('hidden');
    of.classList.add('hidden');
    conn.classList.add('hidden');
    rb.style.display = '';
    rab.style.display = 'none';
    rbb.style.display = 'none';
    bb.style.display = 'none';
    activeGenome = singleGenome;
  } else {
    sf.classList.add('hidden');
    paf.classList.remove('hidden');
    pbf.classList.remove('hidden');
    of.classList.remove('hidden');
    conn.classList.remove('hidden');
    rb.style.display = 'none';
    rab.style.display = '';
    rbb.style.display = '';
    bb.style.display = '';
    activeGenome = offspringGenome;
  }
  updateParamDisplays();
  render();
}

function setupEventListeners() {
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMode = btn.dataset.mode;
      updateModeUI();
    });
  });
  
  document.getElementById('randomizeBtn').addEventListener('click', () => {
    singleGenome = randomGenome();
    activeGenome = singleGenome;
    updateParamDisplays();
    render();
  });
  
  document.getElementById('randomizeABtn').addEventListener('click', () => {
    parentAGenome = randomGenome();
    offspringGenome = crossbreed(parentAGenome, parentBGenome);
    render();
  });
  
  document.getElementById('randomizeBBtn').addEventListener('click', () => {
    parentBGenome = randomGenome();
    offspringGenome = crossbreed(parentAGenome, parentBGenome);
    render();
  });
  
  document.getElementById('breedBtn').addEventListener('click', () => {
    offspringGenome = crossbreed(parentAGenome, parentBGenome);
    activeGenome = offspringGenome;
    updateParamDisplays();
    render();
  });
  
  document.getElementById('settingsBtn').addEventListener('click', () => {
    panelOpen = !panelOpen;
    document.getElementById('settingsPanel').classList.toggle('open', panelOpen);
    document.getElementById('settingsBtn').classList.toggle('active', panelOpen);
  });
  
  document.getElementById('closePanel').addEventListener('click', () => {
    panelOpen = false;
    document.getElementById('settingsPanel').classList.remove('open');
    document.getElementById('settingsBtn').classList.remove('active');
  });
  
  // Parameter sliders
  [
    { id: 'layers', key: 'layers', round: true },
    { id: 'basePetals', key: 'basePetals', round: true },
    { id: 'petalMult', key: 'petalMultiplier' },
    { id: 'outerRadius', key: 'outerRadius' },
    { id: 'thickness', key: 'thickness' },
    { id: 'midpoint', key: 'midpoint' },
    { id: 'curvature', key: 'curvature' },
    { id: 'scale', key: 'scale' },
    { id: 'jiggle', key: 'jiggle' }
  ].forEach(({ id, key, round }) => {
    document.getElementById(id).addEventListener('input', e => {
      activeGenome[key].mean = round ? Math.round(parseFloat(e.target.value)) : parseFloat(e.target.value);
      updateParamDisplays();
      render();
    });
  });
  
  // Uniform genes
  [{ id: 'tangent', key: 'tangent' }, { id: 'rotation', key: 'rotation' }].forEach(({ id, key }) => {
    document.getElementById(id).addEventListener('input', e => {
      activeGenome[key].value = parseInt(e.target.value);
      updateParamDisplays();
      render();
    });
  });
  
  // Discrete genes
  document.getElementById('petalMode').addEventListener('change', e => {
    activeGenome.petalMode.value = e.target.value;
    updateParamDisplays();
    render();
  });
  
  document.getElementById('fibStart').addEventListener('change', e => {
    activeGenome.fibonacciStart.value = parseInt(e.target.value);
    updateParamDisplays();
    render();
  });
  
  // Color inputs
  document.getElementById('colorOuter').addEventListener('input', e => {
    activeGenome.colorOuter = hexToLab(e.target.value);
    render();
  });
  
  document.getElementById('colorInner').addEventListener('input', e => {
    activeGenome.colorInner = hexToLab(e.target.value);
    render();
  });
  
  // DNA actions
  document.getElementById('copyDna').addEventListener('click', () => {
    navigator.clipboard.writeText(encodeGenome(activeGenome));
    showToast('Genome copied');
  });
  
  document.getElementById('loadDna').addEventListener('click', () => {
    const decoded = decodeGenome(document.getElementById('dnaString').value.trim());
    if (decoded) {
      if (currentMode === 'single') {
        singleGenome = decoded;
        activeGenome = singleGenome;
      }
      updateParamDisplays();
      render();
      showToast('Genome loaded');
    } else {
      showToast('Invalid genome');
    }
  });
}

