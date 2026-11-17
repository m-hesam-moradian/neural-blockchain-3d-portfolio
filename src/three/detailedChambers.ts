import * as THREE from 'three';

export type PedestalMode = 'blockchain' | 'neural' | 'helix';

export function createRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Helper: Build a glowing Pure Cyan Ball-and-Stick 3D Network (used inside the Hero Neuron)
 */
function buildInnerBallStickNetwork(
  variant: 'lattice' | 'cluster',
  scale: number,
  disposables: { dispose: () => void }[]
): THREE.Group {
  const group = new THREE.Group();
  const points: THREE.Vector3[] = [];
  const edges: [number, number][] = [];

  if (variant === 'lattice') {
    const s = 0.42 * scale;
    const inner = 0.2 * scale;
    for (let x = -1; x <= 1; x += 2) {
      for (let y = -1; y <= 1; y += 2) {
        for (let z = -1; z <= 1; z += 2) {
          points.push(new THREE.Vector3(x * s, y * s, z * s));
        }
      }
    }
    for (let x = -1; x <= 1; x += 2) {
      for (let y = -1; y <= 1; y += 2) {
        for (let z = -1; z <= 1; z += 2) {
          points.push(new THREE.Vector3(x * inner, y * inner, z * inner));
        }
      }
    }
    points.push(new THREE.Vector3(0, 0, 0));

    for (let i = 0; i < 8; i++) {
      for (let j = i + 1; j < 8; j++) {
        const diff = i ^ j;
        if (diff === 1 || diff === 2 || diff === 4) {
          edges.push([i, j]);
          edges.push([i + 8, j + 8]);
        }
      }
      edges.push([i, i + 8]);
      edges.push([i + 8, 16]);
    }
  } else {
    points.push(new THREE.Vector3(0, 0, 0));
    const ico = new THREE.IcosahedronGeometry(0.46 * scale, 0);
    const pos = ico.attributes.position;
    const unique: THREE.Vector3[] = [];
    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i);
      if (!unique.some((u) => u.distanceToSquared(v) < 0.001)) unique.push(v);
    }
    ico.dispose();
    unique.forEach((v) => points.push(v));
    for (let i = 1; i < points.length; i++) {
      edges.push([0, i]);
      for (let j = i + 1; j < points.length; j++) {
        if (points[i].distanceTo(points[j]) < 0.56 * scale) {
          edges.push([i, j]);
        }
      }
    }
  }

  const sphereGeo = new THREE.SphereGeometry(0.042 * scale, 10, 10);
  const sphereMat = new THREE.MeshBasicMaterial({ color: 0xd8ffff });
  const spheres = new THREE.InstancedMesh(sphereGeo, sphereMat, points.length);
  const dummy = new THREE.Object3D();
  points.forEach((p, idx) => {
    dummy.position.copy(p);
    dummy.scale.setScalar(idx === points.length - 1 ? 1.45 : 1.0);
    dummy.updateMatrix();
    spheres.setMatrixAt(idx, dummy.matrix);
  });
  spheres.instanceMatrix.needsUpdate = true;
  group.add(spheres);

  const linePos = new Float32Array(edges.length * 6);
  edges.forEach(([a, b], idx) => {
    const pA = points[a];
    const pB = points[b];
    linePos[idx * 6] = pA.x;
    linePos[idx * 6 + 1] = pA.y;
    linePos[idx * 6 + 2] = pA.z;
    linePos[idx * 6 + 3] = pB.x;
    linePos[idx * 6 + 4] = pB.y;
    linePos[idx * 6 + 5] = pB.z;
  });
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
  const lineMat = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.94,
    blending: THREE.AdditiveBlending,
  });
  group.add(new THREE.LineSegments(lineGeo, lineMat));

  disposables.push(sphereGeo, sphereMat, lineGeo, lineMat);
  return group;
}

/**
 * Shared Sculpted Mars/Volcanic Dark Mountain Landscape spanning CH.01 and CH.02
 */
export function buildVolcanicHorizonTerrain(): {
  root: THREE.Group;
  dispose: () => void;
} {
  const root = new THREE.Group();
  root.position.set(0, -2.5, -24);

  const terrainGeo = new THREE.PlaneGeometry(115, 115, 96, 96);
  terrainGeo.rotateX(-Math.PI / 2);
  const pos = terrainGeo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const worldZ = z - 24;

    const distSummit = Math.hypot(x * 0.85, worldZ);
    const distDrift = Math.hypot(x * 0.85, worldZ + 36);
    const basinMask =
      THREE.MathUtils.smoothstep(distSummit, 3.8, 16.0) *
      THREE.MathUtils.smoothstep(distDrift, 6.0, 18.0);

    const mountains =
      Math.abs(Math.sin(x * 0.16 + worldZ * 0.09)) * 4.8 +
      Math.abs(Math.cos(x * 0.31 - worldZ * 0.24)) * 2.2 +
      Math.sin(x * 0.72 + worldZ * 0.61) * 0.75 +
      Math.cos(x * 1.3 - worldZ * 1.1) * 0.28;

    const flankLift = Math.pow(Math.min(1, Math.abs(x) / 38), 1.4) * 5.2;
    pos.setY(i, (mountains + flankLift) * basinMask - 0.5);
  }
  terrainGeo.computeVertexNormals();

  const terrainMat = new THREE.MeshStandardMaterial({
    color: 0x181b20,
    roughness: 0.88,
    metalness: 0.18,
    flatShading: true,
  });
  root.add(new THREE.Mesh(terrainGeo, terrainMat));

  const wireGeo = new THREE.WireframeGeometry(terrainGeo);
  const wireMat = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.055,
    depthWrite: false,
  });
  const wire = new THREE.LineSegments(wireGeo, wireMat);
  wire.position.y = 0.03;
  root.add(wire);

  return {
    root,
    dispose: () => {
      terrainGeo.dispose();
      terrainMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
    },
  };
}

export interface BinaryTexPair {
  map: THREE.CanvasTexture;
  emissiveMap: THREE.CanvasTexture;
}

/**
 * CH.01 // SUMMIT: Stepped Columnar Basalt Plinth + Chained Binary Blockchain Blocks (0 & 1 matrices)
 * Chained together by live pure cyan cryptographic chain links.
 * Opens radially during scroll so camera flies DIRECTLY INSIDE toward the CH.02 Neural Network!
 */
export function buildSummitChamber(
  obsidianTex: THREE.CanvasTexture,
  glowTex: THREE.CanvasTexture,
  binaryTexA: BinaryTexPair,
  binaryTexB: BinaryTexPair
) {
  const root = new THREE.Group();
  root.position.set(0, 0, 0);

  const disposables: { dispose: () => void }[] = [];
  const rng = createRng(1001);

  // 1. Stepped Columnar Hexagonal Basalt Plinth
  const basaltCount = 46;
  const hexGeo = new THREE.CylinderGeometry(0.45, 0.49, 3.6, 6);
  const hexMat = new THREE.MeshStandardMaterial({
    color: 0x16191e,
    map: obsidianTex,
    roughness: 0.62,
    metalness: 0.42,
    flatShading: true,
  });
  const basaltCols = new THREE.InstancedMesh(hexGeo, hexMat, basaltCount);
  const dummy = new THREE.Object3D();

  for (let i = 0; i < basaltCount; i++) {
    const ring = i < 14 ? 0 : i < 30 ? 1 : 2;
    const segCount = ring === 0 ? 14 : 16;
    const angle = (i / segCount) * Math.PI * 2 + ring * 0.25;
    const rad =
      ring === 0 ? 0.65 + rng() * 0.8 : ring === 1 ? 1.85 + rng() * 0.7 : 2.85 + rng() * 0.85;
    const hScale = ring === 0 ? 1.15 : ring === 1 ? 0.82 + rng() * 0.3 : 0.45 + rng() * 0.32;
    dummy.position.set(Math.cos(angle) * rad, -2.5 + hScale * 1.1, Math.sin(angle) * rad);
    dummy.rotation.set(0, rng() * Math.PI, 0);
    dummy.scale.set(0.88 + rng() * 0.35, hScale, 0.88 + rng() * 0.35);
    dummy.updateMatrix();
    basaltCols.setMatrixAt(i, dummy.matrix);
  }
  basaltCols.instanceMatrix.needsUpdate = true;
  root.add(basaltCols);
  disposables.push(hexGeo, hexMat);

  // 2. Chained Binary Blockchain Block Cluster (0 & 1 Matrix Cubes — NO stones!)
  const monumentGroup = new THREE.Group();
  monumentGroup.position.set(0, 1.55, 0);
  root.add(monumentGroup);

  const wireBoxGeo = new THREE.BoxGeometry(0.94, 0.94, 0.94);
  const wireEdgeGeo = new THREE.EdgesGeometry(wireBoxGeo);
  const wireEdgeMat = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.72,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const blockGeo = new THREE.BoxGeometry(0.76, 0.76, 0.76);
  const blockMatA = new THREE.MeshStandardMaterial({
    map: binaryTexA.map,
    emissive: new THREE.Color(0x00ffff),
    emissiveMap: binaryTexA.emissiveMap,
    emissiveIntensity: 1.05,
    roughness: 0.22,
    metalness: 0.55,
  });
  const blockMatB = new THREE.MeshStandardMaterial({
    map: binaryTexB.map,
    emissive: new THREE.Color(0x00ffff),
    emissiveMap: binaryTexB.emissiveMap,
    emissiveIntensity: 1.05,
    roughness: 0.22,
    metalness: 0.55,
  });

  // Hero highlight frame material for selected Block #10 style cue
  const heroFrameGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.06, 1.06, 1.06));
  const heroFrameMat = new THREE.LineBasicMaterial({
    color: 0xd8ffff,
    transparent: true,
    opacity: 0.92,
    blending: THREE.AdditiveBlending,
  });

  disposables.push(
    wireBoxGeo,
    wireEdgeGeo,
    wireEdgeMat,
    blockGeo,
    blockMatA,
    blockMatB,
    heroFrameGeo,
    heroFrameMat
  );

  interface BlockchainCell {
    group: THREE.Group;
    basePos: THREE.Vector3;
    livePos: THREE.Vector3;
    openDir: THREE.Vector3;
    rotSeed: THREE.Vector3;
  }

  const cells: BlockchainCell[] = [];
  const slots: [number, number, number][] = [];

  for (let ix = -1; ix <= 1; ix++) {
    for (let iy = -1; iy <= 1; iy++) {
      for (let iz = -1; iz <= 1; iz++) {
        if (ix === 0 && iy === 0 && iz === 0) continue; // Hollow heart for singularity
        slots.push([ix, iy, iz]);
      }
    }
  }
  slots.push([0, 2, 0]); // Capstone Block

  slots.forEach(([ix, iy, iz], idx) => {
    const cellGroup = new THREE.Group();
    const basePos = new THREE.Vector3(ix * 1.08, iy * 1.08, iz * 1.08);
    cellGroup.position.copy(basePos);

    // Outer Pure Cyan Wireframe Cage
    cellGroup.add(new THREE.LineSegments(wireEdgeGeo, wireEdgeMat));

    // Inner Binary 0/1 Matrix Cube
    const blockMesh = new THREE.Mesh(blockGeo, idx % 2 === 0 ? blockMatA : blockMatB);
    cellGroup.add(blockMesh);

    // Highlight front-top capstone & front-center blocks like BLOCK_10 HUD framing
    if (idx === slots.length - 1 || (ix === 0 && iy === 1 && iz === 1)) {
      cellGroup.add(new THREE.LineSegments(heroFrameGeo, heroFrameMat));
    }

    const radialXY = new THREE.Vector3(
      ix === 0 ? (rng() > 0.5 ? 0.58 : -0.58) : ix,
      iy === 0 ? (rng() > 0.5 ? 0.48 : -0.48) : iy,
      iz * 0.35
    ).normalize();

    monumentGroup.add(cellGroup);
    cells.push({
      group: cellGroup,
      basePos,
      livePos: basePos.clone(),
      openDir: radialXY,
      rotSeed: new THREE.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5),
    });
  });

  // Cryptographic Chain Links connecting sequential & adjacent Blockchain Blocks together!
  const chainPairs: [number, number][] = [];
  for (let i = 0; i < cells.length; i++) {
    if (i < cells.length - 1) chainPairs.push([i, i + 1]);
    for (let j = i + 1; j < cells.length; j++) {
      const d = cells[i].basePos.distanceTo(cells[j].basePos);
      if (d > 0.5 && d < 1.25) {
        chainPairs.push([i, j]);
      }
    }
  }

  const chainPositions = new Float32Array(chainPairs.length * 6);
  const chainGeo = new THREE.BufferGeometry();
  const chainAttr = new THREE.BufferAttribute(chainPositions, 3);
  chainAttr.setUsage(THREE.DynamicDrawUsage);
  chainGeo.setAttribute('position', chainAttr);
  const chainMat = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.72,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const chainLines = new THREE.LineSegments(chainGeo, chainMat);
  monumentGroup.add(chainLines);
  disposables.push(chainGeo, chainMat);

  // Small chained binary data-packet nodes pulsing along chain links
  const linkNodeGeo = new THREE.BoxGeometry(0.11, 0.11, 0.11);
  const linkNodeMat = new THREE.MeshBasicMaterial({ color: 0xd8ffff });
  const linkNodeCount = Math.min(36, chainPairs.length);
  const linkNodes = new THREE.InstancedMesh(linkNodeGeo, linkNodeMat, linkNodeCount);
  monumentGroup.add(linkNodes);
  disposables.push(linkNodeGeo, linkNodeMat);

  // 3. Blazing Pure Cyan Singularity + 26 Sinuous Neural Tendrils inside Monument Core
  const singularitySpriteMat = new THREE.SpriteMaterial({
    map: glowTex,
    color: 0x00ffff,
    transparent: true,
    opacity: 0.98,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const singularitySprite = new THREE.Sprite(singularitySpriteMat);
  singularitySprite.scale.set(2.4, 2.4, 1);
  monumentGroup.add(singularitySprite);
  disposables.push(singularitySpriteMat);

  const tendrilMat = new THREE.MeshBasicMaterial({
    color: 0xd8ffff,
    transparent: true,
    opacity: 0.88,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  disposables.push(tendrilMat);

  const tendrilGroup = new THREE.Group();
  monumentGroup.add(tendrilGroup);
  const tendrilCount = 26;

  for (let t = 0; t < tendrilCount; t++) {
    const phi = (t / tendrilCount) * Math.PI * 2;
    const elevation = (rng() - 0.5) * 2.2;
    const dir = new THREE.Vector3(Math.cos(phi) * 1.4, elevation, Math.sin(phi) * 1.4).normalize();

    const p0 = new THREE.Vector3(0, 0, 0);
    const p1 = dir
      .clone()
      .multiplyScalar(1.3)
      .add(new THREE.Vector3((rng() - 0.5) * 0.6, (rng() - 0.5) * 0.6, (rng() - 0.5) * 0.6));
    const p2 = dir
      .clone()
      .multiplyScalar(2.7)
      .add(new THREE.Vector3((rng() - 0.5) * 0.9, (rng() - 0.5) * 0.9, (rng() - 0.5) * 0.9));
    const p3 = dir.clone().multiplyScalar(4.4);

    const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3]);
    const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.018, 5, false);
    disposables.push(tubeGeo);
    tendrilGroup.add(new THREE.Mesh(tubeGeo, tendrilMat));
  }

  // Tiny floating Pure Cyan data nodes
  const orbGeo = new THREE.SphereGeometry(0.052, 8, 8);
  const orbMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
  const orbCount = 96;
  const orbs = new THREE.InstancedMesh(orbGeo, orbMat, orbCount);
  const orbData = Array.from({ length: orbCount }, () => {
    const a = rng() * Math.PI * 2;
    const el = (rng() - 0.5) * Math.PI;
    const r = 0.45 + rng() * 2.8;
    return {
      pos: new THREE.Vector3(
        Math.cos(a) * Math.cos(el) * r,
        Math.sin(el) * r,
        Math.sin(a) * Math.cos(el) * r
      ),
      scale: 0.55 + rng() * 0.9,
      phase: rng() * Math.PI * 2,
    };
  });
  monumentGroup.add(orbs);
  disposables.push(orbGeo, orbMat);

  // Orbiting satellite binary block on upper-left (chained back to monument)
  const satBlockGroup = new THREE.Group();
  const satMesh = new THREE.Mesh(blockGeo, blockMatA);
  satMesh.scale.setScalar(0.56);
  const satWire = new THREE.LineSegments(wireEdgeGeo, wireEdgeMat);
  satWire.scale.setScalar(0.56);
  satBlockGroup.add(satMesh, satWire);
  monumentGroup.add(satBlockGroup);

  const _vTmp = new THREE.Vector3();

  return {
    root,
    update: (elapsed: number, pointerX: number, pointerY: number, openFactor: number) => {
      const cursorBoost = Math.min(0.42, Math.hypot(pointerX, pointerY) * 0.32);
      const spread = THREE.MathUtils.clamp(0.04 + cursorBoost * 0.5 + openFactor * 3.9, 0.04, 4.2);

      const rotScale = Math.max(0, 1 - openFactor * 1.4);
      monumentGroup.rotation.y = (elapsed * 0.08 + pointerX * 0.25) * rotScale;
      monumentGroup.rotation.x = pointerY * 0.14 * rotScale;

      for (let i = 0; i < cells.length; i++) {
        const c = cells[i];
        _vTmp.copy(c.basePos).addScaledVector(c.openDir, spread);
        _vTmp.y += Math.sin(elapsed * 1.1 + i * 0.35) * 0.03;
        c.livePos.copy(_vTmp);
        c.group.position.copy(_vTmp);
        c.group.rotation.set(
          c.rotSeed.x * spread * 0.24,
          c.rotSeed.y * spread * 0.24,
          c.rotSeed.z * spread * 0.2
        );
      }

      // Keep cryptographic chain links synced dynamically to every block's live position
      for (let p = 0; p < chainPairs.length; p++) {
        const [aIdx, bIdx] = chainPairs[p];
        const a = cells[aIdx].livePos;
        const b = cells[bIdx].livePos;
        chainPositions[p * 6] = a.x;
        chainPositions[p * 6 + 1] = a.y;
        chainPositions[p * 6 + 2] = a.z;
        chainPositions[p * 6 + 3] = b.x;
        chainPositions[p * 6 + 4] = b.y;
        chainPositions[p * 6 + 5] = b.z;
      }
      chainAttr.needsUpdate = true;

      for (let i = 0; i < linkNodeCount; i++) {
        const [aIdx, bIdx] = chainPairs[i];
        const t = (elapsed * 0.75 + i * 0.13) % 1;
        dummy.position.lerpVectors(cells[aIdx].livePos, cells[bIdx].livePos, t);
        dummy.rotation.set(elapsed, elapsed * 0.7, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        linkNodes.setMatrixAt(i, dummy.matrix);
      }
      linkNodes.instanceMatrix.needsUpdate = true;

      const singScale = 2.0 + Math.sin(elapsed * 2.6) * 0.25 + openFactor * 3.2;
      singularitySprite.scale.set(singScale, singScale, 1);

      tendrilGroup.rotation.z = elapsed * 0.15;
      tendrilGroup.scale.setScalar(0.55 + openFactor * 0.85);

      for (let i = 0; i < orbCount; i++) {
        const o = orbData[i];
        const s = (0.65 + openFactor * 0.75) * o.scale;
        dummy.position.copy(o.pos).multiplyScalar(0.65 + openFactor * 0.75);
        dummy.position.y += Math.sin(elapsed * 1.8 + o.phase) * 0.06;
        dummy.scale.setScalar(s);
        dummy.updateMatrix();
        orbs.setMatrixAt(i, dummy.matrix);
      }
      orbs.instanceMatrix.needsUpdate = true;

      satBlockGroup.position.set(
        -3.25 + Math.cos(elapsed * 0.6) * 0.25,
        1.48 + Math.sin(elapsed * 0.9) * 0.18,
        0.55
      );
      satBlockGroup.rotation.y = elapsed * 0.65;
      satBlockGroup.rotation.x = Math.sin(elapsed * 0.4) * 0.25;
    },
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}

/**
 * CH.02 // THE DRIFT: Layered 3D Deep Neural Network (matching Reference Image 2!)
 * Stage 1 (mixFactor 0->1): Order mixes up dynamically, scrambling layers in 3D space while Hero Neuron locks center.
 * Stage 2 (enterNeuronFactor 0->1): Hero Target Neuron expands and opens so the camera flies STRAIGHT INSIDE ONE NEURON!
 */
export function buildDriftChamber(
  zPos: number,
  glowTex: THREE.CanvasTexture,
  binaryTexA: BinaryTexPair
) {
  const root = new THREE.Group();
  root.position.set(0, 1.35, zPos);

  const disposables: { dispose: () => void }[] = [];
  const rng = createRng(2026);

  // Subtle cyan spatial floor grid beneath the Deep Neural Network (matches Screenshot_2026-11-16_195335)
  const floorGrid = new THREE.GridHelper(34, 24, 0x00ffff, 0x1b232c);
  floorGrid.position.set(0, -4.4, 0);
  const gridMat = floorGrid.material as THREE.Material;
  gridMat.transparent = true;
  gridMat.opacity = 0.22;
  root.add(floorGrid);
  disposables.push(floorGrid);

  interface NeuronNode {
    orderedPos: THREE.Vector3;
    mixedPos: THREE.Vector3;
    livePos: THREE.Vector3;
    layer: number;
    isHero: boolean;
    phase: number;
  }

  const neurons: NeuronNode[] = [];
  const layerCounts = [
    { x: -7.8, rows: 4, cols: 3, sx: 2.1, sy: 1.85 },
    { x: -3.9, rows: 3, cols: 3, sx: 1.65, sy: 1.55 },
    { x: 0.0, rows: 3, cols: 1, sx: 1.4, sy: 1.55 }, // Center bottleneck layer
    { x: 3.9, rows: 3, cols: 3, sx: 1.65, sy: 1.55 },
    { x: 7.8, rows: 4, cols: 3, sx: 2.1, sy: 1.85 },
  ];

  let heroIdx = -1;
  const layerIndices: number[][] = [];

  layerCounts.forEach((cfg, layerIdx) => {
    const indices: number[] = [];
    for (let r = 0; r < cfg.rows; r++) {
      for (let c = 0; c < cfg.cols; c++) {
        const y = (r - (cfg.rows - 1) / 2) * cfg.sy;
        const z = (c - (cfg.cols - 1) / 2) * cfg.sx;
        const orderedPos = new THREE.Vector3(cfg.x, y, z);

        // Hero Neuron is the dead-center bottleneck neuron at (0, 0, 0) local = (0, 1.35, -36) world
        const isHero = layerIdx === 2 && r === 1 && c === 0;
        if (isHero) heroIdx = neurons.length;

        // Mixed-up target position: layers break symmetry & swirl dynamically in 3D space
        const mixAngle = (rng() * Math.PI * 2);
        const mixRad = isHero ? 0 : 2.6 + rng() * 6.5;
        const mixedPos = isHero
          ? new THREE.Vector3(0, 0, -1.2) // Hero locks dead-center ahead of camera lens!
          : new THREE.Vector3(
              Math.cos(mixAngle) * mixRad + (rng() - 0.5) * 3.0,
              (rng() - 0.5) * 6.2,
              Math.sin(mixAngle) * mixRad * 0.75 - 1.5
            );

        indices.push(neurons.length);
        neurons.push({
          orderedPos,
          mixedPos,
          livePos: orderedPos.clone(),
          layer: layerIdx,
          isHero,
          phase: rng() * Math.PI * 2,
        });
      }
    }
    layerIndices.push(indices);
  });

  // 1. Standard Cubic Neuron Nodes (InstancedMesh) — pure cyan & dark graphite binary shell
  const cubeGeo = new THREE.BoxGeometry(0.56, 0.56, 0.56);
  const cubeMat = new THREE.MeshStandardMaterial({
    map: binaryTexA.map,
    emissive: new THREE.Color(0x00ffff),
    emissiveMap: binaryTexA.emissiveMap,
    emissiveIntensity: 0.92,
    roughness: 0.25,
    metalness: 0.5,
    transparent: true,
    opacity: 0.88,
  });
  const cubeInstanced = new THREE.InstancedMesh(cubeGeo, cubeMat, neurons.length);
  root.add(cubeInstanced);

  // Inner bright cyan core cubelets for standard neurons
  const coreGeo = new THREE.BoxGeometry(0.24, 0.24, 0.24);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xd8ffff,
    transparent: true,
    opacity: 0.92,
  });
  const coreInstanced = new THREE.InstancedMesh(coreGeo, coreMat, neurons.length);
  root.add(coreInstanced);
  disposables.push(cubeGeo, cubeMat, coreGeo, coreMat);

  // 2. Hero Target Neuron Group (the neuron the camera zooms & flies STRAIGHT INSIDE!)
  const heroGroup = new THREE.Group();
  root.add(heroGroup);

  const heroShellGeo = new THREE.BoxGeometry(1.15, 1.15, 1.15);
  const heroShellMat = new THREE.MeshPhysicalMaterial({
    color: 0x0e181d,
    map: binaryTexA.map,
    emissive: new THREE.Color(0x00ffff),
    emissiveMap: binaryTexA.emissiveMap,
    emissiveIntensity: 0.75,
    roughness: 0.14,
    metalness: 0.35,
    clearcoat: 1.0,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const heroShell = new THREE.Mesh(heroShellGeo, heroShellMat);
  heroShell.renderOrder = 6;
  const heroWireGeo = new THREE.EdgesGeometry(heroShellGeo);
  const heroWireMat = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
  });
  const heroWire = new THREE.LineSegments(heroWireGeo, heroWireMat);
  heroGroup.add(heroShell, heroWire);

  // Intricate glowing Pure Cyan Synaptic Micro-Lattice INSIDE the Hero Neuron
  const heroInnerLattice = buildInnerBallStickNetwork('lattice', 1.1, disposables);
  heroGroup.add(heroInnerLattice);

  const heroGlowMat = new THREE.SpriteMaterial({
    map: glowTex,
    color: 0x00ffff,
    transparent: true,
    opacity: 0.78,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const heroGlow = new THREE.Sprite(heroGlowMat);
  heroGlow.scale.set(1.75, 1.75, 1);
  heroGroup.add(heroGlow);
  disposables.push(heroShellGeo, heroShellMat, heroWireGeo, heroWireMat, heroGlowMat);

  // 3. Dense Synaptic Filament Connections between adjacent layers
  const synapses: [number, number][] = [];
  for (let l = 0; l < layerIndices.length - 1; l++) {
    const src = layerIndices[l];
    const dst = layerIndices[l + 1];
    src.forEach((a) => {
      dst.forEach((b) => {
        // Connect bottleneck tightly, fan outer layers densely
        if (src.length <= 3 || dst.length <= 3 || rng() > 0.24) {
          synapses.push([a, b]);
        }
      });
    });
  }

  const synPosArr = new Float32Array(synapses.length * 6);
  const synGeo = new THREE.BufferGeometry();
  const synAttr = new THREE.BufferAttribute(synPosArr, 3);
  synAttr.setUsage(THREE.DynamicDrawUsage);
  synGeo.setAttribute('position', synAttr);
  const synMat = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.44,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const synLines = new THREE.LineSegments(synGeo, synMat);
  root.add(synLines);
  disposables.push(synGeo, synMat);

  // 4. Signal Pulse Spheres firing across synapses continuously
  const pulseCount = Math.min(54, synapses.length);
  const pulseGeo = new THREE.SphereGeometry(0.068, 8, 8);
  const pulseMat = new THREE.MeshBasicMaterial({
    color: 0xd8ffff,
    transparent: true,
    opacity: 0.95,
  });
  const pulses = new THREE.InstancedMesh(pulseGeo, pulseMat, pulseCount);
  const pulseData = Array.from({ length: pulseCount }, (_, idx) => ({
    synIdx: Math.floor((idx / pulseCount) * synapses.length),
    speed: 0.35 + rng() * 0.55,
    offset: rng(),
  }));
  root.add(pulses);
  disposables.push(pulseGeo, pulseMat);

  const dummy = new THREE.Object3D();

  return {
    root,
    update: (
      elapsed: number,
      pointerX: number,
      pointerY: number,
      mixFactor: number,
      enterNeuronFactor: number
    ) => {
      const mix = THREE.MathUtils.clamp(mixFactor, 0, 1);
      const enter = THREE.MathUtils.clamp(enterNeuronFactor, 0, 1);

      // Gentle camera-reactive tilt before entering inside the Hero Neuron
      const tiltScale = 1 - enter * 0.85;
      root.rotation.y = pointerX * 0.18 * tiltScale;
      root.rotation.x = pointerY * 0.1 * tiltScale;

      for (let i = 0; i < neurons.length; i++) {
        const n = neurons[i];
        n.livePos.lerpVectors(n.orderedPos, n.mixedPos, mix);

        if (!n.isHero) {
          // Subtle living pulse & swirl when mixed up
          const swirlAmp = 0.08 + mix * 0.28;
          n.livePos.y += Math.sin(elapsed * 1.3 + n.phase) * swirlAmp;
          n.livePos.z += Math.cos(elapsed * 1.1 + n.phase) * swirlAmp * 0.7;

          // Push peripheral neurons radially outward as we dive inside the Hero Neuron
          if (enter > 0.01) {
            const len = Math.max(0.01, Math.hypot(n.livePos.x, n.livePos.y));
            n.livePos.x += (n.livePos.x / len) * enter * 3.8;
            n.livePos.y += (n.livePos.y / len) * enter * 2.4;
          }

          dummy.position.copy(n.livePos);
          dummy.rotation.set(
            elapsed * 0.25 + n.phase * mix,
            elapsed * 0.4 + n.phase * mix,
            n.phase * 0.3 * mix
          );
          dummy.scale.setScalar(1.0);
          dummy.updateMatrix();
          cubeInstanced.setMatrixAt(i, dummy.matrix);

          dummy.scale.setScalar(0.95 + Math.sin(elapsed * 3 + n.phase) * 0.15);
          dummy.updateMatrix();
          coreInstanced.setMatrixAt(i, dummy.matrix);
        } else {
          // Hide instanced placeholder on Hero index (replaced by full Hero Neuron Assembly)
          dummy.position.copy(n.livePos);
          dummy.scale.setScalar(0.0001);
          dummy.updateMatrix();
          cubeInstanced.setMatrixAt(i, dummy.matrix);
          coreInstanced.setMatrixAt(i, dummy.matrix);
        }
      }
      cubeInstanced.instanceMatrix.needsUpdate = true;
      coreInstanced.instanceMatrix.needsUpdate = true;

      // Update Hero Target Neuron (grows & parts open smoothly as camera enters INSIDE it!)
      if (heroIdx >= 0) {
        const heroPos = neurons[heroIdx].livePos;
        heroGroup.position.copy(heroPos);
        const heroScale = 1.0 + mix * 0.75 + enter * 5.2;
        heroGroup.scale.setScalar(heroScale);
        heroGroup.rotation.y = elapsed * 0.22 * (1 - enter * 0.7) + pointerX * 0.2;
        heroGroup.rotation.x = Math.sin(elapsed * 0.35) * 0.08 + pointerY * 0.15;

        heroInnerLattice.rotation.y = -elapsed * 0.48;
        heroInnerLattice.rotation.x = elapsed * 0.24;
        heroShellMat.opacity = Math.max(0.08, 0.34 - enter * 0.22);
        heroGlowMat.opacity = 0.78 - enter * 0.3;
      }

      // Sync all synaptic filament lines to live neuron positions
      for (let s = 0; s < synapses.length; s++) {
        const [aIdx, bIdx] = synapses[s];
        const a = neurons[aIdx].livePos;
        const b = neurons[bIdx].livePos;
        synPosArr[s * 6] = a.x;
        synPosArr[s * 6 + 1] = a.y;
        synPosArr[s * 6 + 2] = a.z;
        synPosArr[s * 6 + 3] = b.x;
        synPosArr[s * 6 + 4] = b.y;
        synPosArr[s * 6 + 5] = b.z;
      }
      synAttr.needsUpdate = true;
      synMat.opacity = 0.42 + mix * 0.22 - enter * 0.2;

      // Animate signal pulses traveling along synapses
      for (let p = 0; p < pulseCount; p++) {
        const pd = pulseData[p];
        const [aIdx, bIdx] = synapses[pd.synIdx];
        const t = (elapsed * pd.speed + pd.offset) % 1;
        dummy.position.lerpVectors(neurons[aIdx].livePos, neurons[bIdx].livePos, t);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(1.0 + mix * 0.35);
        dummy.updateMatrix();
        pulses.setMatrixAt(p, dummy.matrix);
      }
      pulses.instanceMatrix.needsUpdate = true;
    },
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}

/**
 * CH.03 // THE IRIS: Hexagonal Basalt Column Canyon Rim + 4-Ring Mechanized Gyroscope Portal
 */
export function buildIrisChamber(
  yPos: number,
  zPos: number,
  obsidianTex: THREE.CanvasTexture,
  glowTex: THREE.CanvasTexture
) {
  const root = new THREE.Group();
  root.position.set(0, yPos, zPos);

  const rng = createRng(3303);
  const colCount = 46;
  const colGeo = new THREE.CylinderGeometry(0.58, 0.62, 12.5, 6);
  const colMat = new THREE.MeshStandardMaterial({
    color: 0x16191f,
    map: obsidianTex,
    roughness: 0.62,
    metalness: 0.45,
    flatShading: true,
  });
  const canyonCols = new THREE.InstancedMesh(colGeo, colMat, colCount);
  const dummy = new THREE.Object3D();

  for (let i = 0; i < colCount; i++) {
    const ring = i < 24 ? 0 : 1;
    const angle = (i / (ring === 0 ? 24 : 22)) * Math.PI * 2 + ring * 0.2;
    const rad = ring === 0 ? 5.6 + rng() * 0.7 : 7.2 + rng() * 1.1;
    dummy.position.set(Math.cos(angle) * rad, 1.4 + rng() * 3.0, Math.sin(angle) * rad);
    dummy.rotation.set(0, rng() * Math.PI, 0);
    dummy.scale.set(0.9 + rng() * 0.45, 0.85 + rng() * 0.5, 0.9 + rng() * 0.45);
    dummy.updateMatrix();
    canyonCols.setMatrixAt(i, dummy.matrix);
  }
  canyonCols.instanceMatrix.needsUpdate = true;
  root.add(canyonCols);

  const portalGroup = new THREE.Group();
  portalGroup.rotation.x = Math.PI / 2;
  root.add(portalGroup);

  const ringSolidMat = new THREE.MeshStandardMaterial({
    color: 0x20252e,
    roughness: 0.22,
    metalness: 0.92,
  });
  const ringEdgeMat = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.82,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const ringGeos: THREE.BufferGeometry[] = [];
  const ringContainers: { group: THREE.Group; speed: number }[] = [];

  const ringSpecs = [
    { r: 4.1, tube: 0.22, segs: 6, gap: 0.18, speed: 0.18 },
    { r: 3.15, tube: 0.18, segs: 5, gap: 0.22, speed: -0.28 },
    { r: 2.2, tube: 0.14, segs: 4, gap: 0.28, speed: 0.42 },
    { r: 1.35, tube: 0.1, segs: 3, gap: 0.34, speed: -0.58 },
  ];

  ringSpecs.forEach((spec) => {
    const container = new THREE.Group();
    const arcLen = (Math.PI * 2) / spec.segs - spec.gap;
    for (let s = 0; s < spec.segs; s++) {
      const start = s * ((Math.PI * 2) / spec.segs);
      const tGeo = new THREE.TorusGeometry(spec.r, spec.tube, 8, 24, arcLen);
      const eGeo = new THREE.EdgesGeometry(tGeo, 18);
      ringGeos.push(tGeo, eGeo);

      const segMesh = new THREE.Mesh(tGeo, ringSolidMat);
      segMesh.rotation.z = start;
      segMesh.add(new THREE.LineSegments(eGeo, ringEdgeMat));
      container.add(segMesh);
    }
    portalGroup.add(container);
    ringContainers.push({ group: container, speed: spec.speed });
  });

  const coreSpriteMat = new THREE.SpriteMaterial({
    map: glowTex,
    color: 0x00ffff,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const coreSprite = new THREE.Sprite(coreSpriteMat);
  coreSprite.scale.set(3.2, 3.2, 1);
  portalGroup.add(coreSprite);

  return {
    root,
    update: (elapsed: number, pointerX: number, pointerY: number, flyProgress: number) => {
      ringContainers.forEach((rc, idx) => {
        rc.group.rotation.z = elapsed * rc.speed;
        rc.group.rotation.x = pointerY * 0.15 * (idx % 2 === 0 ? 1 : -1);
        rc.group.rotation.y = pointerX * 0.15;
        const expand = 1 + flyProgress * (0.4 + idx * 0.15);
        rc.group.scale.setScalar(expand);
      });
      const pulse = 3.0 + Math.sin(elapsed * 2.5) * 0.3 + flyProgress * 3.8;
      coreSprite.scale.set(pulse, pulse, 1);
    },
    dispose: () => {
      colGeo.dispose();
      colMat.dispose();
      ringGeos.forEach((g) => g.dispose());
      ringSolidMat.dispose();
      ringEdgeMat.dispose();
      coreSpriteMat.dispose();
    },
  };
}

/**
 * CH.04 // THE PEDESTAL: Precision Machined Circuit Platform + 2,200-Particle & Wireframe Morphing Hologram
 */
export function buildPedestalChamber(
  yPos: number,
  zPos: number,
  circuitTex: THREE.CanvasTexture,
  glowTex: THREE.CanvasTexture
) {
  const root = new THREE.Group();
  root.position.set(0, yPos, zPos);

  const platformGroup = new THREE.Group();
  platformGroup.position.set(0, -1.75, 0);
  root.add(platformGroup);

  const topDiscGeo = new THREE.CylinderGeometry(3.85, 3.95, 0.14, 64);
  const topDiscMat = new THREE.MeshStandardMaterial({
    map: circuitTex,
    roughness: 0.34,
    metalness: 0.78,
  });
  platformGroup.add(new THREE.Mesh(topDiscGeo, topDiscMat));

  const baseGeo = new THREE.CylinderGeometry(4.2, 4.65, 0.36, 48);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x14171d,
    roughness: 0.42,
    metalness: 0.85,
  });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.y = -0.24;
  platformGroup.add(baseMesh);

  const trimCount = 16;
  const trimGeo = new THREE.BoxGeometry(0.55, 0.18, 0.28);
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x1d222b,
    roughness: 0.25,
    metalness: 0.9,
  });
  const trims = new THREE.InstancedMesh(trimGeo, trimMat, trimCount);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < trimCount; i++) {
    const a = (i / trimCount) * Math.PI * 2;
    dummy.position.set(Math.cos(a) * 4.02, 0.04, Math.sin(a) * 4.02);
    dummy.rotation.set(0, -a + Math.PI / 2, 0);
    dummy.updateMatrix();
    trims.setMatrixAt(i, dummy.matrix);
  }
  trims.instanceMatrix.needsUpdate = true;
  platformGroup.add(trims);

  const ringGeos: THREE.BufferGeometry[] = [];
  const cyanRingMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.82,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  [1.45, 2.45, 3.62].forEach((r) => {
    const rg = new THREE.RingGeometry(r - 0.028, r, 64);
    rg.rotateX(-Math.PI / 2);
    ringGeos.push(rg);
    const rm = new THREE.Mesh(rg, cyanRingMat);
    rm.position.y = 0.08;
    platformGroup.add(rm);
  });

  const arcGroup = new THREE.Group();
  arcGroup.position.set(0, 0.35, 0);
  root.add(arcGroup);

  const arcGeo = new THREE.TorusGeometry(2.55, 0.026, 10, 40, Math.PI * 0.55);
  const arcMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.72,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  for (let i = 0; i < 3; i++) {
    const arc = new THREE.Mesh(arcGeo, arcMat);
    arc.rotation.x = Math.PI * 0.42;
    arc.rotation.z = (i * Math.PI * 2) / 3;
    arcGroup.add(arc);
  }

  const topHaloGeo = new THREE.TorusGeometry(2.15, 0.028, 12, 64);
  topHaloGeo.rotateX(Math.PI / 2);
  const topHalo = new THREE.Mesh(topHaloGeo, cyanRingMat);
  topHalo.position.set(0, 2.65, 0);
  root.add(topHalo);

  const graphGroup = new THREE.Group();
  graphGroup.position.set(0, 0.35, 0);
  root.add(graphGroup);

  const icoGeo = new THREE.IcosahedronGeometry(1.55, 1);
  const icoEdgesGeo = new THREE.EdgesGeometry(icoGeo);
  const octGeo = new THREE.OctahedronGeometry(0.95, 0);
  const octEdgesGeo = new THREE.EdgesGeometry(octGeo);
  const graphWireMat = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.52,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  graphGroup.add(
    new THREE.LineSegments(icoEdgesGeo, graphWireMat),
    new THREE.LineSegments(octEdgesGeo, graphWireMat)
  );

  const P_COUNT = 2200;
  const rng = createRng(9924);
  const blockchainArr = new Float32Array(P_COUNT * 3);
  const neuralArr = new Float32Array(P_COUNT * 3);
  const helixArr = new Float32Array(P_COUNT * 3);
  const liveArr = new Float32Array(P_COUNT * 3);

  const icoPos = icoEdgesGeo.attributes.position;
  const edgeSegCount = icoPos.count / 2;
  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  const vLerp = new THREE.Vector3();

  for (let i = 0; i < P_COUNT; i++) {
    const u = i / P_COUNT;
    if (i < P_COUNT * 0.78) {
      const segIdx = i % edgeSegCount;
      vA.fromBufferAttribute(icoPos, segIdx * 2);
      vB.fromBufferAttribute(icoPos, segIdx * 2 + 1);
      vLerp.lerpVectors(vA, vB, rng());
      vLerp.x += (rng() - 0.5) * 0.05;
      vLerp.y += (rng() - 0.5) * 0.05;
      vLerp.z += (rng() - 0.5) * 0.05;
    } else {
      const phi = rng() * Math.PI * 2;
      const cosT = rng() * 2 - 1;
      const sinT = Math.sqrt(Math.max(0, 1 - cosT * cosT));
      const r = 0.45 + rng() * 0.65;
      vLerp.set(r * sinT * Math.cos(phi), r * cosT, r * sinT * Math.sin(phi));
    }
    blockchainArr[i * 3] = vLerp.x;
    blockchainArr[i * 3 + 1] = vLerp.y;
    blockchainArr[i * 3 + 2] = vLerp.z;

    const theta = u * Math.PI * 8;
    const waveR = 0.8 + Math.sin(theta * 0.5) * 0.65 + (rng() - 0.5) * 0.45;
    neuralArr[i * 3] = Math.cos(theta) * waveR;
    neuralArr[i * 3 + 1] = Math.sin(theta * 0.75) * 0.95 + (rng() - 0.5) * 0.4;
    neuralArr[i * 3 + 2] = Math.sin(theta) * waveR;

    const strand = i % 2 === 0 ? 1 : -1;
    const hAngle = u * Math.PI * 7;
    const hRad = 1.05;
    helixArr[i * 3] = Math.cos(hAngle) * hRad * strand + (rng() - 0.5) * 0.14;
    helixArr[i * 3 + 1] = (u - 0.5) * 2.9;
    helixArr[i * 3 + 2] = Math.sin(hAngle) * hRad * strand + (rng() - 0.5) * 0.14;

    liveArr[i * 3] = blockchainArr[i * 3];
    liveArr[i * 3 + 1] = blockchainArr[i * 3 + 1];
    liveArr[i * 3 + 2] = blockchainArr[i * 3 + 2];
  }

  const particleGeo = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(liveArr, 3);
  posAttr.setUsage(THREE.DynamicDrawUsage);
  particleGeo.setAttribute('position', posAttr);

  const particleMat = new THREE.PointsMaterial({
    size: 0.11,
    map: glowTex,
    color: 0x00ffff,
    transparent: true,
    opacity: 0.92,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const particleCloud = new THREE.Points(particleGeo, particleMat);
  particleCloud.position.set(0, 0.35, 0);
  root.add(particleCloud);

  return {
    root,
    update: (
      elapsed: number,
      delta: number,
      mode: PedestalMode,
      pointerX: number,
      pointerY: number
    ) => {
      const targetArr =
        mode === 'blockchain' ? blockchainArr : mode === 'neural' ? neuralArr : helixArr;
      const lerpAlpha = 1 - Math.exp(-5.2 * delta);

      for (let i = 0; i < P_COUNT; i++) {
        const idx = i * 3;
        const tx = targetArr[idx];
        const ty = targetArr[idx + 1] + Math.sin(elapsed * 1.5 + i * 0.04) * 0.025;
        const tz = targetArr[idx + 2];
        liveArr[idx] = THREE.MathUtils.lerp(liveArr[idx], tx, lerpAlpha);
        liveArr[idx + 1] = THREE.MathUtils.lerp(liveArr[idx + 1], ty, lerpAlpha);
        liveArr[idx + 2] = THREE.MathUtils.lerp(liveArr[idx + 2], tz, lerpAlpha);
      }
      posAttr.needsUpdate = true;

      particleCloud.rotation.y = elapsed * 0.24 + pointerX * 0.45;
      particleCloud.rotation.x = pointerY * 0.22;

      graphGroup.rotation.copy(particleCloud.rotation);
      graphWireMat.opacity = THREE.MathUtils.damp(
        graphWireMat.opacity,
        mode === 'blockchain' ? 0.55 : 0.08,
        5,
        delta
      );

      arcGroup.rotation.y = -elapsed * 0.42;
      arcGroup.rotation.z = Math.sin(elapsed * 0.6) * 0.08;
    },
    dispose: () => {
      topDiscGeo.dispose();
      topDiscMat.dispose();
      baseGeo.dispose();
      baseMat.dispose();
      trimGeo.dispose();
      trimMat.dispose();
      ringGeos.forEach((g) => g.dispose());
      cyanRingMat.dispose();
      arcGeo.dispose();
      arcMat.dispose();
      topHaloGeo.dispose();
      icoGeo.dispose();
      icoEdgesGeo.dispose();
      octGeo.dispose();
      octEdgesGeo.dispose();
      graphWireMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    },
  };
}
