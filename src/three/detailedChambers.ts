import * as THREE from 'three';
import { ResumeKeySkill } from '../data/resume';
import {
  createNeuralMetricSpriteTexture,
  createSkillPlanetLabelTexture,
} from './proceduralTextures';

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

    // Carve a wide, clear canyon valley corridor along |x| < 12 between CH.01 (z=0) and CH.02 (z=-20..-32)
    // so mountains flank left/right/far-horizon dramatically without ever blocking the flight path or neural net!
    const distSummit = Math.hypot(x * 0.85, worldZ);
    const corridorClear = THREE.MathUtils.smoothstep(Math.abs(x), 11.5, 22.0);
    const farHorizon = THREE.MathUtils.smoothstep(-worldZ, 34.0, 48.0);
    const valleyMask = Math.min(1.0, corridorClear + farHorizon * 0.85);
    const basinMask = THREE.MathUtils.smoothstep(distSummit, 4.2, 15.0) * valleyMask;

    const mountains =
      Math.abs(Math.sin(x * 0.16 + worldZ * 0.09)) * 4.8 +
      Math.abs(Math.cos(x * 0.31 - worldZ * 0.24)) * 2.2 +
      Math.sin(x * 0.72 + worldZ * 0.61) * 0.75 +
      Math.cos(x * 1.3 - worldZ * 1.1) * 0.28;

    const flankLift = Math.pow(Math.min(1, Math.abs(x) / 38), 1.4) * 5.2;
    pos.setY(i, (mountains + flankLift) * basinMask - 0.55);
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
      ring === 0 ? 0.95 + rng() * 0.65 : ring === 1 ? 1.85 + rng() * 0.7 : 2.85 + rng() * 0.85;
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

  // Dedicated interior/exterior materials for the randomly Chosen Target Block (NEVER scales huge!)
  const chosenOuterMat = new THREE.MeshStandardMaterial({
    map: binaryTexA.map,
    emissive: new THREE.Color(0x00ffff),
    emissiveMap: binaryTexA.emissiveMap,
    emissiveIntensity: 0.78,
    roughness: 0.24,
    metalness: 0.52,
    side: THREE.FrontSide,
  });

  // Interior walls inside the Chosen Block: sleek DARK obsidian with subtle dim 0/1 grid (zero white glare!)
  const chosenInnerMat = new THREE.MeshStandardMaterial({
    color: 0x161f26,
    map: binaryTexA.map,
    emissive: new THREE.Color(0x00ffff),
    emissiveMap: binaryTexA.emissiveMap,
    emissiveIntensity: 0.065,
    roughness: 0.9,
    metalness: 0.05,
    envMapIntensity: 0.06,
    side: THREE.FrontSide,
  });

  // Dedicated front (+Z) 0/1 wall that gradually lowers opacity during scroll instead of snapping away
  const frontDoorMat = new THREE.MeshStandardMaterial({
    map: binaryTexA.map,
    emissive: new THREE.Color(0x00ffff),
    emissiveMap: binaryTexA.emissiveMap,
    emissiveIntensity: 0.78,
    roughness: 0.24,
    metalness: 0.52,
    side: THREE.FrontSide,
    transparent: true,
    opacity: 1.0,
    depthWrite: true,
  });

  const outerFaceGeo = new THREE.PlaneGeometry(0.82, 0.82);
  const innerFaceGeo = new THREE.PlaneGeometry(0.812, 0.812);

  const chosenAnchor = new THREE.Group();
  chosenAnchor.scale.setScalar(0.026);
  let frontDoorMesh: THREE.Mesh | null = null;

  const chosenWireMat = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.68,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const heroFrameGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.06, 1.06, 1.06));
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
    chosenWireMat,
    blockGeo,
    blockMatA,
    blockMatB,
    chosenOuterMat,
    chosenInnerMat,
    frontDoorMat,
    outerFaceGeo,
    innerFaceGeo,
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

    if (isChosen) {
      cellGroup.add(new THREE.LineSegments(wireEdgeGeo, chosenWireMat));
      cellGroup.add(new THREE.LineSegments(heroFrameGeo, heroFrameMat));

      const half = 0.41;
      const inHalf = 0.406;
      // 5 Outer + 5 Inward-facing 0/1 walls (Back, Left, Right, Top, Bottom)
      const faceTransforms: [number, number, number, number, number, number][] = [
        [0, 0, -half, 0, Math.PI, 0], // Back outer
        [-half, 0, 0, 0, -Math.PI / 2, 0], // Left outer
        [half, 0, 0, 0, Math.PI / 2, 0], // Right outer
        [0, half, 0, -Math.PI / 2, 0, 0], // Top outer
        [0, -half, 0, Math.PI / 2, 0, 0], // Bottom outer
      ];
      faceTransforms.forEach(([px, py, pz, rx, ry, rz]) => {
        const outWall = new THREE.Mesh(outerFaceGeo, chosenOuterMat);
        outWall.position.set(px, py, pz);
        outWall.rotation.set(rx, ry, rz);
        cellGroup.add(outWall);
      });

      const innerTransforms: [number, number, number, number, number, number][] = [
        [0, 0, -inHalf, 0, 0, 0], // Back inner faces +Z toward camera
        [-inHalf, 0, 0, 0, Math.PI / 2, 0], // Left inner faces +X
        [inHalf, 0, 0, 0, -Math.PI / 2, 0], // Right inner faces -X
        [0, inHalf, 0, Math.PI / 2, 0, 0], // Top inner faces -Y
        [0, -inHalf, 0, -Math.PI / 2, 0, 0], // Bottom inner faces +Y
      ];
      innerTransforms.forEach(([px, py, pz, rx, ry, rz]) => {
        const inWall = new THREE.Mesh(innerFaceGeo, chosenInnerMat);
        inWall.position.set(px, py, pz);
        inWall.rotation.set(rx, ry, rz);
        cellGroup.add(inWall);
      });

      // Front (+Z) 0/1 opening wall that gradually fades opacity as camera shrinks inside
      frontDoorMesh = new THREE.Mesh(outerFaceGeo, frontDoorMat);
      frontDoorMesh.position.set(0, 0, half);
      frontDoorMesh.renderOrder = 10;
      cellGroup.add(frontDoorMesh);

      // Mount anchor inside the Chosen Block where the Neural Network physically lives!
      cellGroup.add(chosenAnchor);
    } else {
      cellGroup.add(new THREE.LineSegments(wireEdgeGeo, wireEdgeMat));
      const meshMat = idx % 2 === 0 ? blockMatA : blockMatB;
      const blockMesh = new THREE.Mesh(blockGeo, meshMat);
      cellGroup.add(blockMesh);
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

  // 3D Interlocking Wireframe Cyan Chain Links (zero thin strings!) connecting adjacent blocks
  const chainPairs: [number, number][] = [];
  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      const d = cells[i].basePos.distanceTo(cells[j].basePos);
      if (d > 0.5 && d < 1.25) {
        chainPairs.push([i, j]);
      }
    }
  }

  // Build stadium/oval link curve along X axis (matching reference wireframe chain)
  const linkPts: THREE.Vector3[] = [];
  const halfStraight = 0.075;
  const arcRadius = 0.052;
  const arcSegs = 8;
  for (let s = 0; s <= arcSegs; s++) {
    const a = Math.PI / 2 - (s / arcSegs) * Math.PI;
    linkPts.push(new THREE.Vector3(halfStraight + Math.cos(a) * arcRadius, Math.sin(a) * arcRadius, 0));
  }
  for (let s = 0; s <= arcSegs; s++) {
    const a = -Math.PI / 2 - (s / arcSegs) * Math.PI;
    linkPts.push(new THREE.Vector3(-halfStraight + Math.cos(a) * arcRadius, Math.sin(a) * arcRadius, 0));
  }
  const linkCurve = new THREE.CatmullRomCurve3(linkPts, true, 'centripetal', 0.2);
  const chainLinkGeo = new THREE.TubeGeometry(linkCurve, 28, 0.02, 8, true);

  const chainCoreMat = new THREE.MeshStandardMaterial({
    color: 0x091318,
    roughness: 0.42,
    metalness: 0.78,
    transparent: true,
    opacity: 0.86,
  });
  const chainWireMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    wireframe: true,
    transparent: true,
    opacity: 0.62,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const linksPerBond = 3; // Alternating 0° / 90° interlocking links per pair
  const totalChainLinks = chainPairs.length * linksPerBond;
  const chainCoreInstanced = new THREE.InstancedMesh(chainLinkGeo, chainCoreMat, totalChainLinks);
  const chainWireInstanced = new THREE.InstancedMesh(chainLinkGeo, chainWireMat, totalChainLinks);
  chainCoreInstanced.frustumCulled = false;
  chainWireInstanced.frustumCulled = false;
  monumentGroup.add(chainCoreInstanced, chainWireInstanced);
  disposables.push(chainLinkGeo, chainCoreMat, chainWireMat);

  // Orbiting satellite binary block on upper-left (gentle slow rotation)
  const satBlockGroup = new THREE.Group();
  const satMesh = new THREE.Mesh(blockGeo, blockMatA);
  satMesh.scale.setScalar(0.54);
  const satWire = new THREE.LineSegments(wireEdgeGeo, wireEdgeMat);
  satWire.scale.setScalar(0.54);
  satBlockGroup.add(satMesh, satWire);
  monumentGroup.add(satBlockGroup);

  const _vTarget = new THREE.Vector3();
  const _bondDir = new THREE.Vector3();
  const _bondMid = new THREE.Vector3();
  const _axisX = new THREE.Vector3(1, 0, 0);
  const _quatAlign = new THREE.Quaternion();
  const _quatTwist = new THREE.Quaternion();
  // Chosen Block glides gently to monument center (0, 0, 0) local = (0, 1.55, 0) world, KEEPING real 1.0x size!
  const _chosenCenter = new THREE.Vector3(0, 0, 0);

  return {
    root,
    chosenAnchor,
    update: (
      elapsed: number,
      pointerX: number,
      pointerY: number,
      explodeProgress: number,
      frontWallFade = 0
    ) => {
      const exp = THREE.MathUtils.clamp(explodeProgress, 0, 1);
      const doorFade = THREE.MathUtils.clamp(frontWallFade, 0, 1);
      const cursorBoost = Math.min(0.24, Math.hypot(pointerX, pointerY) * 0.18);
      const slowExplode = Math.pow(exp, 0.85) * 7.2 + cursorBoost;

      // Calm, slow architectural drift instead of fast spinning
      const rotScale = Math.max(0, 1 - exp * 1.65);
      monumentGroup.rotation.y = (elapsed * 0.022 + pointerX * 0.18) * rotScale;
      monumentGroup.rotation.x = pointerY * 0.08 * rotScale;

      for (let i = 0; i < cells.length; i++) {
        const c = cells[i];
        if (c.isChosen) {
          c.livePos.lerpVectors(c.basePos, _chosenCenter, THREE.MathUtils.smoothstep(exp, 0.04, 0.45));
          c.group.position.copy(c.livePos);
          c.group.scale.setScalar(1.0);
          c.group.rotation.set(
            (1 - exp) * Math.sin(elapsed * 0.35) * 0.03,
            (1 - exp) * Math.cos(elapsed * 0.3) * 0.035,
            0
          );
        } else {
          _vTarget.copy(c.basePos).addScaledVector(c.explodeDir, slowExplode);
          _vTarget.y += Math.sin(elapsed * 0.7 + i * 0.35) * 0.025;
          c.livePos.copy(_vTarget);
          c.group.position.copy(_vTarget);
          c.group.scale.setScalar(1.0);
          c.group.rotation.set(
            c.rotSeed.x * slowExplode * 0.14,
            c.rotSeed.y * slowExplode * 0.14,
            c.rotSeed.z * slowExplode * 0.12
          );
        }
      }

      // Gradually lower front 0/1 wall opacity as user scrolls so neural net emerges cleanly between 0 & 1
      if (frontDoorMesh) {
        const op = Math.max(0, 1 - doorFade);
        frontDoorMat.opacity = op;
        frontDoorMat.depthWrite = doorFade < 0.02;
        frontDoorMat.emissiveIntensity = 0.78 * (1 - doorFade * 0.62);
        frontDoorMesh.visible = op > 0.01;
      }
      chosenWireMat.opacity = 0.68 * (1 - doorFade * 0.75);
      heroFrameMat.opacity = 0.95 * (1 - doorFade * 0.78);

      // Update interlocking 3D chains between adjacent blocks, fading gracefully during block explosion
      const chainFade = Math.max(0, 1 - exp * 1.45);
      chainWireMat.opacity = 0.62 * chainFade;
      chainCoreMat.opacity = 0.86 * chainFade;
      chainCoreInstanced.visible = chainFade > 0.02;
      chainWireInstanced.visible = chainFade > 0.02;

      if (chainFade > 0.02) {
        let linkIdx = 0;
        for (let p = 0; p < chainPairs.length; p++) {
          const [aIdx, bIdx] = chainPairs[p];
          const a = cells[aIdx].livePos;
          const b = cells[bIdx].livePos;
          _bondDir.subVectors(b, a);
          const dist = Math.max(0.001, _bondDir.length());
          _bondDir.divideScalar(dist);
          _bondMid.addVectors(a, b).multiplyScalar(0.5);
          _quatAlign.setFromUnitVectors(_axisX, _bondDir);

          const spacing = 0.155 + exp * 0.12;
          for (let k = 0; k < linksPerBond; k++) {
            const offset = (k - 1) * spacing;
            dummy.position.copy(_bondMid).addScaledVector(_bondDir, offset);
            _quatTwist.setFromAxisAngle(_axisX, (k % 2) * (Math.PI / 2));
            dummy.quaternion.copy(_quatAlign).multiply(_quatTwist);
            dummy.scale.set(1.0, 1.0, 1.0);
            dummy.updateMatrix();
            chainCoreInstanced.setMatrixAt(linkIdx, dummy.matrix);
            chainWireInstanced.setMatrixAt(linkIdx, dummy.matrix);
            linkIdx++;
          }
        }
        chainCoreInstanced.instanceMatrix.needsUpdate = true;
        chainWireInstanced.instanceMatrix.needsUpdate = true;
      }

      satBlockGroup.position.set(
        -3.25 + Math.cos(elapsed * 0.35) * 0.22 - exp * 3.0,
        1.48 + Math.sin(elapsed * 0.5) * 0.14 + exp * 1.4,
        0.55
      );
      satBlockGroup.rotation.y = elapsed * 0.14;
      satBlockGroup.rotation.x = Math.sin(elapsed * 0.25) * 0.15;
    },
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}

/**
 * CH.02 // NEURAL CORE (NESTED PHYSICALLY INSIDE THE CHOSEN 0/1 BLOCK!):
 * Mounted inside summitChamber.chosenAnchor at micro-scale 0.036 so the camera literally
 * shrinks INSIDE the real 0.82-unit Chosen Block to view the Round-Neuron Network inside it!
 */
export function buildDriftChamber(glowTex: THREE.CanvasTexture) {
  const root = new THREE.Group();
  root.position.set(0, 0, 0);

  const disposables: { dispose: () => void }[] = [];
  const rng = createRng(2026);

  // Compact cybernetic reference floor grid fitted cleanly inside the Chosen Block
  const floorGrid = new THREE.GridHelper(18, 16, 0x00ffff, 0x1b232c);
  floorGrid.position.set(0, -5.8, 0);
  const gridMat = floorGrid.material as THREE.Material;
  gridMat.transparent = true;
  gridMat.opacity = 0.25;
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
        const mixRad = isHero ? 0 : 2.2 + rng() * 4.8;
        const mixedPos = isHero
          ? new THREE.Vector3(0, 0, -1.2)
          : new THREE.Vector3(
              Math.cos(mixAngle) * mixRad + (rng() - 0.5) * 1.6,
              (rng() - 0.5) * 4.8,
              Math.sin(mixAngle) * mixRad * 0.65 - 1.0
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

  // 1. Round Spherical Neuron Somas + Inner Nucleus + Delicate Halo Rings (crisp, non-blinding)
  const somaGeo = new THREE.SphereGeometry(0.36, 20, 16);
  const somaMat = new THREE.MeshStandardMaterial({
    color: 0x071920,
    emissive: new THREE.Color(0x00ffff),
    emissiveIntensity: 0.22,
    roughness: 0.28,
    metalness: 0.35,
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
  });
  const somaInstanced = new THREE.InstancedMesh(somaGeo, somaMat, neurons.length);
  somaInstanced.frustumCulled = false;
  root.add(somaInstanced);

  const nucleusGeo = new THREE.SphereGeometry(0.095, 14, 12);
  const nucleusMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.9,
  });
  const nucleusInstanced = new THREE.InstancedMesh(nucleusGeo, nucleusMat, neurons.length);
  nucleusInstanced.frustumCulled = false;
  root.add(nucleusInstanced);

  const ringGeo = new THREE.TorusGeometry(0.44, 0.013, 8, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const ringInstanced = new THREE.InstancedMesh(ringGeo, ringMat, neurons.length);
  ringInstanced.frustumCulled = false;
  root.add(ringInstanced);

  // Subtle Soft Pure Cyan aura behind every Round Neuron (kept low so neurons stay sharp)
  const auraPlaneGeo = new THREE.PlaneGeometry(1.05, 1.05);
  const auraPlaneMat = new THREE.MeshBasicMaterial({
    map: glowTex,
    color: 0x00ffff,
    transparent: true,
    opacity: 0.16,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const auraInstanced = new THREE.InstancedMesh(auraPlaneGeo, auraPlaneMat, neurons.length);
  auraInstanced.frustumCulled = false;
  root.add(auraInstanced);

  disposables.push(somaGeo, somaMat, nucleusGeo, nucleusMat, ringGeo, ringMat, auraPlaneGeo, auraPlaneMat);

  // 2. Hero Round Target Neuron Assembly (camera flies STRAIGHT INSIDE this round neuron!)
  const heroGroup = new THREE.Group();
  root.add(heroGroup);

  const heroOuterGeo = new THREE.SphereGeometry(0.68, 28, 22);
  const heroOuterMat = new THREE.MeshPhysicalMaterial({
    color: 0x071a22,
    emissive: new THREE.Color(0x00ffff),
    emissiveIntensity: 0.18,
    roughness: 0.14,
    metalness: 0.25,
    clearcoat: 1.0,
    transparent: true,
    opacity: 0.26,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const heroOuterSphere = new THREE.Mesh(heroOuterGeo, heroOuterMat);
  heroOuterSphere.renderOrder = 6;
  heroGroup.add(heroOuterSphere);

  const heroRingAGeo = new THREE.TorusGeometry(0.76, 0.012, 10, 48);
  const heroRingAMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.62,
    blending: THREE.AdditiveBlending,
  });
  const heroRingA = new THREE.Mesh(heroRingAGeo, heroRingAMat);
  const heroRingB = new THREE.Mesh(heroRingAGeo, heroRingAMat);
  heroRingB.rotation.x = Math.PI / 2;
  const heroRingC = new THREE.Mesh(heroRingAGeo, heroRingAMat);
  heroRingC.rotation.y = Math.PI / 2;
  heroGroup.add(heroRingA, heroRingB, heroRingC);

  const heroCoreGeo = new THREE.SphereGeometry(0.15, 18, 14);
  const heroCoreMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.82,
  });
  heroGroup.add(new THREE.Mesh(heroCoreGeo, heroCoreMat));

  const heroGlowMat = new THREE.SpriteMaterial({
    map: glowTex,
    color: 0x00ffff,
    transparent: true,
    opacity: 0.32,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const heroGlow = new THREE.Sprite(heroGlowMat);
  heroGlow.scale.set(1.3, 1.3, 1);
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
    heightScale: number,
    highlight = false
  ) => {
    const { tex, aspect } = createNeuralMetricSpriteTexture(text, highlight);
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      opacity: 0.96,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(heightScale * aspect, heightScale, 1);
    root.add(sprite);
    disposables.push(tex, mat);
    metricSprites.push({ sprite, a, b, offsetY });
  };

  // Layer headers & Neuron activation/bias readouts (never truncated, sleek micro size)
  addSpriteLabel('INPUT // x[0..7]', layerIndices[0][layerIndices[0].length - 1], -1, 1.05, 0.42, true);
  addSpriteLabel('HIDDEN L1 // ReLU', layerIndices[1][layerIndices[1].length - 1], -1, 1.0, 0.4);
  addSpriteLabel('NEURON_0x0A  a=0.96', heroIdx, -1, 1.05, 0.45, true);
  addSpriteLabel('b = +0.14 | σ(Σw·x)', heroIdx, -1, -1.0, 0.4);
  addSpriteLabel('HIDDEN L3 // ATTN', layerIndices[3][layerIndices[3].length - 1], -1, 1.0, 0.4);
  addSpriteLabel('OUTPUT // ŷ = 0.98', layerIndices[4][layerIndices[4].length - 1], -1, 1.05, 0.42, true);

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
    addSpriteLabel(
      `w = ${sign}${syn.weight.toFixed(2)}`,
      syn.a,
      syn.b,
      k % 2 === 0 ? 0.18 : -0.18,
      0.34,
      syn.weight > 0.75
    );
  });

  // 5. Sparse Random End-to-End Neural Data Pulses (only 3 active at once, picking random routes all the way out!)
  const pickRandomRoute = (): number[] => {
    const inputs = layerIndices[0];
    let curr = inputs[Math.floor(Math.random() * inputs.length)];
    const route = [curr];
    for (let step = 0; step < 4; step++) {
      const nexts = adjNext[curr];
      if (!nexts || nexts.length === 0) break;
      curr = nexts[Math.floor(Math.random() * nexts.length)];
      route.push(curr);
    }
    return route.length === 5
      ? route
      : [
          inputs[0],
          layerIndices[1][0],
          layerIndices[2][0],
          layerIndices[3][0],
          layerIndices[4][0],
        ];
  };

  const energyCount = 3;
  const energyHeadGeo = new THREE.SphereGeometry(0.095, 10, 10);
  const energyHeadMat = new THREE.MeshBasicMaterial({
    color: 0xd8ffff,
    transparent: true,
    opacity: 0.92,
  });
  const energyHeads = new THREE.InstancedMesh(energyHeadGeo, energyHeadMat, energyCount);
  energyHeads.frustumCulled = false;
  root.add(energyHeads);

  const energyAuraGeo = new THREE.PlaneGeometry(0.48, 0.48);
  const energyAuraMat = new THREE.MeshBasicMaterial({
    map: glowTex,
    color: 0x00ffff,
    transparent: true,
    opacity: 0.58,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const energyAuras = new THREE.InstancedMesh(energyAuraGeo, energyAuraMat, energyCount);
  energyAuras.frustumCulled = false;
  root.add(energyAuras);

  // Pick a clean, connected 4-neuron path from Layer 0 -> Layer 1 -> Layer 2 -> Layer 3/4 for the camera data-ride!
  const startNeuron = layerIndices[0][2] ?? layerIndices[0][0];
  const findConnectedNext = (curr: number, preferredLayerIdx: number): number => {
    const candidates = adjNext[curr];
    if (candidates && candidates.length > 0) {
      // Prefer a visually centered neuron so the ride stays smoothly inside the block volume
      let best = candidates[0];
      let bestDist = Infinity;
      for (const cIdx of candidates) {
        const d = Math.abs(neurons[cIdx].orderedPos.y) + Math.abs(neurons[cIdx].orderedPos.z) * 0.4;
        if (d < bestDist) {
          bestDist = d;
          best = cIdx;
        }
      }
      return best;
    }
    return layerIndices[preferredLayerIdx][0];
  };
  const hop1Neuron = findConnectedNext(startNeuron, 1);
  const hop2Neuron = heroIdx >= 0 && adjNext[hop1Neuron]?.includes(heroIdx) ? heroIdx : findConnectedNext(hop1Neuron, 2);
  const hop3Neuron = findConnectedNext(hop2Neuron, 3);
  const hop4Neuron = findConnectedNext(hop3Neuron, 4);
  const rideIndices = [startNeuron, hop1Neuron, hop2Neuron, hop3Neuron, hop4Neuron];
  const rideWaypoints = rideIndices.map((idx) => neurons[idx].orderedPos.clone());

  // Highlighted glowing data-ride trail line connecting the 4/5 ride neurons when camera becomes data
  const rideLineGeo = new THREE.BufferGeometry().setFromPoints(rideWaypoints);
  const rideLineMat = new THREE.LineBasicMaterial({
    color: 0xd8ffff,
    transparent: true,
    opacity: 0.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const rideLine = new THREE.Line(rideLineGeo, rideLineMat);
  root.add(rideLine);
  disposables.push(rideLineGeo, rideLineMat);

  const energyMeta = [
    { route: pickRandomRoute(), speed: 0.085, offset: 0.05, prevCycle: 0 },
    { route: pickRandomRoute(), speed: 0.105, offset: 0.39, prevCycle: 0 },
    { route: pickRandomRoute(), speed: 0.075, offset: 0.72, prevCycle: 0 },
  ];

  disposables.push(energyHeadGeo, energyHeadMat, energyAuraGeo, energyAuraMat);

  const dummy = new THREE.Object3D();
  const _ePos = new THREE.Vector3();
  let neuralSimTime = 0;

  return {
    root,
    rideWaypoints,
    update: (
      delta: number,
      pointerX: number,
      pointerY: number,
      revealFactor: number,
      pauseFactor: number,
      enterNeuronFactor: number
    ) => {
      const reveal = THREE.MathUtils.clamp(revealFactor, 0, 1);
      root.visible = reveal > 0.01;
      if (!root.visible) return;

      const pause = THREE.MathUtils.clamp(pauseFactor, 0, 1);
      const enter = THREE.MathUtils.clamp(enterNeuronFactor, 0, 1);
      // Smoothly pause neural pulse & ring drift when the blurred About Me card is open
      neuralSimTime += delta * (1 - pause * 0.94);

      const tiltScale = (1 - enter * 0.92) * (1 - pause * 0.65);
      const sideScale = 1 - pause * 0.22;
      root.scale.setScalar((0.84 + reveal * 0.16) * sideScale);
      root.rotation.y = pointerX * 0.14 * tiltScale;
      root.rotation.x = pointerY * 0.08 * tiltScale;

      // Smooth fade-in across all neural parts (stays crisp beside the right-half About Me card)
      const activeDim = 1 - pause * 0.1;
      gridMat.opacity = 0.2 * reveal * activeDim;
      somaMat.opacity = 0.88 * reveal * activeDim;
      nucleusMat.opacity = 0.9 * reveal * activeDim;
      ringMat.opacity = 0.55 * reveal * activeDim;
      auraPlaneMat.opacity = 0.16 * reveal * activeDim;
      energyHeadMat.opacity = 0.92 * reveal * (1 - pause * 0.32);
      energyAuraMat.opacity = 0.58 * reveal * (1 - pause * 0.32);
      rideLineMat.opacity = THREE.MathUtils.smoothstep(enter, 0.02, 0.22) * 0.72 * reveal;

      for (let i = 0; i < neurons.length; i++) {
        const n = neurons[i];
        // NEVER mix up neuron order — keep crisp 5-layer neural topology intact!
        n.livePos.copy(n.orderedPos);

        if (!n.isHero) {
          const swirlAmp = 0.032 * (1 - enter * 0.85);
          n.livePos.y += Math.sin(neuralSimTime * 0.65 + n.phase) * swirlAmp;
          n.livePos.z += Math.cos(neuralSimTime * 0.55 + n.phase) * swirlAmp * 0.65;

          const pulse = 1.0 + Math.sin(neuralSimTime * 1.4 + n.phase) * 0.08;
          dummy.position.copy(n.livePos);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.setScalar(1.0);
          dummy.updateMatrix();
          somaInstanced.setMatrixAt(i, dummy.matrix);

          dummy.scale.setScalar(pulse);
          dummy.updateMatrix();
          nucleusInstanced.setMatrixAt(i, dummy.matrix);

          dummy.rotation.set(neuralSimTime * 0.25 + n.phase, neuralSimTime * 0.2, n.phase);
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

      // Update Center Hero Round Neuron Assembly (stays aligned cleanly in its middle bottleneck slot)
      if (heroIdx >= 0) {
        heroGroup.position.copy(neurons[heroIdx].livePos);
        heroGroup.scale.setScalar(1.0);
        heroGroup.rotation.y = neuralSimTime * 0.2 + pointerX * 0.15 * tiltScale;

        heroRingA.rotation.z = neuralSimTime * 0.5;
        heroRingB.rotation.y = -neuralSimTime * 0.4;
        heroRingC.rotation.x = neuralSimTime * 0.34;
        heroOuterMat.opacity = 0.26 * reveal * activeDim;
        heroRingAMat.opacity = 0.62 * reveal * activeDim;
        heroCoreMat.opacity = 0.82 * reveal * activeDim;
        heroGlowMat.opacity = 0.32 * reveal * activeDim;
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
      synMat.opacity = Math.max(0, 0.34 - enter * 0.08) * reveal * activeDim;

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
        (item.sprite.material as THREE.SpriteMaterial).opacity =
          Math.max(0, 0.9 - enter * 1.6) * reveal * (1 - pause * 0.2);
      }

      // Animate 3 independent random end-to-end data pulses (Layer 0 -> Layer 4), smoothly paused while reading
      for (let e = 0; e < energyMeta.length; e++) {
        const em = energyMeta[e];
        const progress = neuralSimTime * em.speed + em.offset;
        const cycle = Math.floor(progress);
        if (cycle !== em.prevCycle) {
          em.prevCycle = cycle;
          em.route = pickRandomRoute();
        }
        const totalU = (progress - cycle) * 4.0;
        const hopIdx = Math.min(3, Math.floor(totalU));
        const hopT = totalU - hopIdx;
        const nA = neurons[em.route[hopIdx]].livePos;
        const nB = neurons[em.route[hopIdx + 1]].livePos;
        _ePos.lerpVectors(nA, nB, hopT);

        dummy.position.copy(_ePos);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(1.0 + Math.sin(hopT * Math.PI) * 0.22);
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
 * CH.03 // QUANTUM GYROSCOPE REACTOR:
 * Sleek Obsidian Graphite & Pure Cyan multi-axis segmented gyroscope portal with an inner
 * crystalline core and dynamic orbiting Key-Skill prism satellites (driven by RESUME_DATA.keySkills).
 * Zero solar system, zero orange hues, zero blocking canyon sticks.
 */
export function buildIrisChamber(
  yPos: number,
  zPos: number,
  _obsidianTex: THREE.CanvasTexture,
  glowTex: THREE.CanvasTexture,
  _neutralGlowTex: THREE.CanvasTexture,
  keySkills: ResumeKeySkill[]
) {
  const root = new THREE.Group();
  root.position.set(0, yPos, zPos);

  const disposables: { dispose: () => void }[] = [];
  const rng = createRng(3303);

  // Subtle deep-space obsidian cyan micro-particles (restrained depth field)
  const starCount = 240;
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const r = 4.6 + rng() * 13.5;
    const theta = rng() * Math.PI * 2;
    const phi = Math.acos(2 * rng() - 1);
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.cos(phi) * 0.72;
    starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0x9fefff,
    size: 0.04,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
  });
  root.add(new THREE.Points(starGeo, starMat));
  disposables.push(starGeo, starMat);

  // Subtle translucent architectural ground grid far below Reactor for spatial continuity
  const subGrid = new THREE.GridHelper(22, 22, 0x00ffff, 0x1a222b);
  subGrid.position.set(0, -4.8, 0);
  const subGridMat = subGrid.material as THREE.Material;
  subGridMat.transparent = true;
  subGridMat.opacity = 0.14;
  root.add(subGrid);
  disposables.push(subGrid);

  // Main Quantum Gyroscope Assembly
  const reactorGroup = new THREE.Group();
  reactorGroup.rotation.set(0.22, -0.26, 0.08);
  root.add(reactorGroup);

  const obsidianMat = new THREE.MeshStandardMaterial({
    color: 0x1a1f27,
    roughness: 0.24,
    metalness: 0.88,
  });
  const cyanEdgeMat = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.78,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const iceEdgeMat = new THREE.LineBasicMaterial({
    color: 0xd8ffff,
    transparent: true,
    opacity: 0.48,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  disposables.push(obsidianMat, cyanEdgeMat, iceEdgeMat);

  // 1. 3-Axis Interlocking Segmented Obsidian Gyroscope Rings
  interface GimbalRing {
    group: THREE.Group;
    baseTiltX: number;
    baseTiltY: number;
    spinZ: number;
    spinY: number;
  }
  const gimbalSpecs = [
    { r: 2.65, tube: 0.11, segs: 6, gap: 0.18, tiltX: 0.35, tiltY: -0.2, spinZ: 0.14, spinY: 0.08 },
    { r: 2.1, tube: 0.09, segs: 5, gap: 0.22, tiltX: -0.58, tiltY: 0.42, spinZ: -0.22, spinY: -0.12 },
    { r: 1.55, tube: 0.075, segs: 4, gap: 0.28, tiltX: 0.72, tiltY: 0.65, spinZ: 0.32, spinY: 0.16 },
    { r: 1.05, tube: 0.055, segs: 3, gap: 0.36, tiltX: -0.25, tiltY: -0.78, spinZ: -0.45, spinY: -0.2 },
  ];

  const gimbalRings: GimbalRing[] = [];
  gimbalSpecs.forEach((spec, idx) => {
    const ringPivot = new THREE.Group();
    ringPivot.rotation.set(spec.tiltX, spec.tiltY, 0);

    const ringSpin = new THREE.Group();
    const arcLen = (Math.PI * 2) / spec.segs - spec.gap;
    for (let s = 0; s < spec.segs; s++) {
      const start = s * ((Math.PI * 2) / spec.segs);
      const tGeo = new THREE.TorusGeometry(spec.r, spec.tube, 8, 22, arcLen);
      const eGeo = new THREE.EdgesGeometry(tGeo, 16);
      disposables.push(tGeo, eGeo);

      const mesh = new THREE.Mesh(tGeo, obsidianMat);
      mesh.rotation.z = start;
      mesh.add(new THREE.LineSegments(eGeo, idx % 2 === 0 ? cyanEdgeMat : iceEdgeMat));
      ringSpin.add(mesh);
    }

    ringPivot.add(ringSpin);
    reactorGroup.add(ringPivot);
    gimbalRings.push({
      group: ringSpin,
      baseTiltX: spec.tiltX,
      baseTiltY: spec.tiltY,
      spinZ: spec.spinZ,
      spinY: spec.spinY,
    });
  });

  // 2. Central Crystalline Singularity Core (Obsidian Glass Icosahedron + Glowing Cyan Nucleus)
  const coreGroup = new THREE.Group();
  reactorGroup.add(coreGroup);

  const outerCrystalGeo = new THREE.IcosahedronGeometry(0.62, 0);
  const outerCrystalEdges = new THREE.EdgesGeometry(outerCrystalGeo);
  const outerCrystalMat = new THREE.MeshPhysicalMaterial({
    color: 0x0b161e,
    emissive: new THREE.Color(0x00ffff),
    emissiveIntensity: 0.14,
    roughness: 0.12,
    metalness: 0.35,
    transparent: true,
    opacity: 0.58,
    depthWrite: false,
  });
  const outerCrystal = new THREE.Mesh(outerCrystalGeo, outerCrystalMat);
  outerCrystal.add(new THREE.LineSegments(outerCrystalEdges, cyanEdgeMat));
  coreGroup.add(outerCrystal);

  const innerCrystalGeo = new THREE.OctahedronGeometry(0.32, 0);
  const innerCrystalMat = new THREE.MeshBasicMaterial({
    color: 0xd8ffff,
    transparent: true,
    opacity: 0.88,
  });
  const innerCrystal = new THREE.Mesh(innerCrystalGeo, innerCrystalMat);
  coreGroup.add(innerCrystal);

  const coreAuraMat = new THREE.SpriteMaterial({
    map: glowTex,
    color: 0x00ffff,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const coreAura = new THREE.Sprite(coreAuraMat);
  coreAura.scale.set(2.1, 2.1, 1);
  coreGroup.add(coreAura);

  disposables.push(
    outerCrystalGeo,
    outerCrystalEdges,
    outerCrystalMat,
    innerCrystalGeo,
    innerCrystalMat,
    coreAuraMat
  );

  // 3. Dynamic Key-Skill Orbital Prism Nodes tethered around the Reactor Core
  const effectiveSkills: ResumeKeySkill[] =
    keySkills.length > 0 ? keySkills : [{ name: 'SYSTEMS', color: '#00FFFF' }];

  const nodeGeo = new THREE.OctahedronGeometry(0.13, 0);
  const nodeWireGeo = new THREE.EdgesGeometry(nodeGeo);
  const trackLineMat = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.2,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const tetherMat = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.24,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  disposables.push(nodeGeo, nodeWireGeo, trackLineMat, tetherMat);

  interface OrbitalSkillNode {
    orbitGroup: THREE.Group;
    nodePivot: THREE.Group;
    nodeMesh: THREE.Mesh;
    labelMat: THREE.SpriteMaterial;
    tetherAttr: THREE.BufferAttribute;
    radius: number;
    speed: number;
    phase: number;
  }

  const skillNodes: OrbitalSkillNode[] = [];
  const count = effectiveSkills.length;

  effectiveSkills.forEach((skill, idx) => {
    const ratio = count === 1 ? 0.5 : idx / (count - 1);
    const radius = count === 1 ? 3.2 : 2.95 + ratio * 1.15;
    const speed = (idx % 2 === 0 ? 1 : -1) * (0.28 - ratio * 0.1);
    const phase = (idx * 2.39996) % (Math.PI * 2);

    const orbitGroup = new THREE.Group();
    orbitGroup.rotation.set(
      (idx % 3 - 1) * 0.34 + 0.18,
      (idx * 0.45) % Math.PI,
      (idx % 2 === 0 ? 1 : -1) * 0.24
    );
    reactorGroup.add(orbitGroup);

    // Sleek hairline orbital ring
    const pts: THREE.Vector3[] = [];
    const segs = 64;
    for (let s = 0; s <= segs; s++) {
      const a = (s / segs) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    const trackGeo = new THREE.BufferGeometry().setFromPoints(pts);
    orbitGroup.add(new THREE.Line(trackGeo, trackLineMat));
    disposables.push(trackGeo);

    const nodePivot = new THREE.Group();
    orbitGroup.add(nodePivot);

    const accent = new THREE.Color(skill.color);
    const nodeMat = new THREE.MeshStandardMaterial({
      color: 0x161c24,
      emissive: accent,
      emissiveIntensity: 0.42,
      roughness: 0.28,
      metalness: 0.72,
    });
    const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
    const nodeEdgeMat = new THREE.LineBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0.9,
    });
    nodeMesh.add(new THREE.LineSegments(nodeWireGeo, nodeEdgeMat));
    nodePivot.add(nodeMesh);
    disposables.push(nodeMat, nodeEdgeMat);

    // Floating crisp Key Skill tag right above each prism node
    const { tex: labelTex, aspect } = createSkillPlanetLabelTexture(skill.name, skill.color);
    const labelMat = new THREE.SpriteMaterial({
      map: labelTex,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
    });
    const labelSprite = new THREE.Sprite(labelMat);
    const labelH = 0.25;
    labelSprite.scale.set(labelH * aspect, labelH, 1);
    labelSprite.position.set(0, 0.28, 0);
    nodePivot.add(labelSprite);
    disposables.push(labelTex, labelMat);

    // Dynamic laser tether linking prism satellite cleanly back to Reactor core
    const tetherArr = new Float32Array(6);
    const tetherGeo = new THREE.BufferGeometry();
    const tetherAttr = new THREE.BufferAttribute(tetherArr, 3);
    tetherAttr.setUsage(THREE.DynamicDrawUsage);
    tetherGeo.setAttribute('position', tetherAttr);
    orbitGroup.add(new THREE.Line(tetherGeo, tetherMat));
    disposables.push(tetherGeo);

    skillNodes.push({
      orbitGroup,
      nodePivot,
      nodeMesh,
      labelMat,
      tetherAttr,
      radius,
      speed,
      phase,
    });
  });

  const coreWorldPos = new THREE.Vector3(0, yPos, zPos);
  reactorGroup.updateMatrixWorld(true);
  coreGroup.getWorldPosition(coreWorldPos);

  return {
    root,
    getCoreWorldPosition: (out: THREE.Vector3) => out.copy(coreWorldPos),
    update: (elapsed: number, pointerX: number, pointerY: number, flyProgress: number) => {
      const tiltDamp = 1 - THREE.MathUtils.smoothstep(flyProgress, 0.15, 0.75);
      reactorGroup.rotation.y = -0.26 * tiltDamp + pointerX * 0.16 * tiltDamp;
      reactorGroup.rotation.x = 0.22 * tiltDamp + pointerY * 0.12 * tiltDamp;
      reactorGroup.updateMatrixWorld(true);
      coreGroup.getWorldPosition(coreWorldPos);

      // Counter-rotating obsidian gyroscope gimbals that open smoothly outward during portal dive
      const openScale = 1.0 + flyProgress * 0.58;
      gimbalRings.forEach((gr, idx) => {
        gr.group.rotation.z = elapsed * gr.spinZ;
        gr.group.rotation.y = elapsed * gr.spinY;
        gr.group.scale.setScalar(openScale + flyProgress * idx * 0.14);
      });

      outerCrystal.rotation.y = elapsed * 0.35;
      outerCrystal.rotation.x = elapsed * 0.22;
      innerCrystal.rotation.y = -elapsed * 0.65;
      innerCrystal.rotation.z = elapsed * 0.4;

      const auraScale = 2.0 + Math.sin(elapsed * 2.2) * 0.18 + flyProgress * 2.8;
      coreAura.scale.set(auraScale, auraScale, 1);

      const labelFade = 1 - THREE.MathUtils.smoothstep(flyProgress, 0.14, 0.48);

      for (let i = 0; i < skillNodes.length; i++) {
        const sn = skillNodes[i];
        const angle = sn.phase + elapsed * sn.speed;
        const nx = Math.cos(angle) * sn.radius;
        const nz = Math.sin(angle) * sn.radius;
        sn.nodePivot.position.set(nx, 0, nz);
        sn.nodeMesh.rotation.y = elapsed * 0.9 + i;
        sn.nodeMesh.rotation.x = elapsed * 0.55;
        sn.labelMat.opacity = 0.92 * labelFade;

        const arr = sn.tetherAttr.array as Float32Array;
        arr[0] = 0;
        arr[1] = 0;
        arr[2] = 0;
        arr[3] = nx;
        arr[4] = 0;
        arr[5] = nz;
        sn.tetherAttr.needsUpdate = true;
      }
    },
    dispose: () => {
      disposables.forEach((d) => d.dispose());
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
  graphGroup.position.set(0, 0.52, 0);
  root.add(graphGroup);

  const icoGeo = new THREE.IcosahedronGeometry(1.55, 1);
  const icoEdgesGeo = new THREE.EdgesGeometry(icoGeo);
  const octGeo = new THREE.OctahedronGeometry(0.95, 0);
  const octEdgesGeo = new THREE.EdgesGeometry(octGeo);
  const graphWireMat = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.68,
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
    size: 0.135,
    map: glowTex,
    color: 0x00ffff,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const particleCloud = new THREE.Points(particleGeo, particleMat);
  particleCloud.position.set(0, 0.52, 0);
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
