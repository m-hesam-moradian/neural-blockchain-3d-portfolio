import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  buildCrystalMonolith,
  buildHeroTerrain,
  buildPedestalStage,
  buildProtocolVault,
  buildPortalGate,
  CHAMBERS,
  createCyanGlowTexture,
  createRng,
  PedestalShapeId,
} from './worldBuilders';

interface MultiWorldSceneProps {
  scrollProgress: number;
  pedestalShape: PedestalShapeId;
  cameraResetNonce: number;
  calloutElRef: React.MutableRefObject<HTMLDivElement | null>;
  onTelemetryUpdate?: (chamberIdx: number, portalFlash: number, orbiting: boolean) => void;
}

interface NeuralNode {
  basePos: THREE.Vector3;
  pos: THREE.Vector3;
  phase: number;
  speed: number;
  amp: number;
  baseScale: number;
  excitement: number;
}

const NODE_COUNT = 210;
const CONNECT_DIST = 1.62;
const CONNECT_DIST_SQ = CONNECT_DIST * CONNECT_DIST;
const MAX_LINE_SEGMENTS = 2400;
const CURSOR_RADIUS = 2.65;
const CURSOR_RADIUS_SQ = CURSOR_RADIUS * CURSOR_RADIUS;

// Pre-allocated scratch helpers (Zero GC inside render loop)
const _vA = new THREE.Vector3();
const _vB = new THREE.Vector3();
const _vC = new THREE.Vector3();
const _vD = new THREE.Vector3();
const _camGoalPos = new THREE.Vector3();
const _camGoalTarget = new THREE.Vector3();
const _vCamDir = new THREE.Vector3();
const _rayPlane = new THREE.Plane();
const _cursorWorld = new THREE.Vector3();
const _cursorLocal = new THREE.Vector3();
const _calloutWorld = new THREE.Vector3();
const _dummy = new THREE.Object3D();
const _cNode = new THREE.Color();
const _cPureCyan = new THREE.Color(0x00ffff);
const _cHotCyan = new THREE.Color(0xd8ffff);

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function createNeuralNodes(): NeuralNode[] {
  const rng = createRng(133742);
  const nodes: NeuralNode[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < NODE_COUNT; i++) {
    const t = (i + 0.5) / NODE_COUNT;
    const yUnit = 1 - 2 * t;
    const radialXZ = Math.sqrt(Math.max(0, 1 - yUnit * yUnit));
    const phi = i * goldenAngle + (rng() - 0.5) * 0.22;

    const isInnerCore = i % 4 === 0;
    const shell = isInnerCore ? 1.15 + rng() * 1.1 : 2.35 + rng() * 0.95;

    let x = Math.cos(phi) * radialXZ * shell;
    let y = yUnit * shell * 0.84;
    let z = Math.sin(phi) * radialXZ * shell * 1.14;

    const hemisphereSign = x >= 0 ? 1 : -1;
    const fissurePinch = Math.exp(-(x * x) * 2.2) * 0.28;
    y -= fissurePinch * (y > 0 ? 0.8 : 0.2);
    x += hemisphereSign * 0.14;

    const basePos = new THREE.Vector3(x, y, z);
    nodes.push({
      basePos,
      pos: basePos.clone(),
      phase: rng() * Math.PI * 2,
      speed: 0.45 + rng() * 0.65,
      amp: 0.055 + rng() * 0.08,
      baseScale: isInnerCore ? 0.9 + rng() * 0.42 : 0.74 + rng() * 0.48,
      excitement: 0,
    });
  }
  return nodes;
}

/**
 * Sample multi-chamber camera flight path including the Portal Gate fly-through
 */
function sampleMultiWorldFlight(
  progress: number,
  outPos: THREE.Vector3,
  outTarget: THREE.Vector3
): { chamberIdx: number; portalFlyProgress: number; portalFlash: number } {
  const p = THREE.MathUtils.clamp(progress, 0, 1);

  // Closest chamber for HUD readout
  let chamberIdx = 0;
  let minDiff = Infinity;
  for (let i = 0; i < CHAMBERS.length; i++) {
    const d = Math.abs(p - CHAMBERS[i].scrollAt);
    if (d < minDiff) {
      minDiff = d;
      chamberIdx = i;
    }
  }

  let portalFlyProgress = 0;
  let portalFlash = 0;

  // Special fly-through between Chamber 3 (0.68) and Chamber 4 (1.0)
  if (p > 0.68) {
    const span = 1.0 - 0.68;
    const u = (p - 0.68) / span; // 0..1

    if (u < 0.45) {
      // Dive straight into the center of the glowing concentric portal rings
      const t = u / 0.45;
      const eased = t * t * (3 - 2 * t);
      portalFlyProgress = eased;
      portalFlash = THREE.MathUtils.smoothstep(t, 0.55, 1.0);

      outPos.set(0, THREE.MathUtils.lerp(-71.8, -72.0, eased), THREE.MathUtils.lerp(8.4, -1.2, eased));
      outTarget.set(0, -72.0, -8.0);
      return { chamberIdx: u < 0.35 ? 3 : 4, portalFlyProgress, portalFlash };
    } else {
      // Emerge on the other side into Chamber 4 Pedestal Stage
      const t = (u - 0.45) / 0.55;
      const eased = 1 - Math.pow(1 - t, 3);
      portalFlyProgress = 1;
      portalFlash = Math.max(0, 1 - t * 3.2);

      _vA.set(0, -86.5, 4.5);
      _vB.set(...CHAMBERS[4].camPos);
      outPos.lerpVectors(_vA, _vB, eased);

      _vC.set(0, -94.0, 0);
      _vD.set(...CHAMBERS[4].camTarget);
      outTarget.lerpVectors(_vC, _vD, eased);
      return { chamberIdx: 4, portalFlyProgress, portalFlash };
    }
  }

  for (let i = 0; i < 3; i++) {
    const a = CHAMBERS[i];
    const b = CHAMBERS[i + 1];
    if (p >= a.scrollAt && p <= b.scrollAt) {
      const local = (p - a.scrollAt) / Math.max(0.0001, b.scrollAt - a.scrollAt);
      const eased =
        local < 0.5 ? 4 * local * local * local : 1 - Math.pow(-2 * local + 2, 3) / 2;

      _vA.set(...a.camPos);
      _vB.set(...b.camPos);
      outPos.lerpVectors(_vA, _vB, eased);

      _vC.set(...a.camTarget);
      _vD.set(...b.camTarget);
      outTarget.lerpVectors(_vC, _vD, eased);

      return { chamberIdx, portalFlyProgress, portalFlash };
    }
  }

  outPos.set(...CHAMBERS[0].camPos);
  outTarget.set(...CHAMBERS[0].camTarget);
  return { chamberIdx: 0, portalFlyProgress: 0, portalFlash: 0 };
}

export const MultiWorldScene: React.FC<MultiWorldSceneProps> = ({
  scrollProgress,
  pedestalShape,
  cameraResetNonce,
  calloutElRef,
  onTelemetryUpdate,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglError, setWebglError] = useState(false);

  const scrollRef = useRef(scrollProgress);
  const pedestalShapeRef = useRef<PedestalShapeId>(pedestalShape);
  const userOrbitingRef = useRef(false);
  const orbitScrollAnchorRef = useRef(scrollProgress);
  const telemetryCbRef = useRef(onTelemetryUpdate);

  useEffect(() => {
    telemetryCbRef.current = onTelemetryUpdate;
  }, [onTelemetryUpdate]);

  useEffect(() => {
    scrollRef.current = scrollProgress;
    if (userOrbitingRef.current && Math.abs(scrollProgress - orbitScrollAnchorRef.current) > 0.03) {
      userOrbitingRef.current = false;
    }
  }, [scrollProgress]);

  useEffect(() => {
    pedestalShapeRef.current = pedestalShape;
  }, [pedestalShape]);

  useEffect(() => {
    if (cameraResetNonce > 0) {
      userOrbitingRef.current = false;
    }
  }, [cameraResetNonce]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    let renderer: THREE.WebGLRenderer;

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: false,
      });
    } catch {
      setWebglError(true);
      return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;

    container.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100vw';
    renderer.domElement.style.height = '100vh';
    renderer.domElement.style.cursor = 'grab';

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x121417);
    scene.fog = new THREE.FogExp2(0x121417, 0.034);

    // Studio Environment Reflection Map for crisp dark metallic facets & cyan rim highlights
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 120);
    camera.position.set(...CHAMBERS[0].camPos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.055;
    controls.enableZoom = false; // Wheel always drives scroll flight
    controls.enablePan = false;
    controls.rotateSpeed = 0.68;
    controls.target.set(...CHAMBERS[0].camTarget);

    controls.addEventListener('start', () => {
      userOrbitingRef.current = true;
      orbitScrollAnchorRef.current = scrollRef.current;
    });

    // Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x00ffff, 0x121417, 0.9);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.9);
    keyLight.position.set(8, 14, 12);
    scene.add(keyLight);

    const cyanRim = new THREE.DirectionalLight(0x00ffff, 1.6);
    cyanRim.position.set(-10, -8, -8);
    scene.add(cyanRim);

    // -------------------------------------------------------------------------
    // Atmospheric Vertical Tunnel Dust & Dive Streaks (Y = +10 down to Y = -110)
    // -------------------------------------------------------------------------
    const rngDust = createRng(5502);
    const dustCount = 420;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      const angle = rngDust() * Math.PI * 2;
      const rad = 2.8 + rngDust() * 14.0;
      dustPos[i * 3] = Math.cos(angle) * rad;
      dustPos[i * 3 + 1] = 10 - rngDust() * 120;
      dustPos[i * 3 + 2] = Math.sin(angle) * rad;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0x00ffff,
      size: 0.055,
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const tunnelDust = new THREE.Points(dustGeo, dustMat);
    scene.add(tunnelDust);

    // -------------------------------------------------------------------------
    // CHAMBER 0: Hero Neural Core (210 nodes + dynamic synapses) + Wireframe Terrain
    // -------------------------------------------------------------------------
    const heroTerrain = buildHeroTerrain();
    scene.add(heroTerrain.group);

    const neuralGroup = new THREE.Group();
    neuralGroup.position.set(0, 0.2, 0);
    scene.add(neuralGroup);

    const nodes = createNeuralNodes();
    const sphereGeo = new THREE.IcosahedronGeometry(0.062, 1);
    const sphereMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const nodeSpheres = new THREE.InstancedMesh(sphereGeo, sphereMat, NODE_COUNT);
    nodeSpheres.frustumCulled = false;
    for (let i = 0; i < NODE_COUNT; i++) nodeSpheres.setColorAt(i, _cPureCyan);
    if (nodeSpheres.instanceColor) nodeSpheres.instanceColor.needsUpdate = true;
    neuralGroup.add(nodeSpheres);

    const glowTex = createCyanGlowTexture();
    const haloGeo = new THREE.BufferGeometry();
    const haloPositions = new Float32Array(NODE_COUNT * 3);
    const haloColors = new Float32Array(NODE_COUNT * 3);
    const haloPosAttr = new THREE.BufferAttribute(haloPositions, 3);
    haloPosAttr.setUsage(THREE.DynamicDrawUsage);
    const haloColorAttr = new THREE.BufferAttribute(haloColors, 3);
    haloColorAttr.setUsage(THREE.DynamicDrawUsage);
    haloGeo.setAttribute('position', haloPosAttr);
    haloGeo.setAttribute('color', haloColorAttr);

    const haloMat = new THREE.PointsMaterial({
      size: 0.42,
      map: glowTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const nodeHalos = new THREE.Points(haloGeo, haloMat);
    nodeHalos.frustumCulled = false;
    neuralGroup.add(nodeHalos);

    const lineGeo = new THREE.BufferGeometry();
    const linePositions = new Float32Array(MAX_LINE_SEGMENTS * 2 * 3);
    const lineColors = new Float32Array(MAX_LINE_SEGMENTS * 2 * 3);
    const linePosAttr = new THREE.BufferAttribute(linePositions, 3);
    linePosAttr.setUsage(THREE.DynamicDrawUsage);
    const lineColorAttr = new THREE.BufferAttribute(lineColors, 3);
    lineColorAttr.setUsage(THREE.DynamicDrawUsage);
    lineGeo.setAttribute('position', linePosAttr);
    lineGeo.setAttribute('color', lineColorAttr);
    lineGeo.setDrawRange(0, 0);

    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.56,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const synapseLines = new THREE.LineSegments(lineGeo, lineMat);
    synapseLines.frustumCulled = false;
    neuralGroup.add(synapseLines);

    // -------------------------------------------------------------------------
    // CHAMBERS 1..4: Distinct 3D Sculptures stacked along the vertical journey
    // -------------------------------------------------------------------------
    const crystalWorld = buildCrystalMonolith(CHAMBERS[1].chamberY);
    scene.add(crystalWorld.group);

    const vaultWorld = buildProtocolVault(CHAMBERS[2].chamberY);
    scene.add(vaultWorld.group);

    const portalWorld = buildPortalGate(CHAMBERS[3].chamberY);
    scene.add(portalWorld.group);

    const pedestalWorld = buildPedestalStage(CHAMBERS[4].chamberY);
    scene.add(pedestalWorld.group);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // -------------------------------------------------------------------------
    // Pointer Listeners
    // -------------------------------------------------------------------------
    const raycaster = new THREE.Raycaster();
    const pointerTarget = new THREE.Vector2(0, 0);
    const pointerSmooth = new THREE.Vector2(0, 0);
    let pointerInside = false;

    const onPointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      pointerTarget.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerTarget.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      pointerInside = true;
    };

    const onPointerDown = () => {
      renderer.domElement.style.cursor = 'grabbing';
    };

    const onPointerUp = () => {
      renderer.domElement.style.cursor = 'grab';
    };

    const onPointerLeave = () => {
      pointerInside = false;
      pointerTarget.set(0, 0);
    };

    const onResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    };

    const onContextLost = (e: Event) => {
      e.preventDefault();
    };

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointerleave', onPointerLeave);
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    window.addEventListener('resize', onResize);

    // -------------------------------------------------------------------------
    // Main Animation Loop
    // -------------------------------------------------------------------------
    let frameId = 0;
    let disposed = false;
    let lastChamberIdx = -1;
    let lastFlash = -1;
    let lastOrbit = false;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const tick = () => {
      if (disposed) return;

      const delta = Math.min(clock.getDelta(), 0.08);
      const elapsed = clock.elapsedTime;

      const pAlpha = 1 - Math.exp(-6.5 * delta);
      pointerSmooth.x = THREE.MathUtils.lerp(pointerSmooth.x, pointerTarget.x, pAlpha);
      pointerSmooth.y = THREE.MathUtils.lerp(pointerSmooth.y, pointerTarget.y, pAlpha);

      const { chamberIdx, portalFlyProgress, portalFlash } = sampleMultiWorldFlight(
        scrollRef.current,
        _camGoalPos,
        _camGoalTarget
      );

      if (
        chamberIdx !== lastChamberIdx ||
        Math.abs(portalFlash - lastFlash) > 0.02 ||
        userOrbitingRef.current !== lastOrbit
      ) {
        lastChamberIdx = chamberIdx;
        lastFlash = portalFlash;
        lastOrbit = userOrbitingRef.current;
        telemetryCbRef.current?.(chamberIdx, portalFlash, userOrbitingRef.current);
      }

      // Smooth camera flight + cursor parallax when not dragging OrbitControls
      if (!userOrbitingRef.current) {
        _camGoalPos.x += pointerSmooth.x * 0.72;
        _camGoalPos.y += pointerSmooth.y * 0.42;

        const damp = 4.8;
        camera.position.x = THREE.MathUtils.damp(camera.position.x, _camGoalPos.x, damp, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _camGoalPos.y, damp, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _camGoalPos.z, damp, delta);

        controls.target.x = THREE.MathUtils.damp(controls.target.x, _camGoalTarget.x, damp, delta);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, _camGoalTarget.y, damp, delta);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, _camGoalTarget.z, damp, delta);
      }

      controls.update();

      // Update Chamber 0 Neural Core only when within viewing distance (Y > -20)
      if (camera.position.y > -20) {
        neuralGroup.rotation.y = THREE.MathUtils.damp(
          neuralGroup.rotation.y,
          pointerSmooth.x * 0.22 + elapsed * 0.08,
          4.5,
          delta
        );
        neuralGroup.rotation.x = THREE.MathUtils.damp(
          neuralGroup.rotation.x,
          -pointerSmooth.y * 0.16,
          4.5,
          delta
        );
        neuralGroup.updateMatrixWorld();

        camera.getWorldDirection(_vCamDir);
        _rayPlane.setFromNormalAndCoplanarPoint(_vCamDir, controls.target);
        raycaster.setFromCamera(pointerSmooth, camera);
        const hasCursorHit =
          pointerInside && raycaster.ray.intersectPlane(_rayPlane, _cursorWorld) !== null;
        if (hasCursorHit) {
          _cursorLocal.copy(_cursorWorld);
          neuralGroup.worldToLocal(_cursorLocal);
        }

        for (let i = 0; i < NODE_COUNT; i++) {
          const node = nodes[i];
          const t = elapsed * node.speed + node.phase;
          _vA.set(
            node.basePos.x + Math.sin(t * 1.1) * node.amp,
            node.basePos.y + Math.cos(t * 0.9) * node.amp,
            node.basePos.z + Math.sin(t * 0.8 + 1.3) * node.amp
          );

          let targetExcitement = 0;
          if (hasCursorHit) {
            _vB.subVectors(node.pos, _cursorLocal);
            const distSq = _vB.lengthSq();
            if (distSq < CURSOR_RADIUS_SQ && distSq > 0.0001) {
              const dist = Math.sqrt(distSq);
              const falloff = 1 - dist / CURSOR_RADIUS;
              const smoothFalloff = falloff * falloff;
              _vB.divideScalar(dist);
              _vA.addScaledVector(_vB, smoothFalloff * 0.9);
              targetExcitement = smoothFalloff;
            }
          }

          const settle = 1 - Math.exp(-8.5 * delta);
          node.pos.lerp(_vA, settle);
          node.excitement = THREE.MathUtils.lerp(
            node.excitement,
            targetExcitement,
            1 - Math.exp(-10 * delta)
          );

          _dummy.position.copy(node.pos);
          _dummy.scale.setScalar(node.baseScale * (1 + node.excitement * 0.65));
          _dummy.updateMatrix();
          nodeSpheres.setMatrixAt(i, _dummy.matrix);

          _cNode.copy(_cPureCyan).lerp(_cHotCyan, node.excitement * 0.85);
          nodeSpheres.setColorAt(i, _cNode);

          const pIdx = i * 3;
          haloPositions[pIdx] = node.pos.x;
          haloPositions[pIdx + 1] = node.pos.y;
          haloPositions[pIdx + 2] = node.pos.z;
          const haloGain = 0.72 + node.excitement * 0.28;
          haloColors[pIdx] = _cNode.r * haloGain;
          haloColors[pIdx + 1] = _cNode.g * haloGain;
          haloColors[pIdx + 2] = _cNode.b * haloGain;
        }
        nodeSpheres.instanceMatrix.needsUpdate = true;
        if (nodeSpheres.instanceColor) nodeSpheres.instanceColor.needsUpdate = true;
        haloPosAttr.needsUpdate = true;
        haloColorAttr.needsUpdate = true;

        let segmentCount = 0;
        for (let i = 0; i < NODE_COUNT; i++) {
          if (segmentCount >= MAX_LINE_SEGMENTS) break;
          const a = nodes[i];
          for (let j = i + 1; j < NODE_COUNT; j++) {
            const b = nodes[j];
            const dx = a.pos.x - b.pos.x;
            const dy = a.pos.y - b.pos.y;
            const dz = a.pos.z - b.pos.z;
            const distSq = dx * dx + dy * dy + dz * dz;

            if (distSq < CONNECT_DIST_SQ) {
              const dist = Math.sqrt(distSq);
              const alpha = 1 - dist / CONNECT_DIST;
              const boost = (a.excitement + b.excitement) * 0.5;
              const intensity = Math.min(1, alpha * 0.88 + boost * 0.55);
              const rCol = boost * 0.55 * intensity;

              const vOff = segmentCount * 6;
              linePositions[vOff] = a.pos.x;
              linePositions[vOff + 1] = a.pos.y;
              linePositions[vOff + 2] = a.pos.z;
              linePositions[vOff + 3] = b.pos.x;
              linePositions[vOff + 4] = b.pos.y;
              linePositions[vOff + 5] = b.pos.z;

              lineColors[vOff] = rCol;
              lineColors[vOff + 1] = intensity;
              lineColors[vOff + 2] = intensity;
              lineColors[vOff + 3] = rCol;
              lineColors[vOff + 4] = intensity;
              lineColors[vOff + 5] = intensity;

              segmentCount++;
              if (segmentCount >= MAX_LINE_SEGMENTS) break;
            }
          }
        }
        lineGeo.setDrawRange(0, segmentCount * 2);
        linePosAttr.needsUpdate = true;
        lineColorAttr.needsUpdate = true;
      }

      // Update Chambers 1..4
      if (camera.position.y < -8 && camera.position.y > -42) {
        crystalWorld.update(elapsed, pointerSmooth.x, pointerSmooth.y);
      }
      if (camera.position.y < -30 && camera.position.y > -66) {
        vaultWorld.update(elapsed, pointerSmooth.x, pointerSmooth.y);
      }
      if (camera.position.y < -54 && camera.position.y > -90) {
        portalWorld.update(elapsed, pointerSmooth.x, pointerSmooth.y, portalFlyProgress);
      }
      if (camera.position.y < -76) {
        pedestalWorld.update(elapsed, delta, pedestalShapeRef.current, pointerSmooth.x, pointerSmooth.y);
      }

      tunnelDust.rotation.y = elapsed * 0.015;

      renderer.render(scene, camera);

      // Project spatial 3D callout pin for the currently active chamber
      const calloutEl = calloutElRef.current;
      if (calloutEl) {
        const ch = CHAMBERS[chamberIdx];
        _calloutWorld.set(
          ch.calloutOffset[0],
          ch.chamberY + ch.calloutOffset[1],
          ch.calloutOffset[2]
        );
        _calloutWorld.project(camera);

        if (_calloutWorld.z > 1 || _calloutWorld.z < -1 || portalFlash > 0.35) {
          calloutEl.style.opacity = '0';
        } else {
          const vw = container.clientWidth || window.innerWidth;
          const vh = container.clientHeight || window.innerHeight;
          const sx = ((_calloutWorld.x + 1) / 2) * vw;
          const sy = ((-_calloutWorld.y + 1) / 2) * vh;
          calloutEl.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0)`;
          calloutEl.style.opacity = '1';
        }
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);

      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      window.removeEventListener('resize', onResize);

      controls.dispose();
      envTarget.dispose();
      dustGeo.dispose();
      dustMat.dispose();
      heroTerrain.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      haloGeo.dispose();
      haloMat.dispose();
      glowTex.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      crystalWorld.dispose();
      vaultWorld.dispose();
      portalWorld.dispose();
      pedestalWorld.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (webglError) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#121417] text-[#FFFFFF]">
        <p className="font-mono-hud text-xs text-[#00FFFF]">
          WEBGL CONTEXT UNAVAILABLE // HARDWARE ACCELERATION REQUIRED
        </p>
      </div>
    );
  }

  return <div ref={mountRef} className="fixed inset-0 z-0 w-screen h-screen" />;
};
