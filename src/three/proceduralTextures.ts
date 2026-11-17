import * as THREE from 'three';

/**
 * Pure Electric Cyan (#00FFFF) radial glow sprite texture (R=0, G=255, B=255 — zero green/blue drift).
 */
export function createPureCyanGlowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const half = size / 2;

  const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.16, 'rgba(0, 255, 255, 0.95)');
  grad.addColorStop(0.42, 'rgba(0, 255, 255, 0.30)');
  grad.addColorStop(1.0, 'rgba(0, 255, 255, 0.0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * High-DPI 1024x1024 procedural Pedestal Circuit & Telemetry Dial Texture for Chamber 04.
 * Strictly dark graphite (#14171D), brushed steel (#8A929A), and pure cyan (#00FFFF).
 */
export function createPedestalCircuitTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const c = size / 2;

  // Base dark graphite metallic plate
  const baseGrad = ctx.createRadialGradient(c, c, 30, c, c, c);
  baseGrad.addColorStop(0.0, '#1e2229');
  baseGrad.addColorStop(0.55, '#15181e');
  baseGrad.addColorStop(1.0, '#101216');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, size, size);

  // Concentric technical rings
  const ringRadii = [120, 190, 265, 330, 395, 455, 488];
  ringRadii.forEach((r, idx) => {
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.lineWidth = idx % 2 === 0 ? 1.5 : 1;
    ctx.strokeStyle =
      idx === 2 || idx === 5 ? 'rgba(0, 255, 255, 0.55)' : 'rgba(138, 146, 154, 0.25)';
    ctx.stroke();
  });

  // Segmented bright pure cyan circuit arcs
  const arcConfigs = [
    { r: 298, start: 0.2, end: 1.35, width: 3 },
    { r: 298, start: 2.1, end: 3.4, width: 3 },
    { r: 298, start: 4.1, end: 5.5, width: 3 },
    { r: 424, start: 0.7, end: 1.9, width: 2.5 },
    { r: 424, start: 3.1, end: 4.4, width: 2.5 },
    { r: 424, start: 5.0, end: 5.9, width: 2.5 },
  ];
  arcConfigs.forEach((arc) => {
    ctx.beginPath();
    ctx.arc(c, c, arc.r, arc.start, arc.end);
    ctx.lineWidth = arc.width;
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.85)';
    ctx.stroke();
  });

  // Radial precision degree tick marks around outer perimeter
  for (let i = 0; i < 120; i++) {
    const angle = (i / 120) * Math.PI * 2;
    const isMajor = i % 10 === 0;
    const rInner = isMajor ? 456 : 468;
    const rOuter = 484;
    ctx.beginPath();
    ctx.moveTo(c + Math.cos(angle) * rInner, c + Math.sin(angle) * rInner);
    ctx.lineTo(c + Math.cos(angle) * rOuter, c + Math.sin(angle) * rOuter);
    ctx.lineWidth = isMajor ? 2 : 1;
    ctx.strokeStyle = isMajor ? 'rgba(0, 255, 255, 0.85)' : 'rgba(138, 146, 154, 0.35)';
    ctx.stroke();
  }

  // Orthogonal & diagonal circuit bus traces
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(c + Math.cos(a) * 124, c + Math.sin(a) * 124);
    ctx.lineTo(c + Math.cos(a) * 392, c + Math.sin(a) * 392);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = i % 2 === 0 ? 'rgba(0, 255, 255, 0.32)' : 'rgba(138, 146, 154, 0.2)';
    ctx.stroke();

    // Small square terminal pad on trace
    const px = c + Math.cos(a) * 355;
    const py = c + Math.sin(a) * 355;
    ctx.fillStyle = '#00FFFF';
    ctx.fillRect(px - 3, py - 3, 6, 6);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, maxAnisotropy || 4);
  tex.needsUpdate = true;
  return tex;
}

/**
 * Subtle brushed obsidian/graphite noise map for basalt & obsidian cube blocks.
 */
export function createObsidianSurfaceTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#181b21';
  ctx.fillRect(0, 0, size, size);

  // Subtle crystalline micro-fracture lines
  let seed = 42019;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  for (let i = 0; i < 90; i++) {
    const x1 = rnd() * size;
    const y1 = rnd() * size;
    const len = 18 + rnd() * 64;
    const ang = rnd() * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + Math.cos(ang) * len, y1 + Math.sin(ang) * len);
    ctx.lineWidth = 0.8 + rnd() * 1.1;
    ctx.strokeStyle = rnd() > 0.7 ? 'rgba(0, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.06)';
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = Math.min(8, maxAnisotropy || 4);
  tex.needsUpdate = true;
  return tex;
}

/**
 * Procedural 512x512 Binary Blockchain Block Texture Pair (map + emissiveMap)
 * Matching Reference Image 1: dark graphite matrix cells populated with crisp 0 & 1 digits,
 * glowing pure cyan (#00FFFF) and bright white highlighted bits.
 */
export function createBinaryBlockchainBlockTextures(
  maxAnisotropy: number,
  seedOffset = 0
): {
  map: THREE.CanvasTexture;
  emissiveMap: THREE.CanvasTexture;
} {
  const size = 512;
  const cols = 10;
  const rows = 10;
  const cellW = size / cols;
  const cellH = size / rows;

  const mapCanvas = document.createElement('canvas');
  mapCanvas.width = size;
  mapCanvas.height = size;
  const mCtx = mapCanvas.getContext('2d')!;

  const emCanvas = document.createElement('canvas');
  emCanvas.width = size;
  emCanvas.height = size;
  const eCtx = emCanvas.getContext('2d')!;

  // Dark graphite block surface
  const bgGrad = mCtx.createLinearGradient(0, 0, size, size);
  bgGrad.addColorStop(0, '#10151b');
  bgGrad.addColorStop(0.5, '#151b22');
  bgGrad.addColorStop(1, '#0e1318');
  mCtx.fillStyle = bgGrad;
  mCtx.fillRect(0, 0, size, size);

  eCtx.fillStyle = '#000000';
  eCtx.fillRect(0, 0, size, size);

  let seed = 918273 + seedOffset * 4099;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  // Matrix cell borders
  mCtx.strokeStyle = 'rgba(0, 255, 255, 0.22)';
  mCtx.lineWidth = 1.5;
  eCtx.strokeStyle = 'rgba(0, 255, 255, 0.16)';
  eCtx.lineWidth = 1.5;

  for (let i = 0; i <= cols; i++) {
    const x = i * cellW;
    mCtx.beginPath();
    mCtx.moveTo(x, 0);
    mCtx.lineTo(x, size);
    mCtx.stroke();

    eCtx.beginPath();
    eCtx.moveTo(x, 0);
    eCtx.lineTo(x, size);
    eCtx.stroke();
  }
  for (let j = 0; j <= rows; j++) {
    const y = j * cellH;
    mCtx.beginPath();
    mCtx.moveTo(0, y);
    mCtx.lineTo(size, y);
    mCtx.stroke();

    eCtx.beginPath();
    eCtx.moveTo(0, y);
    eCtx.lineTo(size, y);
    eCtx.stroke();
  }

  // Binary 0 & 1 glyphs with selective pure cyan / white hot bits
  mCtx.font = 'bold 31px "JetBrains Mono", ui-monospace, monospace';
  mCtx.textAlign = 'center';
  mCtx.textBaseline = 'middle';

  eCtx.font = 'bold 31px "JetBrains Mono", ui-monospace, monospace';
  eCtx.textAlign = 'center';
  eCtx.textBaseline = 'middle';

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const bit = rnd() > 0.48 ? '1' : '0';
      const intensity = rnd();
      const cx = c * cellW + cellW / 2;
      const cy = r * cellH + cellH / 2 + 2;

      if (intensity > 0.88) {
        // Hot blazing white-cyan bit
        mCtx.fillStyle = '#00FFFF';
        mCtx.fillRect(c * cellW + 2, r * cellH + 2, cellW - 4, cellH - 4);
        mCtx.fillStyle = '#121417';
        mCtx.fillText(bit, cx, cy);

        eCtx.fillStyle = 'rgba(0, 255, 255, 0.35)';
        eCtx.fillRect(c * cellW + 2, r * cellH + 2, cellW - 4, cellH - 4);
        eCtx.fillStyle = '#FFFFFF';
        eCtx.fillText(bit, cx, cy);
      } else if (intensity > 0.54) {
        // Crisp Pure Cyan bit
        mCtx.fillStyle = '#00FFFF';
        mCtx.fillText(bit, cx, cy);
        eCtx.fillStyle = '#00FFFF';
        eCtx.fillText(bit, cx, cy);
      } else {
        // Subtle recessed cyan-grey bit
        mCtx.fillStyle = 'rgba(0, 255, 255, 0.34)';
        mCtx.fillText(bit, cx, cy);
        eCtx.fillStyle = 'rgba(0, 255, 255, 0.16)';
        eCtx.fillText(bit, cx, cy);
      }
    }
  }

  // Crisp outer perimeter circuit rim
  mCtx.strokeStyle = 'rgba(0, 255, 255, 0.85)';
  mCtx.lineWidth = 6;
  mCtx.strokeRect(3, 3, size - 6, size - 6);

  eCtx.strokeStyle = '#00FFFF';
  eCtx.lineWidth = 4;
  eCtx.strokeRect(3, 3, size - 6, size - 6);

  const map = new THREE.CanvasTexture(mapCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = Math.min(8, maxAnisotropy || 4);
  map.needsUpdate = true;

  const emissiveMap = new THREE.CanvasTexture(emCanvas);
  emissiveMap.colorSpace = THREE.SRGBColorSpace;
  emissiveMap.anisotropy = Math.min(8, maxAnisotropy || 4);
  emissiveMap.needsUpdate = true;

  return { map, emissiveMap };
}

/**
 * Crisp transparent technical readout texture for 3D neural weights, biases, and activations
 * (e.g. "w = +0.94", "b = -0.12", "a = 0.91").
 */
export function createNeuralMetricSpriteTexture(
  label: string,
  highlight = false
): THREE.CanvasTexture {
  const width = 256;
  const height = 64;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, width, height);

  // Subtle dark graphite backing with sharp hairline cyan tick (no rounded pill)
  ctx.fillStyle = 'rgba(14, 17, 22, 0.78)';
  ctx.fillRect(14, 12, width - 28, height - 24);

  ctx.strokeStyle = highlight ? 'rgba(0, 255, 255, 0.85)' : 'rgba(0, 255, 255, 0.45)';
  ctx.lineWidth = 2;
  ctx.strokeRect(14, 12, width - 28, height - 24);

  // Tiny square anchor dot on left edge
  ctx.fillStyle = '#00FFFF';
  ctx.fillRect(22, height / 2 - 4, 8, 8);

  ctx.font = 'bold 24px "JetBrains Mono", ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = highlight ? '#FFFFFF' : '#00FFFF';
  ctx.fillText(label, 40, height / 2 + 1);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}


