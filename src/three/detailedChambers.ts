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
 * Helper: Build a glowing Pure Cyan Ball-and-Stick 3D Network inside a given radius
 */
function buildInnerBallStickNetwork(
  variant: 'lattice' | 'cluster' | 'tetra' | 'octa' | 'prism',
  scale: number,
  disposables: { dispose: () => void }[]
): THREE.Group {
  const group = new THREE.Group();
  const points: THREE.Vector3[] = [];
  const edges: [number, number][] = [];

  if (variant === 'lattice') {
    // 3D Hypercube / Cubic Neural Lattice (for center hero crystal)
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

    // Outer cube + inner cube + cross struts to center
    for (let i = 0; i < 8; i++) {
      for (let j = i + 1; j < 8; j++) {
        const diff = (i ^ j);
        if (diff === 1 || diff === 2 || diff === 4) {
          edges.push([i, j]);
          edges.push([i + 8, j + 8]);
        }
      }
      edges.push([i, i + 8]);
      edges.push([i + 8, 16]);
    }
  } else if (variant === 'cluster') {
    // 13-node spherical molecular neural cluster
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
  } else {
    // Octahedral / Tetrahedral blockchain node graph
    const r = 0.45 * scale;
    points.push(
      new THREE.Vector3(0, r * 1.1, 0),
      new THREE.Vector3(0, -r * 1.1, 0),
      new THREE.Vector3(r, 0, 0),
      new THREE.Vector3(-r, 0, 0),
      new THREE.Vector3(0, 0, r),
      new THREE.Vector3(0, 0, -r),
      new THREE.Vector3(0, 0, 0)
    );
    for (let i = 0; i < 6; i++) {
      edges.push([i, 6]);
      for (let j = i + 1; j < 6; j++) {
        if (points[i].distanceTo(points[j]) < r * 1.65) {
          edges.push([i, j]);
        }
      }
    }
  }

  // Ball nodes (InstancedMesh)
  const sphereGeo = new THREE.SphereGeometry(0.042 * scale, 10, 10);
  const sphereMat = new THREE.MeshBasicMaterial({ color: 0xd8ffff });
  const spheres = new THREE.InstancedMesh(sphereGeo, sphereMat, points.length);
  const dummy = new THREE.Object3D();
  points.forEach((p, idx) => {
    dummy.position.copy(p);
    dummy.scale.setScalar(idx === points.length - 1 ? 1.4 : 1.0);
    dummy.updateMatrix();
    spheres.setMatrixAt(idx, dummy.matrix);
  });
  spheres.instanceMatrix.needsUpdate = true;
  group.add(spheres);

  // Connecting edges (LineSegments in pure #00FFFF)
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
    opacity: 0.92,
    blending: THREE.AdditiveBlending,
  });
  const lines = new THREE.LineSegments(lineGeo, lineMat);
  group.add(lines);

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
    const z = pos.getZ(i); // local Z relative to -24

    // World Z = z - 24
    const worldZ = z - 24;
    // Keep basins recessed under CH.01 (0,0) and CH.02 (0,-36), and carve dramatic Martian mountain ranges around flanks & horizon
    const distSummit = Math.hypot(x * 0.85, worldZ);
    const distDrift = Math.hypot(x * 0.85, worldZ + 36);
    const basinMask =
      THREE.MathUtils.smoothstep(distSummit, 3.8, 16.0) *
      THREE.MathUtils.smoothstep(distDrift, 4.5, 15.0);

    const mountains =
      Math.abs(Math.sin(x * 0.16 + worldZ * 0.09)) * 4.8 +
      Math.abs(Math.cos(x * 0.31 - worldZ * 0.24)) * 2.2 +
      Math.sin(x * 0.72 + worldZ * 0.61) * 0.75 +
      Math.cos(x * 1.3 - worldZ * 1.1) * 0.28;

    // Cratered ridges rising higher along flanks
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
  const mesh = new THREE.Mesh(terrainGeo, terrainMat);
  root.add(mesh);

  // Subtle rim wireframe contours along mountain ridges
  const wireGeo = new THREE.WireframeGeometry(terrainGeo);
  const wireMat = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.06,
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

/**
 * CH.01 // SUMMIT: Stepped Hexagonal Basalt Plinth + Wireframe Cages filled with Fractured Obsidian & Clear Quartz Stones
 * Opens radially during scroll so camera flies DIRECTLY INSIDE through 24 curved glowing Pure Cyan Neural Tendrils!
 */
export function buildSummitChamber(
  obsidianTex: THREE.CanvasTexture,
  glowTex: THREE.CanvasTexture
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
    const segCount = ring === 0 ? 14 : ring === 1 ? 16 : 16;
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

  // 2. Stepped Pyramid of Wireframe Cubes with Fractured Rock & Clear Quartz Stones INSIDE
  const monumentGroup = new THREE.Group();
  monumentGroup.position.set(0, 1.55, 0);
  root.add(monumentGroup);

  const wireBoxGeo = new THREE.BoxGeometry(0.92, 0.92, 0.92);
  const wireEdgeGeo = new THREE.EdgesGeometry(wireBoxGeo);
  const wireEdgeMat = new THREE.LineBasicMaterial({
    color: 0xd8ffff,
    transparent: true,
    opacity: 0.62,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  // Two fractured stone materials: Dark Jagged Obsidian + Frosted Clear Quartz Stone
  const darkRockMat = new THREE.MeshStandardMaterial({
    color: 0x161a20,
    map: obsidianTex,
    roughness: 0.36,
    metalness: 0.68,
    flatShading: true,
  });
  const clearStoneMat = new THREE.MeshPhysicalMaterial({
    color: 0x99b8c2,
    roughness: 0.16,
    metalness: 0.22,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    transparent: true,
    opacity: 0.56,
    flatShading: true,
  });

  // Create 3 distinct fractured crystal/stone shard cluster geometries
  const shardGeos: THREE.BufferGeometry[] = [];
  for (let v = 0; v < 3; v++) {
    const g = new THREE.DodecahedronGeometry(0.36, 0);
    const p = g.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const px = p.getX(k);
      const py = p.getY(k);
      const pz = p.getZ(k);
      const jitter = 0.72 + Math.sin(px * 7.1 + v * 2.1) * 0.28 + Math.cos(pz * 6.3) * 0.2;
      p.setXYZ(k, px * jitter, py * jitter * 1.08, pz * jitter);
    }
    g.computeVertexNormals();
    shardGeos.push(g);
    disposables.push(g);
  }
  disposables.push(wireBoxGeo, wireEdgeGeo, wireEdgeMat, darkRockMat, clearStoneMat);

  interface StoneCell {
    group: THREE.Group;
    basePos: THREE.Vector3;
    openDir: THREE.Vector3;
    rotSeed: THREE.Vector3;
  }

  const cells: StoneCell[] = [];
  const slots: [number, number, number][] = [];

  // 3x3x3 cube grid + top capstone block (matches Screenshot 1 silhouette!)
  for (let ix = -1; ix <= 1; ix++) {
    for (let iy = -1; iy <= 1; iy++) {
      for (let iz = -1; iz <= 1; iz++) {
        if (ix === 0 && iy === 0 && iz === 0) continue; // Hollow heart for blazing cyan singularity
        slots.push([ix, iy, iz]);
      }
    }
  }
  slots.push([0, 2, 0]); // Crown capstone block

  slots.forEach(([ix, iy, iz], idx) => {
    const cellGroup = new THREE.Group();
    const basePos = new THREE.Vector3(ix * 1.02, iy * 1.02, iz * 1.02);
    cellGroup.position.copy(basePos);

    // Crisp outer wireframe cubic cage
    const cage = new THREE.LineSegments(wireEdgeGeo, wireEdgeMat);
    cellGroup.add(cage);

    // Inner fractured stone cluster (2-3 interlocking rock shards inside the cage)
    const isClear = idx === slots.length - 1 || (ix + iy + iz) % 3 === 0;
    const rockMat = isClear ? clearStoneMat : darkRockMat;
    const shardCount = 3;
    for (let s = 0; s < shardCount; s++) {
      const shard = new THREE.Mesh(shardGeos[(idx + s) % shardGeos.length], rockMat);
      shard.position.set(
        (rng() - 0.5) * 0.24,
        (rng() - 0.5) * 0.24,
        (rng() - 0.5) * 0.24
      );
      shard.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
      shard.scale.setScalar(0.65 + rng() * 0.35);
      cellGroup.add(shard);
    }

    // Radial parting direction that opens a wide central tunnel in XY as Z approaches
    const radialXY = new THREE.Vector3(ix === 0 ? (rng() > 0.5 ? 0.55 : -0.55) : ix, iy === 0 ? (rng() > 0.5 ? 0.45 : -0.45) : iy, iz * 0.35).normalize();

    monumentGroup.add(cellGroup);
    cells.push({
      group: cellGroup,
      basePos,
      openDir: radialXY,
      rotSeed: new THREE.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5),
    });
  });

  // 3. Blazing Pure Cyan Singularity + 28 Sinuous Curved Neural Tendrils (Screenshots 4 & 5!)
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
    const dir = new THREE.Vector3(
      Math.cos(phi) * 1.4,
      elevation,
      Math.sin(phi) * 1.4
    ).normalize();

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

  // Tiny floating Pure Cyan energy nodes around the singularity tendrils
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

  // Small orbiting scanner shard on upper-left (seen in Screenshot 1-3)
  const scannerGroup = new THREE.Group();
  const scanMesh = new THREE.Mesh(shardGeos[0], darkRockMat);
  scanMesh.scale.setScalar(0.55);
  scannerGroup.add(scanMesh);
  monumentGroup.add(scannerGroup);

  const _vTmp = new THREE.Vector3();

  return {
    root,
    update: (elapsed: number, pointerX: number, pointerY: number, openFactor: number) => {
      const cursorBoost = Math.min(0.45, Math.hypot(pointerX, pointerY) * 0.35);
      const spread = THREE.MathUtils.clamp(0.06 + cursorBoost * 0.55 + openFactor * 3.9, 0.06, 4.2);

      // Keep monument subtle rotation in idle, straighten cleanly as camera flies inside
      const rotScale = Math.max(0, 1 - openFactor * 1.4);
      monumentGroup.rotation.y = (elapsed * 0.08 + pointerX * 0.25) * rotScale;
      monumentGroup.rotation.x = pointerY * 0.14 * rotScale;

      for (let i = 0; i < cells.length; i++) {
        const c = cells[i];
        _vTmp.copy(c.basePos).addScaledVector(c.openDir, spread);
        _vTmp.y += Math.sin(elapsed * 1.1 + i * 0.35) * 0.03;
        c.group.position.copy(_vTmp);
        c.group.rotation.set(
          c.rotSeed.x * spread * 0.28,
          c.rotSeed.y * spread * 0.28,
          c.rotSeed.z * spread * 0.22
        );
      }

      const singScale = 2.0 + Math.sin(elapsed * 2.6) * 0.25 + openFactor * 3.2;
      singularitySprite.scale.set(singScale, singScale, 1);

      tendrilGroup.rotation.z = elapsed * 0.15;
      tendrilGroup.scale.setScalar(0.55 + openFactor * 0.85);

      for (let i = 0; i < orbCount; i++) {
        const o = orbData[i];
        const s = (0.65 + openFactor * 0.75) * o.scale;
        dummy.position
          .copy(o.pos)
          .multiplyScalar(0.65 + openFactor * 0.75);
        dummy.position.y += Math.sin(elapsed * 1.8 + o.phase) * 0.06;
        dummy.scale.setScalar(s);
        dummy.updateMatrix();
        orbs.setMatrixAt(i, dummy.matrix);
      }
      orbs.instanceMatrix.needsUpdate = true;

      scannerGroup.position.set(
        -3.2 + Math.cos(elapsed * 0.6) * 0.3,
        1.45 + Math.sin(elapsed * 0.9) * 0.2,
        0.5
      );
      scannerGroup.rotation.y = elapsed * 0.9;
    },
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}

/**
 * CH.02 // THE DRIFT: 5 Clear Faceted Quartz-Crystal Stones with Pure Cyan Ball-and-Stick Networks INSIDE Each Stone
 */
export function buildDriftChamber(zPos: number, glowTex: THREE.CanvasTexture) {
  const root = new THREE.Group();
  root.position.set(0, 1.35, zPos);

  const disposables: { dispose: () => void }[] = [];
  const rng = createRng(2026);

  // Create sculpted pointed 6-sided clear quartz prism geometry (matching Screenshot 6!)
  const createClearStoneGeo = (rad: number, height: number, seed: number) => {
    const g = new THREE.CylinderGeometry(rad * 0.88, rad * 0.82, height, 6, 3);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const normY = y / (height * 0.5); // -1..+1
      // Taper both top and bottom ends to sharp crystal points
      const taper = Math.abs(normY) > 0.45 ? 1 - (Math.abs(normY) - 0.45) * 1.72 : 1.0;
      const facetShift = 0.86 + Math.sin(x * 3.2 + seed) * 0.14 + Math.cos(z * 2.9 + seed) * 0.12;
      pos.setXYZ(i, x * Math.max(0.03, taper) * facetShift, y * 1.15, z * Math.max(0.03, taper) * facetShift);
    }
    g.computeVertexNormals();
    return g;
  };

  // Clear reflective glass crystal material (low opacity + clearcoat + crisp specular so inner networks shine clearly!)
  const clearCrystalMat = new THREE.MeshPhysicalMaterial({
    color: 0xd8f8ff,
    roughness: 0.08,
    metalness: 0.12,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    transparent: true,
    opacity: 0.24,
    flatShading: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const rimEdgeMat = new THREE.LineBasicMaterial({
    color: 0xe6ffff,
    transparent: true,
    opacity: 0.52,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  disposables.push(clearCrystalMat, rimEdgeMat);

  const crystalDefs: {
    pos: [number, number, number];
    rad: number;
    height: number;
    seed: number;
    variant: 'lattice' | 'cluster' | 'tetra' | 'octa' | 'prism';
    netScale: number;
    rot: [number, number, number];
  }[] = [
    { pos: [0.0, 0.0, 0.0], rad: 1.45, height: 3.9, seed: 1.1, variant: 'lattice', netScale: 1.42, rot: [0.04, 0.2, 0.03] },
    { pos: [-3.9, -0.55, -1.6], rad: 1.05, height: 2.9, seed: 2.6, variant: 'cluster', netScale: 1.05, rot: [0.1, 0.4, -0.15] },
    { pos: [3.85, -0.75, -1.3], rad: 1.08, height: 2.95, seed: 4.3, variant: 'tetra', netScale: 1.1, rot: [-0.08, -0.35, 0.14] },
    { pos: [-2.7, 1.35, -4.4], rad: 0.82, height: 2.3, seed: 5.9, variant: 'octa', netScale: 0.85, rot: [0.15, 0.25, 0.18] },
    { pos: [2.85, 1.25, -4.2], rad: 0.86, height: 2.4, seed: 7.4, variant: 'cluster', netScale: 0.88, rot: [-0.12, -0.2, -0.16] },
  ];

  const crystals: {
    group: THREE.Group;
    innerNet: THREE.Group;
    basePos: THREE.Vector3;
    baseRot: THREE.Euler;
  }[] = [];

  crystalDefs.forEach((def) => {
    const cGroup = new THREE.Group();
    cGroup.position.set(...def.pos);
    cGroup.rotation.set(...def.rot);

    const geo = createClearStoneGeo(def.rad, def.height, def.seed);
    const edgesGeo = new THREE.EdgesGeometry(geo, 12);
    disposables.push(geo, edgesGeo);

    const shellMesh = new THREE.Mesh(geo, clearCrystalMat);
    shellMesh.renderOrder = 6;
    const edgeWire = new THREE.LineSegments(edgesGeo, rimEdgeMat);
    edgeWire.scale.setScalar(1.004);
    cGroup.add(shellMesh, edgeWire);

    // Pure Cyan Ball-and-Stick Network suspended INSIDE the Clear Crystal Stone
    const innerNet = buildInnerBallStickNetwork(def.variant, def.netScale, disposables);
    cGroup.add(innerNet);

    // Soft pure cyan aura behind the inner network
    const auraMat = new THREE.SpriteMaterial({
      map: glowTex,
      color: 0x00ffff,
      transparent: true,
      opacity: 0.36,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const aura = new THREE.Sprite(auraMat);
    aura.scale.set(def.rad * 1.4, def.rad * 1.4, 1);
    cGroup.add(aura);
    disposables.push(auraMat);

    root.add(cGroup);
    crystals.push({
      group: cGroup,
      innerNet,
      basePos: new THREE.Vector3(...def.pos),
      baseRot: new THREE.Euler(...def.rot),
    });
  });

  // Floating translucent crystal pebbles around the field (like foreground/background stones in Screenshot 6)
  const pebbleGeo = new THREE.DodecahedronGeometry(0.16, 0);
  const pebbleCount = 24;
  const pebbles = new THREE.InstancedMesh(pebbleGeo, clearCrystalMat, pebbleCount);
  const pebbleData = Array.from({ length: pebbleCount }, () => ({
    pos: new THREE.Vector3((rng() - 0.5) * 11, (rng() - 0.5) * 5.2, (rng() - 0.5) * 7),
    scale: 0.6 + rng() * 1.1,
    speed: 0.3 + rng() * 0.5,
  }));
  const dummy = new THREE.Object3D();
  root.add(pebbles);
  disposables.push(pebbleGeo);

  return {
    root,
    update: (elapsed: number, pointerX: number, pointerY: number) => {
      crystals.forEach((c, idx) => {
        c.group.position.y = c.basePos.y + Math.sin(elapsed * 0.8 + idx * 1.2) * 0.14;
        c.group.rotation.y = c.baseRot.y + Math.sin(elapsed * 0.35 + idx) * 0.14 + pointerX * 0.25;
        c.group.rotation.x = c.baseRot.x + pointerY * 0.15;
        c.innerNet.rotation.y = elapsed * (0.32 + idx * 0.05);
        c.innerNet.rotation.x = elapsed * 0.18;
      });

      for (let i = 0; i < pebbleCount; i++) {
        const p = pebbleData[i];
        dummy.position.copy(p.pos);
        dummy.position.y += Math.sin(elapsed * p.speed + i) * 0.22;
        dummy.rotation.set(elapsed * p.speed, elapsed * 0.4 + i, 0);
        dummy.scale.setScalar(p.scale);
        dummy.updateMatrix();
        pebbles.setMatrixAt(i, dummy.matrix);
      }
      pebbles.instanceMatrix.needsUpdate = true;
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
