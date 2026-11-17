import * as THREE from 'three';

export interface ChamberWaypoint {
  index: string;
  id: string;
  label: string;
  subtitle: string;
  scrollAt: number;
  chamberY: number;
  camPos: [number, number, number];
  camTarget: [number, number, number];
  calloutOffset: [number, number, number];
}

export const CHAMBERS: ChamberWaypoint[] = [
  {
    index: '00',
    id: 'neural-core',
    label: 'NEURAL_CORE',
    subtitle: 'SYNAPTIC ORIGIN // 210 NODES',
    scrollAt: 0.0,
    chamberY: 0,
    camPos: [0, 1.35, 9.6],
    camTarget: [0, 0.15, 0],
    calloutOffset: [2.4, 1.5, 0.4],
  },
  {
    index: '01',
    id: 'crystal-monolith',
    label: 'CRYSTAL_MONOLITH',
    subtitle: 'FRACTURED MEMORY // SHARD CLUSTER',
    scrollAt: 0.24,
    chamberY: -24,
    camPos: [1.8, -23.1, 7.6],
    camTarget: [0, -24, 0],
    calloutOffset: [-2.1, 1.3, 0.5],
  },
  {
    index: '02',
    id: 'protocol-vault',
    label: 'PROTOCOL_VAULT',
    subtitle: 'HYPERCUBE MATRIX // MULTI-LAYER',
    scrollAt: 0.48,
    chamberY: -48,
    camPos: [-2.2, -46.8, 8.2],
    camTarget: [0, -48, 0],
    calloutOffset: [2.2, 1.6, 0.4],
  },
  {
    index: '03',
    id: 'portal-gate',
    label: 'CONSENSUS_GATE',
    subtitle: 'PORTAL RING // SCROLL TO ENTER',
    scrollAt: 0.68,
    chamberY: -72,
    camPos: [0, -71.8, 8.4],
    camTarget: [0, -72, -1.5],
    calloutOffset: [2.5, 1.4, 0.2],
  },
  {
    index: '04',
    id: 'blockchain-stage',
    label: 'BLOCKCHAIN_STAGE',
    subtitle: 'MORPHING LEDGER // 1200 PARTICLES',
    scrollAt: 1.0,
    chamberY: -96,
    camPos: [0, -94.1, 8.8],
    camTarget: [0, -95.4, 0],
    calloutOffset: [2.3, 1.1, 0.4],
  },
];

export type PedestalShapeId = 'cube' | 'knot' | 'helix';

export function createRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createCyanGlowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const half = size / 2;

  const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.2, 'rgba(0, 255, 255, 0.92)');
  grad.addColorStop(0.48, 'rgba(0, 255, 255, 0.25)');
  grad.addColorStop(1.0, 'rgba(0, 255, 255, 0.0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Chamber 0: Wireframe Mountain Ridge Terrain beneath the Hero Neural Core
 */
export function buildHeroTerrain(): {
  group: THREE.Group;
  dispose: () => void;
} {
  const group = new THREE.Group();
  group.position.set(0, -3.5, -1.5);

  const planeGeo = new THREE.PlaneGeometry(42, 32, 48, 36);
  planeGeo.rotateX(-Math.PI / 2);

  const pos = planeGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const distFromCenter = Math.hypot(x * 0.75, z);
    // Keep central basin low under the neural core, raise rugged ridges around perimeter
    const ridge =
      Math.sin(x * 0.32) * Math.cos(z * 0.28) * 1.15 +
      Math.sin(x * 0.7 + z * 0.5) * 0.42;
    const basin = THREE.MathUtils.smoothstep(distFromCenter, 2.2, 11.5);
    pos.setY(i, ridge * basin - (1 - basin) * 0.4);
  }
  planeGeo.computeVertexNormals();

  const solidMat = new THREE.MeshStandardMaterial({
    color: 0x16191e,
    roughness: 0.88,
    metalness: 0.15,
    flatShading: true,
  });
  const solidMesh = new THREE.Mesh(planeGeo, solidMat);
  group.add(solidMesh);

  const wireGeo = new THREE.WireframeGeometry(planeGeo);
  const wireMat = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
  });
  const wireMesh = new THREE.LineSegments(wireGeo, wireMat);
  wireMesh.position.y = 0.02;
  group.add(wireMesh);

  return {
    group,
    dispose: () => {
      planeGeo.dispose();
      solidMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
    },
  };
}

/**
 * Chamber 1: Fractured Crystal Monolith + Orbiting Shards (Igloo Artifact 1 style)
 */
export function buildCrystalMonolith(yPos: number): {
  group: THREE.Group;
  update: (elapsed: number, pointerX: number, pointerY: number) => void;
  dispose: () => void;
} {
  const group = new THREE.Group();
  group.position.set(0, yPos, 0);

  // Sculpted asymmetric crystal body
  const crystalGeo = new THREE.IcosahedronGeometry(1.75, 1);
  const posAttr = crystalGeo.attributes.position;
  const rng = createRng(4041);
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const z = posAttr.getZ(i);
    const stretchY = y * 1.48;
    const n = 0.84 + Math.sin(x * 2.1 + z * 1.7) * 0.18 + Math.cos(y * 2.4) * 0.12;
    posAttr.setXYZ(i, x * n * 0.86, stretchY * n, z * n * 0.88);
  }
  crystalGeo.computeVertexNormals();

  const crystalMat = new THREE.MeshPhysicalMaterial({
    color: 0x1c222b,
    roughness: 0.18,
    metalness: 0.72,
    clearcoat: 1.0,
    clearcoatRoughness: 0.12,
    flatShading: true,
  });
  const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
  group.add(crystalMesh);

  // Pure cyan faceted seam wireframe
  const edgeGeo = new THREE.EdgesGeometry(crystalGeo, 10);
  const edgeMat = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.48,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const edgeMesh = new THREE.LineSegments(edgeGeo, edgeMat);
  edgeMesh.scale.setScalar(1.006);
  group.add(edgeMesh);

  // Inner glowing core nucleus
  const coreGeo = new THREE.OctahedronGeometry(0.72, 0);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    wireframe: true,
    transparent: true,
    opacity: 0.55,
  });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  group.add(coreMesh);

  // Orbiting fractured crystal shards
  const shardCount = 26;
  const shardGeo = new THREE.TetrahedronGeometry(0.16, 0);
  const shardMat = new THREE.MeshStandardMaterial({
    color: 0x262d38,
    emissive: 0x00ffff,
    emissiveIntensity: 0.35,
    roughness: 0.25,
    metalness: 0.85,
    flatShading: true,
  });
  const shards = new THREE.InstancedMesh(shardGeo, shardMat, shardCount);
  const shardData: { r: number; speed: number; angle: number; yOff: number; scale: number }[] = [];
  const dummy = new THREE.Object3D();

  for (let i = 0; i < shardCount; i++) {
    shardData.push({
      r: 2.3 + rng() * 1.5,
      speed: (0.25 + rng() * 0.4) * (i % 2 === 0 ? 1 : -1),
      angle: rng() * Math.PI * 2,
      yOff: (rng() - 0.5) * 3.4,
      scale: 0.65 + rng() * 0.95,
    });
  }
  group.add(shards);

  return {
    group,
    update: (elapsed, pointerX, pointerY) => {
      crystalMesh.rotation.y = elapsed * 0.22 + pointerX * 0.35;
      crystalMesh.rotation.x = Math.sin(elapsed * 0.35) * 0.1 + pointerY * 0.22;
      edgeMesh.rotation.copy(crystalMesh.rotation);
      coreMesh.rotation.y = -elapsed * 0.45;
      coreMesh.rotation.z = elapsed * 0.3;

      for (let i = 0; i < shardCount; i++) {
        const s = shardData[i];
        const a = s.angle + elapsed * s.speed;
        dummy.position.set(
          Math.cos(a) * s.r,
          s.yOff + Math.sin(elapsed * 0.9 + i) * 0.2,
          Math.sin(a) * s.r
        );
        dummy.rotation.set(elapsed + i, elapsed * 0.7, i);
        dummy.scale.setScalar(s.scale);
        dummy.updateMatrix();
        shards.setMatrixAt(i, dummy.matrix);
      }
      shards.instanceMatrix.needsUpdate = true;
    },
    dispose: () => {
      crystalGeo.dispose();
      crystalMat.dispose();
      edgeGeo.dispose();
      edgeMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      shardGeo.dispose();
      shardMat.dispose();
    },
  };
}

/**
 * Chamber 2: Interlocking Protocol Hypercube Vault (Igloo Artifact 2 style)
 */
export function buildProtocolVault(yPos: number): {
  group: THREE.Group;
  update: (elapsed: number, pointerX: number, pointerY: number) => void;
  dispose: () => void;
} {
  const group = new THREE.Group();
  group.position.set(0, yPos, 0);

  const outerGeo = new THREE.BoxGeometry(2.7, 2.7, 2.7);
  const outerEdgesGeo = new THREE.EdgesGeometry(outerGeo);
  const outerEdgesMat = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const outerCube = new THREE.LineSegments(outerEdgesGeo, outerEdgesMat);
  group.add(outerCube);

  const midGeo = new THREE.BoxGeometry(1.85, 1.85, 1.85);
  const midSolidMat = new THREE.MeshStandardMaterial({
    color: 0x1a1f26,
    roughness: 0.22,
    metalness: 0.88,
    transparent: true,
    opacity: 0.82,
  });
  const midMesh = new THREE.Mesh(midGeo, midSolidMat);
  const midEdgesGeo = new THREE.EdgesGeometry(midGeo);
  const midEdgesMat = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.45,
  });
  midMesh.add(new THREE.LineSegments(midEdgesGeo, midEdgesMat));
  group.add(midMesh);

  // Glowing internal ledger data slabs
  const slabGeo = new THREE.PlaneGeometry(1.35, 1.35);
  const slabMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const slabsGroup = new THREE.Group();
  for (let i = -1; i <= 1; i++) {
    const slab = new THREE.Mesh(slabGeo, slabMat);
    slab.position.z = i * 0.42;
    slabsGroup.add(slab);
  }
  group.add(slabsGroup);

  // Orbiting mini block nodes around the vault
  const miniCount = 18;
  const miniGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
  const miniMat = new THREE.MeshStandardMaterial({
    color: 0x202630,
    emissive: 0x00ffff,
    emissiveIntensity: 0.45,
    roughness: 0.25,
    metalness: 0.9,
  });
  const miniBlocks = new THREE.InstancedMesh(miniGeo, miniMat, miniCount);
  const dummy = new THREE.Object3D();
  const rng = createRng(6022);
  const miniData = Array.from({ length: miniCount }, (_, i) => ({
    radius: 2.5 + rng() * 1.4,
    angle: (i / miniCount) * Math.PI * 2,
    y: (rng() - 0.5) * 2.6,
    speed: 0.2 + rng() * 0.35,
  }));
  group.add(miniBlocks);

  return {
    group,
    update: (elapsed, pointerX, pointerY) => {
      outerCube.rotation.y = elapsed * 0.2 + pointerX * 0.35;
      outerCube.rotation.x = elapsed * 0.12 + pointerY * 0.25;

      midMesh.rotation.y = -elapsed * 0.32 + pointerX * 0.2;
      midMesh.rotation.z = elapsed * 0.18;

      slabsGroup.rotation.y = elapsed * 0.45;
      slabsGroup.rotation.x = Math.sin(elapsed * 0.5) * 0.25;

      for (let i = 0; i < miniCount; i++) {
        const m = miniData[i];
        const a = m.angle + elapsed * m.speed;
        dummy.position.set(Math.cos(a) * m.radius, m.y, Math.sin(a) * m.radius);
        dummy.rotation.set(elapsed * 0.6 + i, elapsed * 0.8, 0);
        dummy.updateMatrix();
        miniBlocks.setMatrixAt(i, dummy.matrix);
      }
      miniBlocks.instanceMatrix.needsUpdate = true;
    },
    dispose: () => {
      outerGeo.dispose();
      outerEdgesGeo.dispose();
      outerEdgesMat.dispose();
      midGeo.dispose();
      midSolidMat.dispose();
      midEdgesGeo.dispose();
      midEdgesMat.dispose();
      slabGeo.dispose();
      slabMat.dispose();
      miniGeo.dispose();
      miniMat.dispose();
    },
  };
}

/**
 * Chamber 3: Concentric Segmented Portal Gate (Igloo 0:11 - 0:15 fly-through rings)
 */
export function buildPortalGate(yPos: number): {
  group: THREE.Group;
  update: (elapsed: number, pointerX: number, pointerY: number, flyProgress: number) => void;
  dispose: () => void;
} {
  const group = new THREE.Group();
  group.position.set(0, yPos, 0);

  const ringMatSolid = new THREE.MeshStandardMaterial({
    color: 0x1d222b,
    roughness: 0.22,
    metalness: 0.9,
  });
  const ringMatEdge = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.78,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const geometries: THREE.BufferGeometry[] = [];
  const rings: { container: THREE.Group; speed: number }[] = [];

  const ringSpecs = [
    { radius: 3.1, tube: 0.16, segments: 5, gap: 0.24, speed: 0.22 },
    { radius: 2.15, tube: 0.13, segments: 4, gap: 0.28, speed: -0.34 },
    { radius: 1.25, tube: 0.1, segments: 3, gap: 0.35, speed: 0.48 },
  ];

  ringSpecs.forEach((spec) => {
    const container = new THREE.Group();
    const arcSpan = (Math.PI * 2) / spec.segments - spec.gap;

    for (let s = 0; s < spec.segments; s++) {
      const startAngle = s * ((Math.PI * 2) / spec.segments);
      const torusGeo = new THREE.TorusGeometry(spec.radius, spec.tube, 10, 24, arcSpan);
      geometries.push(torusGeo);
      const arcMesh = new THREE.Mesh(torusGeo, ringMatSolid);
      arcMesh.rotation.z = startAngle;

      const edgeGeo = new THREE.EdgesGeometry(torusGeo, 18);
      geometries.push(edgeGeo);
      arcMesh.add(new THREE.LineSegments(edgeGeo, ringMatEdge));
      container.add(arcMesh);
    }

    group.add(container);
    rings.push({ container, speed: spec.speed });
  });

  // Radiant portal center core
  const haloTex = createCyanGlowTexture();
  const coreSpriteMat = new THREE.SpriteMaterial({
    map: haloTex,
    color: 0x00ffff,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const coreSprite = new THREE.Sprite(coreSpriteMat);
  coreSprite.scale.set(2.4, 2.4, 1);
  group.add(coreSprite);

  return {
    group,
    update: (elapsed, pointerX, pointerY, flyProgress) => {
      rings.forEach((r, idx) => {
        r.container.rotation.z = elapsed * r.speed;
        r.container.rotation.y = pointerX * 0.22 * (idx + 1) * 0.35;
        r.container.rotation.x = pointerY * 0.18 * (idx + 1) * 0.35;
        // Expand rings smoothly as camera dives straight through the portal
        const expand = 1 + flyProgress * (0.45 + idx * 0.22);
        r.container.scale.setScalar(expand);
      });
      const pulse = 2.2 + Math.sin(elapsed * 2.5) * 0.25 + flyProgress * 3.5;
      coreSprite.scale.set(pulse, pulse, 1);
    },
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      ringMatSolid.dispose();
      ringMatEdge.dispose();
      haloTex.dispose();
      coreSpriteMat.dispose();
    },
  };
}

/**
 * Chamber 4: Circular Pedestal Stage + 1,200 Morphing Pure Cyan Particles (Igloo 0:16 - 0:31 stage)
 */
export function buildPedestalStage(yPos: number): {
  group: THREE.Group;
  update: (
    elapsed: number,
    delta: number,
    shape: PedestalShapeId,
    pointerX: number,
    pointerY: number
  ) => void;
  dispose: () => void;
} {
  const group = new THREE.Group();
  group.position.set(0, yPos, 0);

  // Pedestal base disc + concentric cyan rings
  const baseGeo = new THREE.CylinderGeometry(3.8, 4.2, 0.28, 48);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x171a20,
    roughness: 0.35,
    metalness: 0.78,
  });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.y = -1.65;
  group.add(baseMesh);

  const ringGeos: THREE.BufferGeometry[] = [];
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  [1.6, 2.55, 3.55].forEach((r) => {
    const rGeo = new THREE.RingGeometry(r - 0.025, r, 64);
    rGeo.rotateX(-Math.PI / 2);
    ringGeos.push(rGeo);
    const rMesh = new THREE.Mesh(rGeo, ringMat);
    rMesh.position.y = -1.49;
    group.add(rMesh);
  });

  // Overhead halo ring
  const topRingGeo = new THREE.TorusGeometry(2.3, 0.03, 12, 64);
  topRingGeo.rotateX(Math.PI / 2);
  const topRingMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.52,
    blending: THREE.AdditiveBlending,
  });
  const topRing = new THREE.Mesh(topRingGeo, topRingMat);
  topRing.position.y = 2.45;
  group.add(topRing);

  // 1,200 Morphing Particles across 3 distinct 3D shapes (Blockchain Cube, Torus Knot, Chain Helix)
  const P_COUNT = 1200;
  const rng = createRng(88421);
  const cubeCoords = new Float32Array(P_COUNT * 3);
  const knotCoords = new Float32Array(P_COUNT * 3);
  const helixCoords = new Float32Array(P_COUNT * 3);
  const liveCoords = new Float32Array(P_COUNT * 3);

  const vTmp = new THREE.Vector3();
  const vNext = new THREE.Vector3();

  for (let i = 0; i < P_COUNT; i++) {
    const u = i / P_COUNT;

    // Shape 1: Distributed Blockchain Lattice Cube + Outer Ring
    if (i < 840) {
      const side = 2.15;
      // Bias points onto edges & sub-block grid nodes
      const face = Math.floor(rng() * 6);
      const a = (rng() - 0.5) * side;
      const b = (rng() - 0.5) * side;
      const h = side * 0.5;
      if (face === 0) vTmp.set(h, a, b);
      else if (face === 1) vTmp.set(-h, a, b);
      else if (face === 2) vTmp.set(a, h, b);
      else if (face === 3) vTmp.set(a, -h, b);
      else if (face === 4) vTmp.set(a, b, h);
      else vTmp.set(a, b, -h);
    } else {
      const ang = ((i - 840) / (P_COUNT - 840)) * Math.PI * 2;
      const rad = 2.1 + (rng() - 0.5) * 0.25;
      vTmp.set(Math.cos(ang) * rad, (rng() - 0.5) * 0.22, Math.sin(ang) * rad);
    }
    cubeCoords[i * 3] = vTmp.x;
    cubeCoords[i * 3 + 1] = vTmp.y + 0.25;
    cubeCoords[i * 3 + 2] = vTmp.z;

    // Shape 2: Torus Knot Mesh (p=3, q=4)
    const t = u * Math.PI * 2 * 3;
    const p = 2;
    const q = 3;
    const rKnot = 1.15 + 0.45 * Math.cos(q * t);
    vTmp.set(
      rKnot * Math.cos(p * t),
      0.55 * Math.sin(q * t) + 0.25,
      rKnot * Math.sin(p * t)
    );
    vTmp.x += (rng() - 0.5) * 0.24;
    vTmp.y += (rng() - 0.5) * 0.24;
    vTmp.z += (rng() - 0.5) * 0.24;
    knotCoords[i * 3] = vTmp.x;
    knotCoords[i * 3 + 1] = vTmp.y;
    knotCoords[i * 3 + 2] = vTmp.z;

    // Shape 3: Dual Chain Helix
    const strand = i % 2 === 0 ? 1 : -1;
    const hAngle = u * Math.PI * 6;
    const hRad = 1.05;
    vNext.set(
      Math.cos(hAngle) * hRad * strand + (rng() - 0.5) * 0.16,
      (u - 0.5) * 3.1 + 0.25,
      Math.sin(hAngle) * hRad * strand + (rng() - 0.5) * 0.16
    );
    helixCoords[i * 3] = vNext.x;
    helixCoords[i * 3 + 1] = vNext.y;
    helixCoords[i * 3 + 2] = vNext.z;

    liveCoords[i * 3] = cubeCoords[i * 3];
    liveCoords[i * 3 + 1] = cubeCoords[i * 3 + 1];
    liveCoords[i * 3 + 2] = cubeCoords[i * 3 + 2];
  }

  const particleGeo = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(liveCoords, 3);
  posAttr.setUsage(THREE.DynamicDrawUsage);
  particleGeo.setAttribute('position', posAttr);

  const glowTex = createCyanGlowTexture();
  const particleMat = new THREE.PointsMaterial({
    size: 0.14,
    map: glowTex,
    color: 0x00ffff,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const particleCloud = new THREE.Points(particleGeo, particleMat);
  group.add(particleCloud);

  return {
    group,
    update: (elapsed, delta, shape, pointerX, pointerY) => {
      const targetArr =
        shape === 'cube' ? cubeCoords : shape === 'knot' ? knotCoords : helixCoords;
      const lerpAlpha = 1 - Math.exp(-5.0 * delta);

      for (let i = 0; i < P_COUNT; i++) {
        const idx = i * 3;
        const tx = targetArr[idx];
        const ty = targetArr[idx + 1] + Math.sin(elapsed * 1.4 + i * 0.05) * 0.03;
        const tz = targetArr[idx + 2];

        liveCoords[idx] = THREE.MathUtils.lerp(liveCoords[idx], tx, lerpAlpha);
        liveCoords[idx + 1] = THREE.MathUtils.lerp(liveCoords[idx + 1], ty, lerpAlpha);
        liveCoords[idx + 2] = THREE.MathUtils.lerp(liveCoords[idx + 2], tz, lerpAlpha);
      }
      posAttr.needsUpdate = true;

      particleCloud.rotation.y = elapsed * 0.25 + pointerX * 0.45;
      particleCloud.rotation.x = pointerY * 0.22;
    },
    dispose: () => {
      baseGeo.dispose();
      baseMat.dispose();
      ringGeos.forEach((g) => g.dispose());
      ringMat.dispose();
      topRingGeo.dispose();
      topRingMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      glowTex.dispose();
    },
  };
}
