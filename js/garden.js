// ==========================================
// GARDEN MODE LOGIC
// ==========================================
import { randomGenome, crossbreed } from './genetics.js';
import { drawFlora } from './drawing.js';
import { generateId } from './math-utils.js';

let gridSize = 4;
let currentGeneration = 1;
let garden = []; // Array of specimens in current grid
let archive = {}; // All specimens ever created, by ID
let selectedCells = new Set();
let hoveredSpecimen = null;

// Expose archive to global scope for onclick handlers
window.gardenArchive = () => archive;
window.gardenShowSpecimenDetails = (specimen) => showSpecimenDetails(specimen);
window.gardenOpenFullTree = (id) => openFullTree(id);

function createSpecimen(generation) {
  return {
    id: generateId(),
    genome: randomGenome(),
    parentA: null,
    parentB: null,
    generation
  };
}

export function initGarden() {
  garden = [];
  archive = {};
  selectedCells.clear();
  currentGeneration = 1;
  const count = gridSize * gridSize;
  for (let i = 0; i < count; i++) {
    const specimen = createSpecimen(1);
    garden.push(specimen);
    archive[specimen.id] = specimen;
  }
  renderGarden();
  updateStats();
  setupEventListeners();
}

function renderGarden() {
  const grid = document.getElementById('gardenGrid');
  grid.innerHTML = '';
  grid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
  grid.style.maxWidth = `${gridSize * 140 + (gridSize - 1) * 16}px`;

  garden.forEach((specimen, index) => {
    const cell = document.createElement('div');
    cell.className = 'garden-cell' + (selectedCells.has(index) ? ' selected' : '');
    cell.dataset.index = index;

    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    drawFlora(canvas, specimen.genome);
    cell.appendChild(canvas);

    const info = document.createElement('div');
    info.className = 'cell-info';
    info.innerHTML = `<div class="cell-gen">Gen ${specimen.generation}</div><div class="cell-id">${specimen.id}</div>`;
    cell.appendChild(info);

    cell.addEventListener('click', () => toggleSelection(index));
    cell.addEventListener('mouseenter', () => showSpecimenDetails(specimen));
    cell.addEventListener('mouseleave', () => { /* Keep showing last hovered */ });

    grid.appendChild(cell);
  });
}

function toggleSelection(index) {
  if (selectedCells.has(index)) {
    selectedCells.delete(index);
  } else {
    selectedCells.add(index);
  }
  renderGarden();
  updateStats();
}

function updateStats() {
  document.getElementById('genNumber').textContent = currentGeneration;
  document.getElementById('selectedCount').textContent = selectedCells.size;
  document.getElementById('totalSpecimens').textContent = Object.keys(archive).length;
  document.getElementById('cullBtn').disabled = selectedCells.size === 0;
}

function cullSelected() {
  if (selectedCells.size === 0) return;
  if (selectedCells.size >= garden.length) {
    showToast('Cannot cull all specimens!');
    return;
  }
  // Remove selected from garden (not from archive - they're still ancestors)
  const remaining = garden.filter((_, i) => !selectedCells.has(i));
  garden = remaining;
  selectedCells.clear();
  renderGarden();
  updateStats();
  showToast(`Culled ${garden.length} specimens remain`);
}

function breedNextGeneration() {
  if (garden.length < 2) {
    showToast('Need at least 2 specimens to breed!');
    return;
  }

  currentGeneration++;
  const targetCount = gridSize * gridSize;
  const survivors = [...garden];
  const newGarden = [];

  // Fill grid with offspring from survivors
  for (let i = 0; i < targetCount; i++) {
    // Randomly select two different parents
    const parentAIdx = Math.floor(Math.random() * survivors.length);
    let parentBIdx = Math.floor(Math.random() * survivors.length);
    while (parentBIdx === parentAIdx && survivors.length > 1) {
      parentBIdx = Math.floor(Math.random() * survivors.length);
    }

    const parentA = survivors[parentAIdx];
    const parentB = survivors[parentBIdx];

    const offspring = crossbreed(
      parentA.genome,
      parentB.genome,
      parentA.id,
      parentB.id,
      currentGeneration
    );

    newGarden.push(offspring);
    archive[offspring.id] = offspring;
  }

  garden = newGarden;
  selectedCells.clear();
  renderGarden();
  updateStats();
  showToast(`Generation ${currentGeneration} bred!`);
}

function showSpecimenDetails(specimen) {
  hoveredSpecimen = specimen;
  const content = document.getElementById('sidebarContent');
  
  // Get ancestors
  const ancestors = getAncestors(specimen.id, 3);
  
  content.innerHTML = `
    <div class="preview-section">
      <div class="preview-canvas-wrap">
        <canvas id="previewCanvas" width="300" height="300"></canvas>
      </div>
      <div class="preview-stats">
        <div class="preview-stat">
          <div class="preview-stat-label">Generation</div>
          <div class="preview-stat-value">${specimen.generation}</div>
        </div>
        <div class="preview-stat">
          <div class="preview-stat-label">ID</div>
          <div class="preview-stat-value" style="font-family: monospace; font-size: 12px;">${specimen.id}</div>
        </div>
        <div class="preview-stat">
          <div class="preview-stat-label">Layers</div>
          <div class="preview-stat-value">${Math.round(specimen.genome.layers.mean)}</div>
        </div>
        <div class="preview-stat">
          <div class="preview-stat-label">Petal Mode</div>
          <div class="preview-stat-value" style="text-transform: capitalize;">${specimen.genome.petalMode.value}</div>
        </div>
      </div>
    </div>

    <div class="tree-section">
      <div class="tree-section-title">Lineage (${ancestors.length} ancestors)</div>
      <div class="family-tree">
        ${renderLineageNodes(specimen, ancestors)}
      </div>
      ${ancestors.length > 0 ? `<button class="btn" style="width: 100%; margin-top: 16px;" onclick="window.gardenOpenFullTree('${specimen.id}')">View Full Family Tree</button>` : ''}
    </div>
  `;

  drawFlora(document.getElementById('previewCanvas'), specimen.genome);
}

function getAncestors(id, maxDepth, depth = 0) {
  if (depth >= maxDepth) return [];
  const specimen = archive[id];
  if (!specimen) return [];
  
  const ancestors = [];
  
  if (specimen.parentA && archive[specimen.parentA]) {
    ancestors.push({ ...archive[specimen.parentA], relation: 'Parent A', depth: depth + 1 });
    ancestors.push(...getAncestors(specimen.parentA, maxDepth, depth + 1));
  }
  if (specimen.parentB && archive[specimen.parentB]) {
    ancestors.push({ ...archive[specimen.parentB], relation: 'Parent B', depth: depth + 1 });
    ancestors.push(...getAncestors(specimen.parentB, maxDepth, depth + 1));
  }
  
  return ancestors;
}

function renderLineageNodes(current, ancestors) {
  let html = `
    <div class="tree-node current">
      <canvas class="tree-node-canvas" width="80" height="80" id="node-${current.id}"></canvas>
      <div class="tree-node-info">
        <div class="tree-node-gen">Gen ${current.generation}</div>
        <div class="tree-node-id">${current.id}</div>
      </div>
      <span class="tree-node-relation">Current</span>
    </div>
  `;

  // Group by depth
  const byDepth = {};
  ancestors.forEach(a => {
    if (!byDepth[a.depth]) byDepth[a.depth] = [];
    byDepth[a.depth].push(a);
  });

  Object.keys(byDepth).sort((a, b) => a - b).forEach(depth => {
    byDepth[depth].forEach(ancestor => {
      html += `
        <div class="tree-node" onclick="window.gardenShowSpecimenDetails(window.gardenArchive()['${ancestor.id}'])" style="margin-left: ${depth * 16}px;">
          <canvas class="tree-node-canvas" width="80" height="80" id="node-${ancestor.id}"></canvas>
          <div class="tree-node-info">
            <div class="tree-node-gen">Gen ${ancestor.generation}</div>
            <div class="tree-node-id">${ancestor.id}</div>
          </div>
          <span class="tree-node-relation">${ancestor.relation}</span>
        </div>
      `;
    });
  });

  // Schedule canvas drawing
  setTimeout(() => {
    const currentCanvas = document.getElementById(`node-${current.id}`);
    if (currentCanvas) drawFlora(currentCanvas, current.genome);
    
    ancestors.forEach(a => {
      const canvas = document.getElementById(`node-${a.id}`);
      if (canvas) drawFlora(canvas, a.genome);
    });
  }, 0);

  return html;
}

function openFullTree(id) {
  const specimen = archive[id];
  if (!specimen) return;

  const modal = document.getElementById('treeModal');
  const body = document.getElementById('treeModalBody');
  
  body.innerHTML = buildFullTreeHTML(specimen);
  modal.classList.add('open');

  // Draw all canvases
  setTimeout(() => {
    document.querySelectorAll('.tree-card canvas').forEach(canvas => {
      const specId = canvas.dataset.id;
      if (archive[specId]) {
        drawFlora(canvas, archive[specId].genome);
      }
    });
  }, 50);
}

function buildFullTreeHTML(specimen, depth = 0) {
  if (depth > 5) return ''; // Limit depth
  
  const hasParents = specimen.parentA && specimen.parentB && archive[specimen.parentA] && archive[specimen.parentB];
  
  let html = `
    <div class="full-tree">
      <div class="tree-card ${depth === 0 ? 'highlight' : ''}">
        <canvas width="160" height="160" data-id="${specimen.id}"></canvas>
        <div class="tree-card-gen">Gen ${specimen.generation}</div>
        <div class="tree-card-label">${specimen.id.slice(0, 6)}</div>
      </div>
  `;

  if (hasParents) {
    const parentA = archive[specimen.parentA];
    const parentB = archive[specimen.parentB];
    
    html += `
      <div class="tree-connector"></div>
      <div class="tree-row">
        <div style="text-align: center;">
          <div class="tree-card">
            <canvas width="160" height="160" data-id="${parentA.id}"></canvas>
            <div class="tree-card-gen">Gen ${parentA.generation}</div>
            <div class="tree-card-label">Parent A</div>
          </div>
          ${parentA.parentA ? buildParentBranch(parentA, depth + 1) : ''}
        </div>
        <div style="text-align: center;">
          <div class="tree-card">
            <canvas width="160" height="160" data-id="${parentB.id}"></canvas>
            <div class="tree-card-gen">Gen ${parentB.generation}</div>
            <div class="tree-card-label">Parent B</div>
          </div>
          ${parentB.parentA ? buildParentBranch(parentB, depth + 1) : ''}
        </div>
      </div>
    `;
  }

  html += '</div>';
  return html;
}

function buildParentBranch(specimen, depth) {
  if (depth > 4 || !specimen.parentA || !specimen.parentB) return '';
  
  const parentA = archive[specimen.parentA];
  const parentB = archive[specimen.parentB];
  if (!parentA || !parentB) return '';

  return `
    <div class="tree-connector"></div>
    <div class="tree-row" style="transform: scale(0.8); transform-origin: top center;">
      <div class="tree-card">
        <canvas width="120" height="120" data-id="${parentA.id}"></canvas>
        <div class="tree-card-gen">Gen ${parentA.generation}</div>
      </div>
      <div class="tree-card">
        <canvas width="120" height="120" data-id="${parentB.id}"></canvas>
        <div class="tree-card-gen">Gen ${parentB.generation}</div>
      </div>
    </div>
  `;
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

function setGridSize(size) {
  gridSize = size;
  document.querySelectorAll('.grid-size-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.size) === size);
  });
  initGarden();
}

function setupEventListeners() {
  document.getElementById('cullBtn').addEventListener('click', cullSelected);
  document.getElementById('breedBtn').addEventListener('click', breedNextGeneration);
  document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('treeModal').classList.remove('open');
  });
  document.getElementById('treeModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('treeModal')) {
      document.getElementById('treeModal').classList.remove('open');
    }
  });
  document.querySelectorAll('.grid-size-btn').forEach(btn => {
    btn.addEventListener('click', () => setGridSize(parseInt(btn.dataset.size)));
  });
}

