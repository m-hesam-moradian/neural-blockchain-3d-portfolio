import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { DETAILED_CHAMBERS } from '../data/portfolioSections';
import {
  buildDriftChamber,
  buildIrisChamber,
  buildPedestalChamber,
  buildSummitChamber,
  buildVolcanicHorizonTerrain,
  createRng,
  PedestalMode,
} from './detailedChambers';
import {
  createBinaryBlockchainBlockTextures,
  createObsidianSurfaceTexture,
  createPedestalCircuitTexture,
  createPureCyanGlowTexture,
} from './proceduralTextures';

interface ObsidianCyanSceneProps {
  scrollProgress: number;
  pedestalMode: PedestalMode;
  cameraResetNonce: number;
  onTelemetryUpdate?: (
    chamberIdx: number,
    warpFlash: number,
    teleportFlash: number,
    isOrbiting: boolean
  ) => void;
}

// Pre-allocated scratch math helpers (Zero GC inside render loop)
const _vA = new THREE.Vector3();
const _vB = new THREE.Vector3();
const _vC = new THREE.Vector3();
const _vD = new THREE.Vector3();
const _camGoalPos = new THREE.Vector3();
const _camGoalTarget = new THREE.Vector3();
const _dummy = new THREE.Object3D();

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

function sampleDetailedFlight(
  progress: number,
  rideCurve: THREE.CatmullRomCurve3,
  lastNeuronWorld: THREE.Vector3,
  outPos: THREE.Vector3,
  outTarget: THREE.Vector3
): {
  chamberIdx: number;
  warpIntensity: number;
  teleportFlash: number;
  teleported: boolean;
  portalFlyProgress: number;
  summitExplodeProgress: number;
  neuralRevealProgress: number;
  neuralPauseFactor: number;
  enterNeuronProgress: number;
  horizontalWarp: boolean;
  nearPlane: number;
  farPlane: number;
  frontWallFade: number;
} {
  const p = THREE.MathUtils.clamp(progress, 0, 1);

  let chamberIdx = 0;
  let minDiff = Infinity;
  for (let i = 0; i < DETAILED_CHAMBERS.length; i++) {
    const d = Math.abs(p - DETAILED_CHAMBERS[i].scrollAt);
    if (d < minDiff) {
      minDiff = d;
      chamberIdx = i;
    }
  }

  let warpIntensity = 0;
  let portalFlyProgress = 0;
  const summitExplodeProgress = THREE.MathUtils.smoothstep(p, 0.0, 0.19);
  const frontWallFade = THREE.MathUtils.smoothstep(p, 0.04, 0.21);
  const neuralRevealProgress = THREE.MathUtils.smoothstep(p, 0.04, 0.20);

  // Smoothly pause neural simulation while About Me card is displayed [0.30 .. 0.46]
  const pauseIn = THREE.MathUtils.smoothstep(p, 0.30, 0.34);
  const pauseOut = THREE.MathUtils.smoothstep(p, 0.42, 0.46);
  const neuralPauseFactor = pauseIn * (1 - pauseOut);

  // Pure Cyan Teleport Flash centered smoothly at p = 0.592 inside Last Neuron nucleus
  let teleportFlash = 0;
  if (p >= 0.572 && p <= 0.614) {
    if (p < 0.592) {
      teleportFlash = THREE.MathUtils.smoothstep(p, 0.572, 0.592);
    } else {
      teleportFlash = 1 - THREE.MathUtils.smoothstep(p, 0.592, 0.614);
    }
  }
  const teleported = p >= 0.592;

  // Segment 1: CH.01 Genesis Blocks (0.00) -> Explode & enter inside Chosen Block (0.21)
  if (p <= 0.21) {
    const u = p / 0.21;
    const eased = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;

    _vA.set(...DETAILED_CHAMBERS[0].camPos); // (0, 2.35, 11.4)
    _vB.set(...DETAILED_CHAMBERS[1].camPos); // (0, 1.56, 0.52)
    outPos.lerpVectors(_vA, _vB, eased);

    _vC.set(...DETAILED_CHAMBERS[0].camTarget); // (0, 1.35, 0)
    _vD.set(...DETAILED_CHAMBERS[1].camTarget); // (0, 1.55, 0)
    outTarget.lerpVectors(_vC, _vD, eased);

    warpIntensity = Math.sin(THREE.MathUtils.clamp((u - 0.14) / 0.48, 0, 1) * Math.PI) * 0.38;
    const microBlend = THREE.MathUtils.smoothstep(u, 0.55, 0.95);
    return {
      chamberIdx: 0,
      warpIntensity,
      teleportFlash: 0,
      teleported: false,
      portalFlyProgress,
      summitExplodeProgress,
      neuralRevealProgress,
      neuralPauseFactor: 0,
      enterNeuronProgress: 0,
      horizontalWarp: true,
      nearPlane: THREE.MathUtils.lerp(0.1, 0.004, microBlend),
      farPlane: THREE.MathUtils.lerp(180, 42, microBlend),
      frontWallFade,
    };
  }

  // Segment 2A: Unobstructed Live Neural Network Viewing Hold (0.21 -> 0.30)
  if (p <= 0.30) {
    const u = (p - 0.21) / 0.09;
    const eased = u * u * (3 - 2 * u);
    _vA.set(...DETAILED_CHAMBERS[1].camPos); // (0, 1.56, 0.52)
    _vB.set(0, 1.56, 0.45);
    outPos.lerpVectors(_vA, _vB, eased);
    outTarget.set(0, 1.55, 0);

    return {
      chamberIdx: 1,
      warpIntensity: 0,
      teleportFlash: 0,
      teleported: false,
      portalFlyProgress: 0,
      summitExplodeProgress: 1,
      neuralRevealProgress: 1,
      neuralPauseFactor,
      enterNeuronProgress: 0,
      horizontalWarp: true,
      nearPlane: 0.004,
      farPlane: 42,
      frontWallFade: 1,
    };
  }

  // Segment 2B: Neural Net Pauses + About Me Blurred Glass Card Hold (0.30 -> 0.46)
  if (p <= 0.46) {
    const u = (p - 0.30) / 0.16;
    const eased = u * u * (3 - 2 * u);
    _vA.set(0, 1.56, 0.45);
    _vB.set(0, 1.56, 0.42);
    outPos.lerpVectors(_vA, _vB, eased);
    outTarget.set(0, 1.55, 0);

    return {
      chamberIdx: 1,
      warpIntensity: 0,
      teleportFlash: 0,
      teleported: false,
      portalFlyProgress: 0,
      summitExplodeProgress: 1,
      neuralRevealProgress: 1,
      neuralPauseFactor,
      enterNeuronProgress: 0,
      horizontalWarp: true,
      nearPlane: 0.004,
      farPlane: 40,
      frontWallFade: 1,
    };
  }

  // Segment 2C: Unified Sweeping Spline Glide from Hold -> First Neuron -> 3 Neurons -> Inside Last Neuron (0.46 -> 0.592)
  if (p < 0.592) {
    const u = THREE.MathUtils.clamp((p - 0.46) / (0.592 - 0.46), 0, 1);
    // Gentle ease-in & smooth steady motion through neurons (no jerky acceleration!)
    const rideT = u < 0.2 ? 0.5 * (u / 0.2) * u : u;
    const clampedT = THREE.MathUtils.clamp(rideT, 0, 1);
    rideCurve.getPointAt(clampedT, outPos);

    if (clampedT < 0.88) {
      rideCurve.getPointAt(Math.min(1, clampedT + 0.08), _vD);
    } else {
      const endBlend = (clampedT - 0.88) / 0.12;
      rideCurve.getPointAt(1.0, _vC);
      _vA.copy(lastNeuronWorld).add(_vB.set(0.045, 0, 0));
      _vD.lerpVectors(_vC, _vA, endBlend);
    }

    // Smoothly pan view onto the glowing neuron path during first 24% so there is zero sudden head-turn
    const lookPan = THREE.MathUtils.smoothstep(u, 0.0, 0.24);
    _vC.set(0, 1.55, 0);
    outTarget.lerpVectors(_vC, _vD, lookPan);

    const nearEase = THREE.MathUtils.smoothstep(u, 0.05, 0.35);
    return {
      chamberIdx: 1,
      warpIntensity: 0,
      teleportFlash,
      teleported: false,
      portalFlyProgress: 0,
      summitExplodeProgress: 1,
      neuralRevealProgress: 1,
      neuralPauseFactor: 0,
      enterNeuronProgress: u,
      horizontalWarp: true,
      nearPlane: THREE.MathUtils.lerp(0.004, 0.0005, nearEase),
      farPlane: THREE.MathUtils.lerp(40, 16, nearEase),
      frontWallFade: 1,
    };
  }

  // Segment 2D: Teleported cleanly from Last Neuron to CH.03 Left-Framed Solar Vortex Approach (0.592 -> 0.72)
  if (p <= DETAILED_CHAMBERS[2].scrollAt) {
    const u = (p - 0.592) / (DETAILED_CHAMBERS[2].scrollAt - 0.592);
    const eased = 1 - Math.pow(1 - u, 2.5);
    _vA.set(3.9, -17.5, 1.8);
    _vB.set(...DETAILED_CHAMBERS[2].camPos); // [3.9, -20.8, 0.2] -> frames Solar Vortex cleanly in LEFT HALF
    outPos.lerpVectors(_vA, _vB, eased);

    _vC.set(3.8, -24.0, -12.0);
    _vD.set(...DETAILED_CHAMBERS[2].camTarget);
    outTarget.lerpVectors(_vC, _vD, eased);

    return {
      chamberIdx: 2,
      warpIntensity: 0,
      teleportFlash,
      teleported: true,
      portalFlyProgress: 0,
      summitExplodeProgress: 1,
      neuralRevealProgress: 0,
      neuralPauseFactor: 0,
      enterNeuronProgress: 1,
      horizontalWarp: false,
      nearPlane: 0.1,
      farPlane: 180,
      frontWallFade: 1,
    };
  }

  // Segment 3: CH.03 Helical Solar Vortex Left-Half Showcase (0.72) -> Center & Plunge through Sun Core -> CH.04 Pedestal (1.00)
  const u = (p - DETAILED_CHAMBERS[2].scrollAt) / (1.0 - DETAILED_CHAMBERS[2].scrollAt);
  if (u < 0.34) {
    // Hold gently framing 3D Helical Solar Vortex on LEFT half while WORK card occupies RIGHT half
    const t = u / 0.34;
    const eased = t * t * (3 - 2 * t);
    portalFlyProgress = eased * 0.1;

    _vA.set(...DETAILED_CHAMBERS[2].camPos); // [3.9, -20.8, 0.2]
    _vB.set(3.75, -21.2, -0.4);
    outPos.lerpVectors(_vA, _vB, eased);

    _vC.set(...DETAILED_CHAMBERS[2].camTarget); // [3.8, -24.0, -12.0]
    _vD.set(3.6, -24.0, -12.0);
    outTarget.lerpVectors(_vC, _vD, eased);

    return {
      chamberIdx: 2,
      warpIntensity: 0,
      teleportFlash,
      teleported: true,
      portalFlyProgress,
      summitExplodeProgress: 1,
      neuralRevealProgress: 0,
      neuralPauseFactor: 0,
      enterNeuronProgress: 1,
      horizontalWarp: false,
      nearPlane: 0.1,
      farPlane: 180,
      frontWallFade: 1,
    };
  } else if (u < 0.68) {
    // As WORK card fades out, glide smoothly back to x=0 and dive through the Solar Vortex core toward CH.04
    const t = (u - 0.34) / 0.34;
    const eased = t * t * (3 - 2 * t);
    portalFlyProgress = 0.1 + eased * 0.9;
    warpIntensity = THREE.MathUtils.smoothstep(t, 0.2, 1.0) * 0.72;

    _vA.set(3.75, -21.2, -0.4);
    _vB.set(0, -31.5, -11.5);
    outPos.lerpVectors(_vA, _vB, eased);

    _vC.set(3.6, -24.0, -12.0);
    _vD.set(0, -48.0, -12.0);
    outTarget.lerpVectors(_vC, _vD, eased);

    return {
      chamberIdx: u < 0.5 ? 2 : 3,
      warpIntensity,
      teleportFlash: 0,
      teleported: true,
      portalFlyProgress,
      summitExplodeProgress: 1,
      neuralRevealProgress: 0,
      neuralPauseFactor: 0,
      enterNeuronProgress: 1,
      horizontalWarp: false,
      nearPlane: 0.1,
      farPlane: 180,
      frontWallFade: 1,
    };
  } else {
    const t = (u - 0.68) / 0.32;
    const eased = 1 - Math.pow(1 - t, 3);
    portalFlyProgress = 1;
    warpIntensity = Math.max(0, 1 - t * 2.4) * 0.72;

    _vA.set(0, -31.5, -11.5);
    _vB.set(...DETAILED_CHAMBERS[3].camPos);
    outPos.lerpVectors(_vA, _vB, eased);

    _vC.set(0, -48.0, -12.0);
    _vD.set(...DETAILED_CHAMBERS[3].camTarget);
    outTarget.lerpVectors(_vC, _vD, eased);

    return {
      chamberIdx: 3,
      warpIntensity,
      teleportFlash: 0,
      teleported: true,
      portalFlyProgress,
      summitExplodeProgress: 1,
      neuralRevealProgress: 0,
      neuralPauseFactor: 0,
      enterNeuronProgress: 1,
      horizontalWarp: false,
      nearPlane: 0.1,
      farPlane: 180,
      frontWallFade: 1,
    };
  }
}

export const ObsidianCyanScene: React.FC<ObsidianCyanSceneProps> = ({
  scrollProgress,
  pedestalMode,
  cameraResetNonce,
  onTelemetryUpdate,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglError, setWebglError] = useState(false);

  const scrollRef = useRef(scrollProgress);
  const pedestalModeRef = useRef<PedestalMode>(pedestalMode);
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
    pedestalModeRef.current = pedestalMode;
  }, [pedestalMode]);

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
    renderer.toneMappingExposure = 1.15;

    container.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100vw';
    renderer.domElement.style.height = '100vh';
    renderer.domElement.style.cursor = 'grab';

    // Deep Graphite Environment (#121417) + subtle fog preserving sharp contrast
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x121417);
    scene.fog = new THREE.FogExp2(0x121417, 0.017);

    // Studio Reflection Map for crisp metallic basalt & clear quartz bevels
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 180);
    camera.position.set(...DETAILED_CHAMBERS[0].camPos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.055;
    controls.enableZoom = false; // Page scroll drives chamber transitions cleanly
    controls.enablePan = false;
    controls.rotateSpeed = 0.65;
    controls.target.set(...DETAILED_CHAMBERS[0].camTarget);

    controls.addEventListener('start', () => {
      userOrbitingRef.current = true;
      orbitScrollAnchorRef.current = scrollRef.current;
    });

    // Pure Cyan + Crisp White Lighting Rig (zero blue or green-teal hues)
    const hemiLight = new THREE.HemisphereLight(0x00ffff, 0x121417, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.15);
    keyLight.position.set(10, 18, 14);
    scene.add(keyLight);

    const cyanRim = new THREE.DirectionalLight(0x00ffff, 1.85);
    cyanRim.position.set(-12, -4, -18);
    scene.add(cyanRim);

    const horizonRim = new THREE.DirectionalLight(0xd8ffff, 1.3);
    horizonRim.position.set(0, 7, -62);
    scene.add(horizonRim);

    // Procedural Textures
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const glowTex = createPureCyanGlowTexture();
    const obsidianTex = createObsidianSurfaceTexture(maxAniso);
    const circuitTex = createPedestalCircuitTexture(maxAniso);
    const binaryTexA = createBinaryBlockchainBlockTextures(maxAniso, 1);
    const binaryTexB = createBinaryBlockchainBlockTextures(maxAniso, 2);

    // -------------------------------------------------------------------------
    // Build Sculpted Mars/Volcanic Horizon Terrain & All 4 Chambers
    // -------------------------------------------------------------------------
    const volcanicTerrain = buildVolcanicHorizonTerrain();
    scene.add(volcanicTerrain.root);

    const summitChamber = buildSummitChamber(obsidianTex, glowTex, binaryTexA, binaryTexB);
    scene.add(summitChamber.root);

    // Neural Network lives physically INSIDE the Chosen 0/1 Block via chosenAnchor!
    const driftChamber = buildDriftChamber(glowTex);
    summitChamber.chosenAnchor.add(driftChamber.root);

    // Transform local neuron ride waypoints into a unified sweeping CatmullRomCurve3 starting right at the hold pose
    const worldWaypoints = driftChamber.rideWaypoints.map(
      (lp) => new THREE.Vector3(lp.x * 0.026, 1.55 + lp.y * 0.026, lp.z * 0.026)
    );
    const firstNeuronWorld = worldWaypoints[0];
    const lastNeuronWorld = worldWaypoints[worldWaypoints.length - 1];
    const rideCurve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(0, 1.56, 0.42),
        new THREE.Vector3(
          firstNeuronWorld.x - 0.035,
          firstNeuronWorld.y + 0.01,
          firstNeuronWorld.z + 0.15
        ),
        ...worldWaypoints,
      ],
      false,
      'centripetal',
      0.45
    );

    const irisChamber = buildIrisChamber(-24, -12, obsidianTex, glowTex);
    scene.add(irisChamber.root);

    const pedestalChamber = buildPedestalChamber(-52, -12, circuitTex, glowTex);
    scene.add(pedestalChamber.root);

    // -------------------------------------------------------------------------
    // Hyperspace Warp Streak Tunnel & Drifting Atmospheric Motes
    // -------------------------------------------------------------------------
    const rng = createRng(8088);
    const streakCount = 130;
    const streakGeo = new THREE.CylinderGeometry(0.016, 0.016, 1.8, 6);
    const streakMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const warpStreaks = new THREE.InstancedMesh(streakGeo, streakMat, streakCount);
    warpStreaks.frustumCulled = false;
    warpStreaks.visible = false;

    const streakData = Array.from({ length: streakCount }, () => {
      const a = rng() * Math.PI * 2;
      const r = 1.6 + rng() * 5.6;
      return {
        radialX: Math.cos(a) * r,
        radialY: Math.sin(a) * r,
        offset: rng() * 24,
        speed: 14 + rng() * 18,
      };
    });
    scene.add(warpStreaks);

    const moteCount = 480;
    const moteGeo = new THREE.BufferGeometry();
    const motePos = new Float32Array(moteCount * 3);
    for (let i = 0; i < moteCount; i++) {
      motePos[i * 3] = (rng() - 0.5) * 42;
      motePos[i * 3 + 1] = 14 - rng() * 74; // Covers y: 14 down to -60
      motePos[i * 3 + 2] = 18 - rng() * 64; // Covers z: 18 down to -46
    }
    moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
    const moteMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.065,
      transparent: true,
      opacity: 0.42,
    });
    const motes = new THREE.Points(moteGeo, moteMat);
    scene.add(motes);

    // Hardware-GPU UnrealBloomPass tuned crisp so dark graphite stays deep charcoal
    let composer: EffectComposer | null = null;
    if (!isSoftwareGl) {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        0.32,
        0.28,
        0.8
      );
      composer.addPass(bloomPass);
      composer.addPass(new OutputPass());
      renderer.compile(scene, camera);
    }

    // -------------------------------------------------------------------------
    // Pointer & Resize Listeners
    // -------------------------------------------------------------------------
    const pointerTarget = new THREE.Vector2(0, 0);
    const pointerSmooth = new THREE.Vector2(0, 0);

    const onPointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      pointerTarget.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerTarget.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerDown = () => {
      renderer.domElement.style.cursor = 'grabbing';
    };

    const onPointerUp = () => {
      renderer.domElement.style.cursor = 'grab';
    };

    const onPointerLeave = () => {
      pointerTarget.set(0, 0);
    };

    const onResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
      composer?.setSize(w, h);
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
    let lastWarp = -1;
    let lastTeleportFlash = -1;
    let lastOrbit = false;
    let prevTeleported = scrollRef.current >= 0.592;
    let smoothScroll = scrollRef.current;
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

      // Damped scroll interpolation turns discrete mouse-wheel notches into liquid motion
      if (Math.abs(scrollRef.current - smoothScroll) > 0.22) {
        smoothScroll = scrollRef.current;
      } else {
        smoothScroll = THREE.MathUtils.damp(smoothScroll, scrollRef.current, 4.4, delta);
      }

      const pAlpha = 1 - Math.exp(-6.5 * delta);
      pointerSmooth.x = THREE.MathUtils.lerp(pointerSmooth.x, pointerTarget.x, pAlpha);
      pointerSmooth.y = THREE.MathUtils.lerp(pointerSmooth.y, pointerTarget.y, pAlpha);

      const {
        chamberIdx,
        warpIntensity,
        teleportFlash,
        teleported,
        portalFlyProgress,
        summitExplodeProgress,
        neuralRevealProgress,
        neuralPauseFactor,
        enterNeuronProgress,
        horizontalWarp,
        nearPlane,
        farPlane,
        frontWallFade,
      } = sampleDetailedFlight(
        smoothScroll,
        rideCurve,
        lastNeuronWorld,
        _camGoalPos,
        _camGoalTarget
      );

      if (
        chamberIdx !== lastChamberIdx ||
        Math.abs(warpIntensity - lastWarp) > 0.02 ||
        Math.abs(teleportFlash - lastTeleportFlash) > 0.015 ||
        userOrbitingRef.current !== lastOrbit
      ) {
        lastChamberIdx = chamberIdx;
        lastWarp = warpIntensity;
        lastTeleportFlash = teleportFlash;
        lastOrbit = userOrbitingRef.current;
        telemetryCbRef.current?.(chamberIdx, warpIntensity, teleportFlash, userOrbitingRef.current);
      }

      const crossedTeleport = teleported !== prevTeleported;
      prevTeleported = teleported;

      if (crossedTeleport) {
        camera.near = nearPlane;
        camera.far = farPlane;
        camera.updateProjectionMatrix();
        camera.position.copy(_camGoalPos);
        controls.target.copy(_camGoalTarget);
        userOrbitingRef.current = false;
      } else {
        const nextNear = THREE.MathUtils.damp(camera.near, nearPlane, 8, delta);
        const nextFar = THREE.MathUtils.damp(camera.far, farPlane, 8, delta);
        if (Math.abs(nextNear - camera.near) > 0.0001 || Math.abs(nextFar - camera.far) > 0.1) {
          camera.near = nextNear;
          camera.far = nextFar;
          camera.updateProjectionMatrix();
        }

        if (!userOrbitingRef.current) {
          const camDist = _camGoalPos.distanceTo(_camGoalTarget);
          const parallaxScale =
            enterNeuronProgress > 0.05 ? 0 : Math.min(1.0, camDist * 0.09);
          _camGoalPos.x += pointerSmooth.x * 0.72 * parallaxScale;
          _camGoalPos.y += pointerSmooth.y * 0.42 * parallaxScale;

          const damp = enterNeuronProgress > 0.05 ? 5.2 : 4.2;
          camera.position.x = THREE.MathUtils.damp(camera.position.x, _camGoalPos.x, damp, delta);
          camera.position.y = THREE.MathUtils.damp(camera.position.y, _camGoalPos.y, damp, delta);
          camera.position.z = THREE.MathUtils.damp(camera.position.z, _camGoalPos.z, damp, delta);

          controls.target.x = THREE.MathUtils.damp(controls.target.x, _camGoalTarget.x, damp, delta);
          controls.target.y = THREE.MathUtils.damp(controls.target.y, _camGoalTarget.y, damp, delta);
          controls.target.z = THREE.MathUtils.damp(controls.target.z, _camGoalTarget.z, damp, delta);
        }
      }

      controls.update();

      // Clean visibility separation so Summit / Chosen Block NEVER clip during teleport to Iris!
      volcanicTerrain.root.visible = !teleported && camera.position.z > 0.65;
      summitChamber.root.visible = !teleported;
      if (summitChamber.root.visible) {
        summitChamber.update(
          elapsed,
          pointerSmooth.x,
          pointerSmooth.y,
          summitExplodeProgress,
          frontWallFade
        );
        driftChamber.update(
          delta,
          pointerSmooth.x,
          pointerSmooth.y,
          neuralRevealProgress,
          neuralPauseFactor,
          enterNeuronProgress
        );
      }
      irisChamber.root.visible = teleported;
      if (irisChamber.root.visible && camera.position.y > -46) {
        irisChamber.update(elapsed, pointerSmooth.x, pointerSmooth.y, portalFlyProgress);
      }
      pedestalChamber.root.visible = teleported && camera.position.y < -22;
      if (pedestalChamber.root.visible) {
        pedestalChamber.update(
          elapsed,
          delta,
          pedestalModeRef.current,
          pointerSmooth.x,
          pointerSmooth.y
        );
      }

      motes.visible = camera.position.z > 0.65 || camera.position.y < -2.0;

      // Animate Hyperspace Warp Streaks (Z-tunnel for CH.01->02, Y-shaft for CH.03->04)
      warpStreaks.visible = warpIntensity > 0.02;
      if (warpStreaks.visible) {
        streakMat.opacity = warpIntensity * 0.88;
        const stretch = 0.4 + warpIntensity * 3.8;
        for (let i = 0; i < streakCount; i++) {
          const s = streakData[i];
          const travel = ((elapsed * s.speed + s.offset) % 24) - 12;
          if (horizontalWarp) {
            _dummy.position.set(
              camera.position.x + s.radialX,
              camera.position.y + s.radialY,
              camera.position.z + travel - 8
            );
            _dummy.rotation.set(Math.PI / 2, 0, 0);
          } else {
            _dummy.position.set(
              camera.position.x + s.radialX,
              camera.position.y + travel - 4,
              camera.position.z + s.radialY
            );
            _dummy.rotation.set(0, 0, 0);
          }
          _dummy.scale.set(1, stretch, 1);
          _dummy.updateMatrix();
          warpStreaks.setMatrixAt(i, _dummy.matrix);
        }
        warpStreaks.instanceMatrix.needsUpdate = true;
      }

      motes.rotation.y = Math.sin(elapsed * 0.06) * 0.025;

      if (composer) {
        composer.render();
      } else {
        renderer.render(scene, camera);
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
      composer?.dispose();
      envTarget.dispose();
      glowTex.dispose();
      obsidianTex.dispose();
      circuitTex.dispose();
      binaryTexA.map.dispose();
      binaryTexA.emissiveMap.dispose();
      binaryTexB.map.dispose();
      binaryTexB.emissiveMap.dispose();
      volcanicTerrain.dispose();
      summitChamber.dispose();
      driftChamber.dispose();
      irisChamber.dispose();
      pedestalChamber.dispose();
      streakGeo.dispose();
      streakMat.dispose();
      moteGeo.dispose();
      moteMat.dispose();
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
