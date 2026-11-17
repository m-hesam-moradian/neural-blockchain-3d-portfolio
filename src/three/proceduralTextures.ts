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
