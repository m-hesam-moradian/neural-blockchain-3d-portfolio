import * as THREE from 'three';
import { createNeuralMetricSpriteTexture } from './proceduralTextures';

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
      THREE.MathUtils.smoothstep(distDrift, 6.5, 19.0);

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
    opacity: 0.05,
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
 * CH.01 // SUMMIT: Stepped Columnar Basalt Plinth + 28 Chained Binary (0 & 1) Blockchain Blocks.
 * Inside center ALSO contains a binary blockchain block (zero tendrils/strings!).
 * On scroll, the blocks slowly explode outward, randomly selecting one Chosen Block that locks center
 * and expands so the camera flies straight INSIDE it into CH.02!
 */
export function buildSummitChamber(
  obsidianTex: THREE.CanvasTexture,
  _glowTex: THREE.CanvasTexture,
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

  // 2. Full 3x3x3 + Capstone Chained Binary Blockchain Cluster (NO strings/tendrils — inside is a block too!)
  const monumentGroup = new THREE.Group();
  monumentGroup.position.set(0, 1.55, 0);
  root.add(monumentGroup);

  const wireBoxGeo = new THREE.BoxGeometry(0.94, 0.94, 0.94);
  const wireEdgeGeo = new THREE.EdgesGeometry(wireBoxGeo);
  const wireEdgeMat = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.68,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const blockGeo = new THREE.BoxGeometry(0.76, 0.76, 0.76);
  const blockMatA = new THREE.MeshStandardMaterial({
    map: binaryTexA.map,
    emissive: new THREE.Color(0x00ffff),
    emissiveMap: binaryTexA.emissiveMap,
    emissiveIntensity: 0.88,
    roughness: 0.25,
    metalness: 0.55,
  });
  const blockMatB = new THREE.MeshStandardMaterial({
    map: binaryTexB.map,
    emissive: new THREE.Color(0x00ffff),
    emissiveMap: binaryTexB.emissiveMap,
    emissiveIntensity: 0.88,
    roughness: 0.25,
    metalness: 0.55,
  });

  // Dedicated transparent/opening material for the randomly Chosen Target Block we fly INSIDE
  const chosenBlockMat = new THREE.MeshStandardMaterial({
    map: binaryTexA.map,
    emissive: new THREE.Color(0x00ffff),
    emissiveMap: binaryTexA.emissiveMap,
    emissiveIntensity: 1.05,
    roughness: 0.18,
    metalness: 0.45,
    transparent: true,
    opacity: 0.94,
    side: THREE.DoubleSide,
  });

  const heroFrameGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.08, 1.08, 1.08));
  const heroFrameMat = new THREE.LineBasicMaterial({
    color: 0xd8ffff,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
  });

  disposables.push(
    wireBoxGeo,
    wireEdgeGeo,
    wireEdgeMat,
    blockGeo,
    blockMatA,
    blockMatB,
    chosenBlockMat,
    heroFrameGeo,
    heroFrameMat
  );

  interface BlockchainCell {
    group: THREE.Group;
    basePos: THREE.Vector3;
    livePos: THREE.Vector3;
    explodeDir: THREE.Vector3;
    rotSeed: THREE.Vector3;
    isChosen: boolean;
  }

  const cells: BlockchainCell[] = [];
  const slots: [number, number, number][] = [];

  for (let ix = -1; ix <= 1; ix++) {
    for (let iy = -1; iy <= 1; iy++) {
      for (let iz = -1; iz <= 1; iz++) {
        // Every slot including center (0,0,0) holds a genuine binary blockchain block!
        slots.push([ix, iy, iz]);
      }
    }
  }
  slots.push([0, 2, 0]); // Crown Capstone Block

  // Randomly select one front/center candidate block to lock onto and enter inside
  const frontCandidates: number[] = [];
  slots.forEach(([ix, iy, iz], idx) => {
    if (iz >= 0 && Math.abs(ix) <= 1 && iy >= 0 && iy <= 1) {
      frontCandidates.push(idx);
    }
  });
  const chosenSlotIdx =
    frontCandidates[Math.floor(Math.random() * frontCandidates.length)] ?? 13;

  slots.forEach(([ix, iy, iz], idx) => {
    const isChosen = idx === chosenSlotIdx;
    const cellGroup = new THREE.Group();
    const basePos = new THREE.Vector3(ix * 1.08, iy * 1.08, iz * 1.08);
    cellGroup.position.copy(basePos);

    cellGroup.add(new THREE.LineSegments(wireEdgeGeo, wireEdgeMat));

    const meshMat = isChosen ? chosenBlockMat : idx % 2 === 0 ? blockMatA : blockMatB;
    const blockMesh = new THREE.Mesh(blockGeo, meshMat);
    cellGroup.add(blockMesh);

    if (isChosen) {
      cellGroup.add(new THREE.LineSegments(heroFrameGeo, heroFrameMat));
    }

    // Outward 3D radial direction for slow explosion
    const dir = new THREE.Vector3(
      ix === 0 ? (rng() - 0.5) * 1.4 : ix,
      iy === 0 ? (rng() - 0.5) * 1.2 : iy,
      iz === 0 ? (rng() - 0.5) * 1.2 : iz
    );
    if (dir.lengthSq() < 0.05) dir.set(0.6, 0.8, -0.4);
    dir.normalize();

    monumentGroup.add(cellGroup);
    cells.push({
      group: cellGroup,
      basePos,
      livePos: basePos.clone(),
      explodeDir: dir,
      rotSeed: new THREE.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5),
      isChosen,
    });
  });

  // Cryptographic Chain Links connecting all 28 blocks (including inside center block!)
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
    opacity: 0.78,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  monumentGroup.add(new THREE.LineSegments(chainGeo, chainMat));
  disposables.push(chainGeo, chainMat);

  // Small chained data-packet nodes pulsing along the links between blocks
  const linkNodeGeo = new THREE.BoxGeometry(0.11, 0.11, 0.11);
  const linkNodeMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
  const linkNodeCount = Math.min(40, chainPairs.length);
  const linkNodes = new THREE.InstancedMesh(linkNodeGeo, linkNodeMat, linkNodeCount);
  monumentGroup.add(linkNodes);
  disposables.push(linkNodeGeo, linkNodeMat);

  // Orbiting satellite binary block on upper-left
  const satBlockGroup = new THREE.Group();
  const satMesh = new THREE.Mesh(blockGeo, blockMatA);
  satMesh.scale.setScalar(0.54);
  const satWire = new THREE.LineSegments(wireEdgeGeo, wireEdgeMat);
  satWire.scale.setScalar(0.54);
  satBlockGroup.add(satMesh, satWire);
  monumentGroup.add(satBlockGroup);

  const _vTarget = new THREE.Vector3();
  const _chosenFocusPos = new THREE.Vector3(0, 0.0, 2.2);

  return {
    root,
    update: (elapsed: number, pointerX: number, pointerY: number, explodeProgress: number) => {
      const exp = THREE.MathUtils.clamp(explodeProgress, 0, 1);
      const cursorBoost = Math.min(0.28, Math.hypot(pointerX, pointerY) * 0.24);
      const slowExplode = Math.pow(exp, 0.85) * 6.4 + cursorBoost;

      // Straighten monument cleanly as camera closes in on the Chosen Block
      const rotScale = Math.max(0, 1 - exp * 1.45);
      monumentGroup.rotation.y = (elapsed * 0.08 + pointerX * 0.24) * rotScale;
      monumentGroup.rotation.x = pointerY * 0.12 * rotScale;

      for (let i = 0; i < cells.length; i++) {
        const c = cells[i];
        if (c.isChosen) {
          // Chosen random block glides forward to dead center & scales up so camera flies INSIDE it!
          c.livePos.lerpVectors(c.basePos, _chosenFocusPos, THREE.MathUtils.smoothstep(exp, 0.05, 0.55));
          c.group.position.copy(c.livePos);
          const scaleUp = 1.0 + THREE.MathUtils.smoothstep(exp, 0.2, 0.95) * 4.8;
          c.group.scale.setScalar(scaleUp);
          c.group.rotation.set(
            (1 - exp) * Math.sin(elapsed * 0.7) * 0.06,
            (1 - exp) * Math.cos(elapsed * 0.6) * 0.08,
            0
          );
        } else {
          // All other blocks slowly explode radially outward
          _vTarget.copy(c.basePos).addScaledVector(c.explodeDir, slowExplode);
          _vTarget.y += Math.sin(elapsed * 1.1 + i * 0.35) * 0.03;
          c.livePos.copy(_vTarget);
          c.group.position.copy(_vTarget);
          c.group.scale.setScalar(1.0);
          c.group.rotation.set(
            c.rotSeed.x * slowExplode * 0.32,
            c.rotSeed.y * slowExplode * 0.32,
            c.rotSeed.z * slowExplode * 0.26
          );
        }
      }

      // Fade Chosen Block membrane smoothly as the camera dives through its front wall
      chosenBlockMat.opacity = Math.max(0.14, 0.94 - THREE.MathUtils.smoothstep(exp, 0.55, 0.92) * 0.78);
      chainMat.opacity = Math.max(0.12, 0.78 - exp * 0.55);

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
        const t = (elapsed * 0.8 + i * 0.13) % 1;
        dummy.position.lerpVectors(cells[aIdx].livePos, cells[bIdx].livePos, t);
        dummy.rotation.set(elapsed, elapsed * 0.7, 0);
        dummy.scale.setScalar(1 - exp * 0.4);
        dummy.updateMatrix();
        linkNodes.setMatrixAt(i, dummy.matrix);
      }
      linkNodes.instanceMatrix.needsUpdate = true;

      satBlockGroup.position.set(
        -3.25 + Math.cos(elapsed * 0.6) * 0.25 - exp * 3.0,
        1.48 + Math.sin(elapsed * 0.9) * 0.18 + exp * 1.4,
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
 * CH.02 // NEURAL CORE (INSIDE THE CHOSEN BLOCK):
 * True Round Neuron Style Neural Network — NO square cubes!
 * Features round spherical glass neurons with glowing nucleus cores & orbital halo rings,
 * crisp visible neural weight / bias / activation numbers (w = +0.94, σ = 0.91, b = -0.14),
 * and full start-to-end glowing energy waves flowing visibly through every neuron layer to the output!
 */
export function buildDriftChamber(zPos: number, glowTex: THREE.CanvasTexture) {
  const root = new THREE.Group();
  root.position.set(0, 1.35, zPos);

  const disposables: { dispose: () => void }[] = [];
  const rng = createRng(2026);

  // Clean cybernetic dark floor grid inside the block space
  const floorGrid = new THREE.GridHelper(34, 24, 0x00ffff, 0x1b232c);
  floorGrid.position.set(0, -4.4, 0);
  const gridMat = floorGrid.material as THREE.Material;
  gridMat.transparent = true;
  gridMat.opacity = 0.2;
  root.add(floorGrid);
  disposables.push(floorGrid);

  interface RoundNeuron {
    orderedPos: THREE.Vector3;
    mixedPos: THREE.Vector3;
    livePos: THREE.Vector3;
    layer: number;
    activation: number;
    bias: number;
    isHero: boolean;
    phase: number;
  }

  const neurons: RoundNeuron[] = [];
  // 5-Layer Deep Neural Funnel: Input (8) -> Hidden 1 (6) -> Bottleneck Core (3) -> Hidden 2 (6) -> Output (8)
  const layerConfigs = [
    { x: -8.2, rows: 4, cols: 2, sz: 2.3, sy: 1.85 },
    { x: -4.1, rows: 3, cols: 2, sz: 1.9, sy: 1.75 },
    { x: 0.0, rows: 3, cols: 1, sz: 1.0, sy: 1.9 },
    { x: 4.1, rows: 3, cols: 2, sz: 1.9, sy: 1.75 },
    { x: 8.2, rows: 4, cols: 2, sz: 2.3, sy: 1.85 },
  ];

  let heroIdx = -1;
  const layerIndices: number[][] = [];

  layerConfigs.forEach((cfg, layerIdx) => {
    const indices: number[] = [];
    for (let r = 0; r < cfg.rows; r++) {
      for (let c = 0; c < cfg.cols; c++) {
        const y = (r - (cfg.rows - 1) / 2) * cfg.sy;
        const z = (c - (cfg.cols - 1) / 2) * cfg.sz;
        const orderedPos = new THREE.Vector3(cfg.x, y, z);

        const isHero = layerIdx === 2 && r === 1 && c === 0;
        if (isHero) heroIdx = neurons.length;

        const mixAngle = rng() * Math.PI * 2;
        const mixRad = isHero ? 0 : 2.8 + rng() * 6.2;
        const mixedPos = isHero
          ? new THREE.Vector3(0, 0, -1.2)
          : new THREE.Vector3(
              Math.cos(mixAngle) * mixRad + (rng() - 0.5) * 2.4,
              (rng() - 0.5) * 5.6,
              Math.sin(mixAngle) * mixRad * 0.7 - 1.2
            );

        indices.push(neurons.length);
        neurons.push({
          orderedPos,
          mixedPos,
          livePos: orderedPos.clone(),
          layer: layerIdx,
          activation: Number((0.62 + rng() * 0.36).toFixed(2)),
          bias: Number(((rng() - 0.45) * 0.35).toFixed(2)),
          isHero,
          phase: rng() * Math.PI * 2,
        });
      }
    }
    layerIndices.push(indices);
  });

  // 1. Round Spherical Neuron Somas + Inner Glowing Nucleus + Equatorial Cyan Halo Rings
  const somaGeo = new THREE.SphereGeometry(0.34, 20, 16);
  const somaMat = new THREE.MeshPhysicalMaterial({
    color: 0x0e1a20,
    emissive: new THREE.Color(0x00ffff),
    emissiveIntensity: 0.28,
    roughness: 0.14,
    metalness: 0.25,
    clearcoat: 1.0,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const somaInstanced = new THREE.InstancedMesh(somaGeo, somaMat, neurons.length);
  root.add(somaInstanced);

  const nucleusGeo = new THREE.SphereGeometry(0.14, 14, 12);
  const nucleusMat = new THREE.MeshBasicMaterial({
    color: 0xd8ffff,
    transparent: true,
    opacity: 0.96,
  });
  const nucleusInstanced = new THREE.InstancedMesh(nucleusGeo, nucleusMat, neurons.length);
  root.add(nucleusInstanced);

  const ringGeo = new THREE.TorusGeometry(0.42, 0.015, 8, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.78,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const ringInstanced = new THREE.InstancedMesh(ringGeo, ringMat, neurons.length);
  root.add(ringInstanced);

  // Soft Pure Cyan halo glow behind every Round Neuron
  const auraPlaneGeo = new THREE.PlaneGeometry(1.4, 1.4);
  const auraPlaneMat = new THREE.MeshBasicMaterial({
    map: glowTex,
    color: 0x00ffff,
    transparent: true,
    opacity: 0.42,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const auraInstanced = new THREE.InstancedMesh(auraPlaneGeo, auraPlaneMat, neurons.length);
  root.add(auraInstanced);

  disposables.push(somaGeo, somaMat, nucleusGeo, nucleusMat, ringGeo, ringMat, auraPlaneGeo, auraPlaneMat);

  // 2. Hero Round Target Neuron Assembly (camera flies STRAIGHT INSIDE this round neuron!)
  const heroGroup = new THREE.Group();
  root.add(heroGroup);

  const heroOuterGeo = new THREE.SphereGeometry(0.68, 28, 22);
  const heroOuterMat = new THREE.MeshPhysicalMaterial({
    color: 0x0e1d24,
    emissive: new THREE.Color(0x00ffff),
    emissiveIntensity: 0.35,
    roughness: 0.1,
    metalness: 0.2,
    clearcoat: 1.0,
    transparent: true,
    opacity: 0.36,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const heroOuterSphere = new THREE.Mesh(heroOuterGeo, heroOuterMat);
  heroOuterSphere.renderOrder = 6;
  heroGroup.add(heroOuterSphere);

  const heroRingAGeo = new THREE.TorusGeometry(0.76, 0.018, 10, 48);
  const heroRingAMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.88,
    blending: THREE.AdditiveBlending,
  });
  const heroRingA = new THREE.Mesh(heroRingAGeo, heroRingAMat);
  const heroRingB = new THREE.Mesh(heroRingAGeo, heroRingAMat);
  heroRingB.rotation.x = Math.PI / 2;
  const heroRingC = new THREE.Mesh(heroRingAGeo, heroRingAMat);
  heroRingC.rotation.y = Math.PI / 2;
  heroGroup.add(heroRingA, heroRingB, heroRingC);

  const heroCoreGeo = new THREE.SphereGeometry(0.22, 18, 14);
  const heroCoreMat = new THREE.MeshBasicMaterial({ color: 0xd8ffff });
  heroGroup.add(new THREE.Mesh(heroCoreGeo, heroCoreMat));

  const heroGlowMat = new THREE.SpriteMaterial({
    map: glowTex,
    color: 0x00ffff,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const heroGlow = new THREE.Sprite(heroGlowMat);
  heroGlow.scale.set(2.2, 2.2, 1);
  heroGroup.add(heroGlow);

  disposables.push(heroOuterGeo, heroOuterMat, heroRingAGeo, heroRingAMat, heroCoreGeo, heroCoreMat, heroGlowMat);

  // 3. Weighted Synaptic Paths connecting adjacent layers
  interface Synapse {
    a: number;
    b: number;
    weight: number;
  }
  const synapses: Synapse[] = [];
  const adjNext: number[][] = Array.from({ length: neurons.length }, () => []);

  for (let l = 0; l < layerIndices.length - 1; l++) {
    const src = layerIndices[l];
    const dst = layerIndices[l + 1];
    src.forEach((a) => {
      dst.forEach((b) => {
        if (src.length <= 3 || dst.length <= 3 || rng() > 0.25) {
          const w = Number(((rng() > 0.22 ? 1 : -1) * (0.35 + rng() * 0.62)).toFixed(2));
          synapses.push({ a, b, weight: w });
          adjNext[a].push(b);
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
    opacity: 0.42,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  root.add(new THREE.LineSegments(synGeo, synMat));
  disposables.push(synGeo, synMat);

  // 4. Visible Neural Weights, Biases, & Activation Number Sprites
  interface MetricSpriteLink {
    sprite: THREE.Sprite;
    a: number;
    b: number; // if b < 0, tracks neuron `a` offset above; otherwise midpoint between neuron a & b
    offsetY: number;
  }
  const metricSprites: MetricSpriteLink[] = [];

  const addSpriteLabel = (
    text: string,
    a: number,
    b: number,
    offsetY: number,
    scaleX: number,
    highlight = false
  ) => {
    const tex = createNeuralMetricSpriteTexture(text, highlight);
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      opacity: 0.94,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(scaleX, scaleX * 0.25, 1);
    root.add(sprite);
    disposables.push(tex, mat);
    metricSprites.push({ sprite, a, b, offsetY });
  };

  // Layer headers & Neuron activation/bias readouts
  addSpriteLabel('INPUT // x[0..7]', layerIndices[0][layerIndices[0].length - 1], -1, 1.05, 2.35, true);
  addSpriteLabel('HIDDEN L1 // ReLU', layerIndices[1][layerIndices[1].length - 1], -1, 1.0, 2.35);
  addSpriteLabel('NEURON_0x0A a=0.96', heroIdx, -1, 1.05, 2.55, true);
  addSpriteLabel('b = +0.14 | σ(Σw·x)', heroIdx, -1, -1.02, 2.45);
  addSpriteLabel('HIDDEN L3 // ATTN', layerIndices[3][layerIndices[3].length - 1], -1, 1.0, 2.35);
  addSpriteLabel('OUTPUT // ŷ = 0.98', layerIndices[4][layerIndices[4].length - 1], -1, 1.05, 2.4, true);

  // Key synaptic weight numbers directly along highlighted filaments
  const sampleSynIndices = [
    2,
    Math.floor(synapses.length * 0.18),
    Math.floor(synapses.length * 0.34),
    Math.floor(synapses.length * 0.5),
    Math.floor(synapses.length * 0.68),
    Math.floor(synapses.length * 0.84),
  ];
  sampleSynIndices.forEach((sIdx, k) => {
    const syn = synapses[sIdx];
    if (!syn) return;
    const sign = syn.weight >= 0 ? '+' : '';
    addSpriteLabel(`w = ${sign}${syn.weight.toFixed(2)}`, syn.a, syn.b, k % 2 === 0 ? 0.16 : -0.16, 1.65, syn.weight > 0.75);
  });

  // 5. End-to-End Glowing Neural Energy Streams (Input -> L1 -> L2 -> L3 -> Output!)
  // Every energy stream follows a complete 5-neuron route all the way from start to end
  const fullRoutes: number[][] = [];
  layerIndices[0].forEach((n0) => {
    for (let copy = 0; copy < 6; copy++) {
      const route = [n0];
      let curr = n0;
      for (let step = 0; step < 4; step++) {
        const nexts = adjNext[curr];
        if (!nexts || nexts.length === 0) break;
        curr = nexts[Math.floor(rng() * nexts.length)];
        route.push(curr);
      }
      if (route.length === 5) fullRoutes.push(route);
    }
  });

  const energyCount = Math.max(1, fullRoutes.length);
  const energyHeadGeo = new THREE.SphereGeometry(0.11, 10, 10);
  const energyHeadMat = new THREE.MeshBasicMaterial({
    color: 0xd8ffff,
    transparent: true,
    opacity: 0.98,
  });
  const energyHeads = new THREE.InstancedMesh(energyHeadGeo, energyHeadMat, energyCount);
  root.add(energyHeads);

  const energyAuraGeo = new THREE.PlaneGeometry(0.75, 0.75);
  const energyAuraMat = new THREE.MeshBasicMaterial({
    map: glowTex,
    color: 0x00ffff,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const energyAuras = new THREE.InstancedMesh(energyAuraGeo, energyAuraMat, energyCount);
  root.add(energyAuras);

  const energyMeta = fullRoutes.map((route) => ({
    route,
    speed: 0.22 + rng() * 0.18,
    offset: rng(),
  }));

  disposables.push(energyHeadGeo, energyHeadMat, energyAuraGeo, energyAuraMat);

  const dummy = new THREE.Object3D();
  const _ePos = new THREE.Vector3();

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

      const tiltScale = 1 - enter * 0.88;
      root.rotation.y = pointerX * 0.18 * tiltScale;
      root.rotation.x = pointerY * 0.1 * tiltScale;

      for (let i = 0; i < neurons.length; i++) {
        const n = neurons[i];
        n.livePos.lerpVectors(n.orderedPos, n.mixedPos, mix);

        if (!n.isHero) {
          const swirlAmp = 0.06 + mix * 0.26;
          n.livePos.y += Math.sin(elapsed * 1.4 + n.phase) * swirlAmp;
          n.livePos.z += Math.cos(elapsed * 1.1 + n.phase) * swirlAmp * 0.65;

          if (enter > 0.01) {
            const len = Math.max(0.01, Math.hypot(n.livePos.x, n.livePos.y));
            n.livePos.x += (n.livePos.x / len) * enter * 4.2;
            n.livePos.y += (n.livePos.y / len) * enter * 2.8;
          }

          const pulse = 1.0 + Math.sin(elapsed * 2.8 + n.phase) * 0.12;
          dummy.position.copy(n.livePos);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.setScalar(1.0);
          dummy.updateMatrix();
          somaInstanced.setMatrixAt(i, dummy.matrix);

          dummy.scale.setScalar(pulse);
          dummy.updateMatrix();
          nucleusInstanced.setMatrixAt(i, dummy.matrix);

          dummy.rotation.set(elapsed * 0.7 + n.phase, elapsed * 0.5, n.phase);
          dummy.scale.setScalar(1.0);
          dummy.updateMatrix();
          ringInstanced.setMatrixAt(i, dummy.matrix);

          dummy.rotation.set(0, 0, 0);
          dummy.scale.setScalar(pulse);
          dummy.updateMatrix();
          auraInstanced.setMatrixAt(i, dummy.matrix);
        } else {
          dummy.position.copy(n.livePos);
          dummy.scale.setScalar(0.0001);
          dummy.updateMatrix();
          somaInstanced.setMatrixAt(i, dummy.matrix);
          nucleusInstanced.setMatrixAt(i, dummy.matrix);
          ringInstanced.setMatrixAt(i, dummy.matrix);
          auraInstanced.setMatrixAt(i, dummy.matrix);
        }
      }
      somaInstanced.instanceMatrix.needsUpdate = true;
      nucleusInstanced.instanceMatrix.needsUpdate = true;
      ringInstanced.instanceMatrix.needsUpdate = true;
      auraInstanced.instanceMatrix.needsUpdate = true;

      // Update Hero Round Neuron Assembly
      if (heroIdx >= 0) {
        heroGroup.position.copy(neurons[heroIdx].livePos);
        const heroScale = 1.0 + mix * 0.75 + enter * 5.8;
        heroGroup.scale.setScalar(heroScale);
        heroGroup.rotation.y = elapsed * 0.25 * (1 - enter * 0.7) + pointerX * 0.2;

        heroRingA.rotation.z = elapsed * 0.65;
        heroRingB.rotation.y = -elapsed * 0.5;
        heroRingC.rotation.x = elapsed * 0.42;
        heroOuterMat.opacity = Math.max(0.08, 0.36 - enter * 0.24);
        heroGlowMat.opacity = 0.85 - enter * 0.35;
      }

      // Sync synaptic connections
      for (let s = 0; s < synapses.length; s++) {
        const syn = synapses[s];
        const a = neurons[syn.a].livePos;
        const b = neurons[syn.b].livePos;
        synPosArr[s * 6] = a.x;
        synPosArr[s * 6 + 1] = a.y;
        synPosArr[s * 6 + 2] = a.z;
        synPosArr[s * 6 + 3] = b.x;
        synPosArr[s * 6 + 4] = b.y;
        synPosArr[s * 6 + 5] = b.z;
      }
      synAttr.needsUpdate = true;
      synMat.opacity = 0.4 + mix * 0.18 - enter * 0.18;

      // Update floating weight & activation number sprites
      for (let m = 0; m < metricSprites.length; m++) {
        const item = metricSprites[m];
        const pA = neurons[item.a].livePos;
        if (item.b < 0) {
          item.sprite.position.set(pA.x, pA.y + item.offsetY, pA.z + 0.1);
        } else {
          const pB = neurons[item.b].livePos;
          item.sprite.position.set(
            (pA.x + pB.x) * 0.5,
            (pA.y + pB.y) * 0.5 + item.offsetY,
            (pA.z + pB.z) * 0.5 + 0.15
          );
        }
        (item.sprite.material as THREE.SpriteMaterial).opacity = Math.max(0, 0.94 - enter * 1.4);
      }

      // Animate continuous end-to-end energy waves from Layer 0 -> Layer 4
      for (let e = 0; e < energyMeta.length; e++) {
        const em = energyMeta[e];
        const totalU = ((elapsed * em.speed + em.offset) % 1) * 4.0; // 4 hops across 5 layers
        const hopIdx = Math.min(3, Math.floor(totalU));
        const hopT = totalU - hopIdx;
        const nA = neurons[em.route[hopIdx]].livePos;
        const nB = neurons[em.route[hopIdx + 1]].livePos;
        _ePos.lerpVectors(nA, nB, hopT);

        dummy.position.copy(_ePos);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(1.0 + Math.sin(hopT * Math.PI) * 0.35);
        dummy.updateMatrix();
        energyHeads.setMatrixAt(e, dummy.matrix);
        energyAuras.setMatrixAt(e, dummy.matrix);
      }
      energyHeads.instanceMatrix.needsUpdate = true;
      energyAuras.instanceMatrix.needsUpdate = true;
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
