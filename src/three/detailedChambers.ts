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
 * CH.01 // SUMMIT: Jagged Graphite Mountains + Columnar Basalt Plinth + 27 Exploding Obsidian Lattice Blocks + Inner Pure Cyan Neural Core
 */
export function buildSummitChamber(
  obsidianTex: THREE.CanvasTexture,
  glowTex: THREE.CanvasTexture
) {
  const root = new THREE.Group();
  root.position.set(0, 0, 0);

  // 1. Jagged Dark Graphite Mountain Ridge Terrain
  const terrainGeo = new THREE.PlaneGeometry(54, 42, 64, 52);
  terrainGeo.rotateX(-Math.PI / 2);
  const tPos = terrainGeo.attributes.position;
  for (let i = 0; i < tPos.count; i++) {
    const x = tPos.getX(i);
    const z = tPos.getZ(i);
    const d = Math.hypot(x * 0.78, z);
    const ridge =
      Math.abs(Math.sin(x * 0.28 + z * 0.14)) * 1.9 +
      Math.sin(x * 0.65 - z * 0.42) * 0.65 +
      Math.cos(z * 0.85) * 0.35;
    const basin = THREE.MathUtils.smoothstep(d, 3.2, 13.5);
    tPos.setY(i, ridge * basin - 2.65);
  }
  terrainGeo.computeVertexNormals();

  const terrainMat = new THREE.MeshStandardMaterial({
    color: 0x16191e,
    roughness: 0.9,
    metalness: 0.18,
    flatShading: true,
  });
  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  root.add(terrainMesh);

  const terrainWireGeo = new THREE.WireframeGeometry(terrainGeo);
  const terrainWireMat = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.1,
    depthWrite: false,
  });
  const terrainWire = new THREE.LineSegments(terrainWireGeo, terrainWireMat);
  terrainWire.position.y = 0.02;
  root.add(terrainWire);

  // 2. Columnar Hexagonal Basalt Plinth under the Obsidian Lattice
  const rng = createRng(1001);
  const basaltCount = 38;
  const hexGeo = new THREE.CylinderGeometry(0.46, 0.5, 3.2, 6);
  const hexMat = new THREE.MeshStandardMaterial({
    color: 0x1a1e25,
    map: obsidianTex,
    roughness: 0.55,
    metalness: 0.48,
    flatShading: true,
  });
  const basaltCols = new THREE.InstancedMesh(hexGeo, hexMat, basaltCount);
  const dummy = new THREE.Object3D();

  for (let i = 0; i < basaltCount; i++) {
    const ring = i < 12 ? 0 : i < 26 ? 1 : 2;
    const angle = (i / (ring === 0 ? 12 : ring === 1 ? 14 : 12)) * Math.PI * 2 + ring * 0.3;
    const rad = ring === 0 ? 0.65 + rng() * 0.6 : ring === 1 ? 1.55 + rng() * 0.55 : 2.35 + rng() * 0.65;
    const hScale = ring === 0 ? 1.15 : ring === 1 ? 0.85 + rng() * 0.3 : 0.45 + rng() * 0.35;
    dummy.position.set(
      Math.cos(angle) * rad,
      -2.55 + hScale * 1.15,
      Math.sin(angle) * rad
    );
    dummy.rotation.set(0, rng() * Math.PI, 0);
    dummy.scale.set(0.85 + rng() * 0.35, hScale, 0.85 + rng() * 0.35);
    dummy.updateMatrix();
    basaltCols.setMatrixAt(i, dummy.matrix);
  }
  basaltCols.instanceMatrix.needsUpdate = true;
  root.add(basaltCols);

  // 3. 27 Exploding Architectural Obsidian Blocks + Pure Cyan Wireframe Lattice Cages
  const latticeGroup = new THREE.Group();
  latticeGroup.position.set(0, 1.35, 0);
  root.add(latticeGroup);

  const blockGeo = new THREE.BoxGeometry(0.68, 0.68, 0.68);
  const blockEdgeGeo = new THREE.EdgesGeometry(blockGeo);
  const blockMat = new THREE.MeshStandardMaterial({
    color: 0x181c22,
    map: obsidianTex,
    roughness: 0.24,
    metalness: 0.86,
  });
  const blockEdgeMat = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.72,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  interface BlockItem {
    group: THREE.Group;
    basePos: THREE.Vector3;
    explodeDir: THREE.Vector3;
    rotAxis: THREE.Vector3;
    explodeAmount: number;
  }

  const blocks: BlockItem[] = [];
  for (let ix = -1; ix <= 1; ix++) {
    for (let iy = -1; iy <= 1; iy++) {
      for (let iz = -1; iz <= 1; iz++) {
        // Leave dead-center open for the blazing cyan singularity core
        if (ix === 0 && iy === 0 && iz === 0) continue;

        const g = new THREE.Group();
        const solid = new THREE.Mesh(blockGeo, blockMat);
        const edges = new THREE.LineSegments(blockEdgeGeo, blockEdgeMat);
        edges.scale.setScalar(1.015);
        g.add(solid);
        g.add(edges);

        const basePos = new THREE.Vector3(ix * 0.84, iy * 0.84, iz * 0.84);
        g.position.copy(basePos);
        const explodeDir = basePos
          .clone()
          .add(new THREE.Vector3((rng() - 0.5) * 0.3, (rng() - 0.5) * 0.3, (rng() - 0.5) * 0.3))
          .normalize();

        latticeGroup.add(g);
        blocks.push({
          group: g,
          basePos,
          explodeDir,
          rotAxis: new THREE.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5).normalize(),
          explodeAmount: 0.75 + rng() * 1.15,
        });
      }
    }
  }

  // Outer stepped architectural cyan wireframe scaffolds
  const cageGeo = new THREE.BoxGeometry(2.65, 2.65, 2.65);
  const cageEdgeGeo = new THREE.EdgesGeometry(cageGeo);
  const cageMat = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.32,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const outerCage = new THREE.LineSegments(cageEdgeGeo, cageMat);
  latticeGroup.add(outerCage);

  // 4. Inner Blazing Pure Cyan Neural Core + Synaptic Filaments
  const coreSpriteMat = new THREE.SpriteMaterial({
    map: glowTex,
    color: 0x00ffff,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const coreSprite = new THREE.Sprite(coreSpriteMat);
  coreSprite.scale.set(2.4, 2.4, 1);
  latticeGroup.add(coreSprite);

  const innerNodeCount = 140;
  const innerPos = new Float32Array(innerNodeCount * 3);
  const innerBase: THREE.Vector3[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < innerNodeCount; i++) {
    const t = (i + 0.5) / innerNodeCount;
    const yU = 1 - 2 * t;
    const rXZ = Math.sqrt(Math.max(0, 1 - yU * yU));
    const phi = i * goldenAngle;
    const rad = 0.55 + rng() * 1.15;
    const v = new THREE.Vector3(Math.cos(phi) * rXZ * rad, yU * rad * 0.9, Math.sin(phi) * rXZ * rad);
    innerBase.push(v);
    innerPos[i * 3] = v.x;
    innerPos[i * 3 + 1] = v.y;
    innerPos[i * 3 + 2] = v.z;
  }

  const innerPtsGeo = new THREE.BufferGeometry();
  const innerPosAttr = new THREE.BufferAttribute(innerPos, 3);
  innerPosAttr.setUsage(THREE.DynamicDrawUsage);
  innerPtsGeo.setAttribute('position', innerPosAttr);
  const innerPtsMat = new THREE.PointsMaterial({
    size: 0.24,
    map: glowTex,
    color: 0x00ffff,
    transparent: true,
    opacity: 0.96,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const innerPoints = new THREE.Points(innerPtsGeo, innerPtsMat);
  latticeGroup.add(innerPoints);

  const MAX_SYNAPSES = 900;
  const synPositions = new Float32Array(MAX_SYNAPSES * 6);
  const synGeo = new THREE.BufferGeometry();
  const synPosAttr = new THREE.BufferAttribute(synPositions, 3);
  synPosAttr.setUsage(THREE.DynamicDrawUsage);
  synGeo.setAttribute('position', synPosAttr);
  synGeo.setDrawRange(0, 0);
  const synMat = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const synapses = new THREE.LineSegments(synGeo, synMat);
  latticeGroup.add(synapses);

  // Orbiting subtle reconnaissance node drone (top-left framing element from video)
  const droneGroup = new THREE.Group();
  const droneGeo = new THREE.OctahedronGeometry(0.18, 0);
  const droneEdgeGeo = new THREE.EdgesGeometry(droneGeo);
  const droneSolid = new THREE.Mesh(droneGeo, blockMat);
  const droneEdge = new THREE.LineSegments(droneEdgeGeo, blockEdgeMat);
  droneGroup.add(droneSolid, droneEdge);
  latticeGroup.add(droneGroup);

  const _vTmp = new THREE.Vector3();

  return {
    root,
    update: (elapsed: number, pointerX: number, pointerY: number, scrollFactor: number) => {
      // Explosion intensity reacts to both early scroll dive AND pointer hover energy
      const cursorEnergy = Math.min(1, Math.hypot(pointerX, pointerY) * 0.55);
      const explode = THREE.MathUtils.clamp(0.18 + cursorEnergy * 0.45 + scrollFactor * 3.8, 0.12, 1.55);

      latticeGroup.rotation.y = elapsed * 0.14 + pointerX * 0.32;
      latticeGroup.rotation.x = pointerY * 0.18;

      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        const floatY = Math.sin(elapsed * 1.2 + i * 0.4) * 0.04;
        _vTmp.copy(b.basePos).addScaledVector(b.explodeDir, b.explodeAmount * explode);
        _vTmp.y += floatY;
        b.group.position.copy(_vTmp);
        b.group.rotation.set(
          b.rotAxis.x * explode * 0.65,
          b.rotAxis.y * explode * 0.65,
          b.rotAxis.z * explode * 0.45
        );
      }

      outerCage.scale.setScalar(1 + explode * 0.35);
      outerCage.rotation.y = -elapsed * 0.18;

      const corePulse = 2.1 + Math.sin(elapsed * 2.4) * 0.25 + explode * 0.85;
      coreSprite.scale.set(corePulse, corePulse, 1);

      // Update inner neural filaments + dynamic synapses
      const expandScale = 1 + explode * 0.42;
      for (let i = 0; i < innerNodeCount; i++) {
        const b = innerBase[i];
        innerPos[i * 3] = b.x * expandScale + Math.sin(elapsed * 1.4 + i) * 0.04;
        innerPos[i * 3 + 1] = b.y * expandScale + Math.cos(elapsed * 1.2 + i) * 0.04;
        innerPos[i * 3 + 2] = b.z * expandScale + Math.sin(elapsed * 1.1 + i * 0.7) * 0.04;
      }
      innerPosAttr.needsUpdate = true;

      let segs = 0;
      const threshSq = Math.pow(0.88 + explode * 0.32, 2);
      for (let i = 0; i < innerNodeCount && segs < MAX_SYNAPSES; i++) {
        const ax = innerPos[i * 3];
        const ay = innerPos[i * 3 + 1];
        const az = innerPos[i * 3 + 2];
        for (let j = i + 1; j < innerNodeCount && segs < MAX_SYNAPSES; j++) {
          const dx = ax - innerPos[j * 3];
          const dy = ay - innerPos[j * 3 + 1];
          const dz = az - innerPos[j * 3 + 2];
          if (dx * dx + dy * dy + dz * dz < threshSq) {
            const o = segs * 6;
            synPositions[o] = ax;
            synPositions[o + 1] = ay;
            synPositions[o + 2] = az;
            synPositions[o + 3] = innerPos[j * 3];
            synPositions[o + 4] = innerPos[j * 3 + 1];
            synPositions[o + 5] = innerPos[j * 3 + 2];
            segs++;
          }
        }
      }
      synGeo.setDrawRange(0, segs * 2);
      synPosAttr.needsUpdate = true;

      // Orbiting scanner drone
      droneGroup.position.set(
        Math.cos(elapsed * 0.55) * 3.1,
        1.6 + Math.sin(elapsed * 0.9) * 0.3,
        Math.sin(elapsed * 0.55) * 2.4
      );
      droneGroup.rotation.y = elapsed * 1.2;
    },
    dispose: () => {
      terrainGeo.dispose();
      terrainMat.dispose();
      terrainWireGeo.dispose();
      terrainWireMat.dispose();
      hexGeo.dispose();
      hexMat.dispose();
      blockGeo.dispose();
      blockEdgeGeo.dispose();
      blockMat.dispose();
      blockEdgeMat.dispose();
      cageGeo.dispose();
      cageEdgeGeo.dispose();
      cageMat.dispose();
      coreSpriteMat.dispose();
      innerPtsGeo.dispose();
      innerPtsMat.dispose();
      synGeo.dispose();
      synMat.dispose();
      droneGeo.dispose();
      droneEdgeGeo.dispose();
    },
  };
}

/**
 * CH.02 // THE DRIFT: 5 Faceted Obsidian-Glass Crystals with Suspended Miniature 3D Neural Lattice Inside
 */
export function buildDriftChamber(yPos: number, glowTex: THREE.CanvasTexture) {
  const root = new THREE.Group();
  root.position.set(0, yPos, 0);

  const createFacetedCrystalGeo = (rad: number, heightScale: number, seed: number) => {
    const g = new THREE.IcosahedronGeometry(rad, 1);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const wobble = 0.82 + Math.sin(x * 3.1 + seed) * 0.18 + Math.cos(z * 2.7 + seed) * 0.14;
      pos.setXYZ(i, x * wobble * 0.78, y * heightScale * wobble, z * wobble * 0.78);
    }
    g.computeVertexNormals();
    return g;
  };

  const crystalGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x182028,
    roughness: 0.14,
    metalness: 0.65,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    transparent: true,
    opacity: 0.76,
    flatShading: true,
    depthWrite: false,
  });

  const crystalEdgeMat = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const disposables: { dispose: () => void }[] = [crystalGlassMat, crystalEdgeMat];

  // Hero Central Crystal
  const heroGeo = createFacetedCrystalGeo(1.75, 1.55, 1.2);
  const heroEdgeGeo = new THREE.EdgesGeometry(heroGeo, 8);
  disposables.push(heroGeo, heroEdgeGeo);

  const heroCrystal = new THREE.Group();
  const heroShell = new THREE.Mesh(heroGeo, crystalGlassMat);
  heroShell.renderOrder = 4;
  const heroWire = new THREE.LineSegments(heroEdgeGeo, crystalEdgeMat);
  heroWire.scale.setScalar(1.005);
  heroCrystal.add(heroShell, heroWire);
  root.add(heroCrystal);

  // Miniature 3D Neural-Blockchain Polyhedral Lattice suspended INSIDE the Hero Crystal
  const innerLattice = new THREE.Group();
  const latticeOctGeo = new THREE.IcosahedronGeometry(0.68, 1);
  const latticeBoxGeo = new THREE.BoxGeometry(0.75, 0.75, 0.75);
  const latticeOctEdges = new THREE.EdgesGeometry(latticeOctGeo);
  const latticeBoxEdges = new THREE.EdgesGeometry(latticeBoxGeo);
  const latticeMat = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.92,
    blending: THREE.AdditiveBlending,
  });
  const latticeWire1 = new THREE.LineSegments(latticeOctEdges, latticeMat);
  const latticeWire2 = new THREE.LineSegments(latticeBoxEdges, latticeMat);
  innerLattice.add(latticeWire1, latticeWire2);

  const miniGlowMat = new THREE.SpriteMaterial({
    map: glowTex,
    color: 0x00ffff,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const miniGlow = new THREE.Sprite(miniGlowMat);
  miniGlow.scale.set(1.5, 1.5, 1);
  innerLattice.add(miniGlow);
  root.add(innerLattice);
  disposables.push(latticeOctGeo, latticeBoxGeo, latticeOctEdges, latticeBoxEdges, latticeMat, miniGlowMat);

  // 4 Flanking Satellite Crystals in Depth
  const satConfigs = [
    { pos: [-4.2, 0.6, -2.5], rad: 0.95, h: 1.5, seed: 2.4 },
    { pos: [4.1, 0.4, -2.2], rad: 0.9, h: 1.45, seed: 4.1 },
    { pos: [-2.7, -1.6, -4.6], rad: 0.72, h: 1.4, seed: 5.7 },
    { pos: [2.8, 1.5, -4.4], rad: 0.78, h: 1.5, seed: 7.3 },
  ];

  const satellites: { group: THREE.Group; baseY: number; speed: number }[] = [];
  satConfigs.forEach((cfg, idx) => {
    const g = createFacetedCrystalGeo(cfg.rad, cfg.h, cfg.seed);
    const e = new THREE.EdgesGeometry(g, 10);
    disposables.push(g, e);

    const satGroup = new THREE.Group();
    satGroup.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
    satGroup.add(new THREE.Mesh(g, crystalGlassMat), new THREE.LineSegments(e, crystalEdgeMat));

    // Tiny core lattice inside satellite crystal
    const satInner = new THREE.LineSegments(latticeBoxEdges, latticeMat);
    satInner.scale.setScalar(0.55);
    satGroup.add(satInner);

    root.add(satGroup);
    satellites.push({ group: satGroup, baseY: cfg.pos[1], speed: 0.25 + idx * 0.08 });
  });

  return {
    root,
    update: (elapsed: number, pointerX: number, pointerY: number) => {
      heroCrystal.rotation.y = elapsed * 0.16 + pointerX * 0.35;
      heroCrystal.rotation.x = Math.sin(elapsed * 0.4) * 0.08 + pointerY * 0.22;
      innerLattice.rotation.y = -elapsed * 0.42;
      innerLattice.rotation.x = elapsed * 0.28;

      satellites.forEach((s, idx) => {
        s.group.rotation.y = elapsed * s.speed + idx;
        s.group.position.y = s.baseY + Math.sin(elapsed * 0.85 + idx * 1.4) * 0.22;
      });
    },
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}

/**
 * CH.03 // THE IRIS: Hexagonal Basalt Column Canyon Rim + 4-Ring Mechanized Gyroscope Portal
 */
export function buildIrisChamber(yPos: number, obsidianTex: THREE.CanvasTexture, glowTex: THREE.CanvasTexture) {
  const root = new THREE.Group();
  root.position.set(0, yPos, 0);

  // 1. Hexagonal Basalt Canyon Shaft encircling the Gyroscope Portal
  const rng = createRng(3303);
  const colCount = 44;
  const colGeo = new THREE.CylinderGeometry(0.58, 0.62, 11.5, 6);
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
    const angle = (i / (ring === 0 ? 24 : 20)) * Math.PI * 2 + ring * 0.2;
    const rad = ring === 0 ? 5.6 + rng() * 0.7 : 7.1 + rng() * 1.1;
    dummy.position.set(Math.cos(angle) * rad, 1.2 + rng() * 2.8, Math.sin(angle) * rad);
    dummy.rotation.set(0, rng() * Math.PI, 0);
    dummy.scale.set(0.9 + rng() * 0.45, 0.85 + rng() * 0.5, 0.9 + rng() * 0.45);
    dummy.updateMatrix();
    canyonCols.setMatrixAt(i, dummy.matrix);
  }
  canyonCols.instanceMatrix.needsUpdate = true;
  root.add(canyonCols);

  // 2. Concentric Mechanized Gyroscope Portal Rings (Horizontal plane so vertical scroll plunges straight through)
  const portalGroup = new THREE.Group();
  portalGroup.rotation.x = Math.PI / 2; // Face upward toward incoming diving camera
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

  // Glowing Portal Singularity Halo
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
  circuitTex: THREE.CanvasTexture,
  glowTex: THREE.CanvasTexture
) {
  const root = new THREE.Group();
  root.position.set(0, yPos, 0);

  // 1. Multi-Tiered Machined Graphite & Pure Cyan Pedestal Platform
  const platformGroup = new THREE.Group();
  platformGroup.position.set(0, -1.75, 0);
  root.add(platformGroup);

  // Top dial disc with 1024px circuit texture
  const topDiscGeo = new THREE.CylinderGeometry(3.85, 3.95, 0.14, 64);
  const topDiscMat = new THREE.MeshStandardMaterial({
    map: circuitTex,
    roughness: 0.34,
    metalness: 0.78,
  });
  const topDisc = new THREE.Mesh(topDiscGeo, topDiscMat);
  platformGroup.add(topDisc);

  // Stepped dark armored base apron
  const baseGeo = new THREE.CylinderGeometry(4.2, 4.65, 0.36, 48);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x14171d,
    roughness: 0.42,
    metalness: 0.85,
  });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.y = -0.24;
  platformGroup.add(baseMesh);

  // 16 Radial Beveled Trim Blocks around pedestal rim
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

  // Recessed glowing Pure Cyan energy rings on floor + floating orbital arc
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

  // Sweeping floating energy arcs around hologram
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

  // Overhead ring halo emitter
  const topHaloGeo = new THREE.TorusGeometry(2.15, 0.028, 12, 64);
  topHaloGeo.rotateX(Math.PI / 2);
  const topHalo = new THREE.Mesh(topHaloGeo, cyanRingMat);
  topHalo.position.set(0, 2.65, 0);
  root.add(topHalo);

  // 2. Wireframe Polyhedral Blockchain Graph Cage (visible strongly in 'blockchain' mode)
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
  const graphWire1 = new THREE.LineSegments(icoEdgesGeo, graphWireMat);
  const graphWire2 = new THREE.LineSegments(octEdgesGeo, graphWireMat);
  graphGroup.add(graphWire1, graphWire2);

  // 3. 2,200-Particle Morphing Cyan Hologram (Blockchain Polyhedron <-> Swirling Neural Wave <-> Double Helix)
  const P_COUNT = 2200;
  const rng = createRng(9924);
  const blockchainArr = new Float32Array(P_COUNT * 3);
  const neuralArr = new Float32Array(P_COUNT * 3);
  const helixArr = new Float32Array(P_COUNT * 3);
  const liveArr = new Float32Array(P_COUNT * 3);

  // Sample edges of an icosahedron for crisp Blockchain Graph points
  const icoPos = icoEdgesGeo.attributes.position;
  const edgeSegCount = icoPos.count / 2;
  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  const vLerp = new THREE.Vector3();

  for (let i = 0; i < P_COUNT; i++) {
    const u = i / P_COUNT;

    // Mode 1: Blockchain Polyhedral Graph (points densely trace polyhedron edges + inner core)
    if (i < P_COUNT * 0.78) {
      const segIdx = i % edgeSegCount;
      vA.fromBufferAttribute(icoPos, segIdx * 2);
      vB.fromBufferAttribute(icoPos, segIdx * 2 + 1);
      const tEdge = rng();
      vLerp.lerpVectors(vA, vB, tEdge);
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

    // Mode 2: Swirling Quantum Neural Wave (curling 3D organic ribbon cloud)
    const theta = u * Math.PI * 8;
    const waveR = 0.8 + Math.sin(theta * 0.5) * 0.65 + (rng() - 0.5) * 0.45;
    neuralArr[i * 3] = Math.cos(theta) * waveR;
    neuralArr[i * 3 + 1] = Math.sin(theta * 0.75) * 0.95 + (rng() - 0.5) * 0.4;
    neuralArr[i * 3 + 2] = Math.sin(theta) * waveR;

    // Mode 3: Protocol Double Helix
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
