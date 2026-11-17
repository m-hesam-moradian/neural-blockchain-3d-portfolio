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
  createRng,
  PedestalMode,
} from './detailedChambers';
import {
  createObsidianSurfaceTexture,
  createPedestalCircuitTexture,
  createPureCyanGlowTexture,
} from './proceduralTextures';

interface ObsidianCyanSceneProps {
  scrollProgress: number;
  pedestalMode: PedestalMode;
  cameraResetNonce: number;
  calloutPrimaryRef: React.MutableRefObject<HTMLButtonElement | null>;
  calloutSecondaryRef: React.MutableRefObject<HTMLButtonElement | null>;
  onTelemetryUpdate?: (chamberIdx: number, warpFlash: number, isOrbiting: boolean) => void;
}

// Pre-allocated scratch math helpers (Zero GC inside render loop)
const _vA = new THREE.Vector3();
const _vB = new THREE.Vector3();
const _vC = new THREE.Vector3();
const _vD = new THREE.Vector3();
const _camGoalPos = new THREE.Vector3();
const _camGoalTarget = new THREE.Vector3();
const _projVec = new THREE.Vector3();
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
  outPos: THREE.Vector3,
  outTarget: THREE.Vector3
): {
  chamberIdx: number;
  warpIntensity: number;
  portalFlyProgress: number;
  summitExplodeProgress: number;
} {
  const p = THREE.MathUtils.clamp(progress, 0, 1);

  // Closest chamber for HUD title
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
  const summitExplodeProgress = THREE.MathUtils.clamp(p / 0.16, 0, 1);

  // Segment 1: CH.01 (0.00) -> CH.02 (0.34) with Warp Dive Peak around 0.17..0.27
  if (p <= DETAILED_CHAMBERS[1].scrollAt) {
    const span = DETAILED_CHAMBERS[1].scrollAt;
    const u = p / span;
    const eased = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
    _vA.set(...DETAILED_CHAMBERS[0].camPos);
    _vB.set(...DETAILED_CHAMBERS[1].camPos);
    outPos.lerpVectors(_vA, _vB, eased);

    _vC.set(...DETAILED_CHAMBERS[0].camTarget);
    _vD.set(...DETAILED_CHAMBERS[1].camTarget);
    outTarget.lerpVectors(_vC, _vD, eased);

    warpIntensity = Math.sin(THREE.MathUtils.clamp((u - 0.28) / 0.58, 0, 1) * Math.PI);
    return { chamberIdx, warpIntensity, portalFlyProgress, summitExplodeProgress };
  }

  // Segment 2: CH.02 (0.34) -> CH.03 Iris Canyon (0.62)
  if (p <= DETAILED_CHAMBERS[2].scrollAt) {
    const u =
      (p - DETAILED_CHAMBERS[1].scrollAt) /
      (DETAILED_CHAMBERS[2].scrollAt - DETAILED_CHAMBERS[1].scrollAt);
    const eased = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;

    _vA.set(...DETAILED_CHAMBERS[1].camPos);
    _vB.set(...DETAILED_CHAMBERS[2].camPos);
    outPos.lerpVectors(_vA, _vB, eased);

    _vC.set(...DETAILED_CHAMBERS[1].camTarget);
    _vD.set(...DETAILED_CHAMBERS[2].camTarget);
    outTarget.lerpVectors(_vC, _vD, eased);

    warpIntensity = Math.sin(THREE.MathUtils.clamp((u - 0.25) / 0.55, 0, 1) * Math.PI) * 0.65;
    return { chamberIdx, warpIntensity, portalFlyProgress, summitExplodeProgress: 1 };
  }

  // Segment 3: CH.03 Iris (0.62) -> Straight through Portal Center -> CH.04 Pedestal (1.00)
  const u = (p - DETAILED_CHAMBERS[2].scrollAt) / (1.0 - DETAILED_CHAMBERS[2].scrollAt);
  if (u < 0.5) {
    // Plunge vertically straight down through the spinning Iris rings at Y = -56
    const t = u / 0.5;
    const eased = t * t * (3 - 2 * t);
    portalFlyProgress = eased;
    warpIntensity = THREE.MathUtils.smoothstep(t, 0.25, 1.0);

    outPos.set(
      THREE.MathUtils.lerp(0, 0, eased),
      THREE.MathUtils.lerp(-50.8, -61.5, eased),
      THREE.MathUtils.lerp(7.6, 0.2, eased)
    );
    outTarget.set(0, -68.0, 0);
    return {
      chamberIdx: u < 0.34 ? 2 : 3,
      warpIntensity,
      portalFlyProgress,
      summitExplodeProgress: 1,
    };
  } else {
    // Emerge smoothly above CH.04 Machined Pedestal Stage at Y = -84
    const t = (u - 0.5) / 0.5;
    const eased = 1 - Math.pow(1 - t, 3);
    portalFlyProgress = 1;
    warpIntensity = Math.max(0, 1 - t * 2.4);

    _vA.set(0, -73.5, 4.2);
    _vB.set(...DETAILED_CHAMBERS[3].camPos);
    outPos.lerpVectors(_vA, _vB, eased);

    _vC.set(0, -83.4, 0);
    _vD.set(...DETAILED_CHAMBERS[3].camTarget);
    outTarget.lerpVectors(_vC, _vD, eased);
    return {
      chamberIdx: 3,
      warpIntensity,
      portalFlyProgress,
      summitExplodeProgress: 1,
    };
  }
}

export const ObsidianCyanScene: React.FC<ObsidianCyanSceneProps> = ({
  scrollProgress,
  pedestalMode,
  cameraResetNonce,
  calloutPrimaryRef,
  calloutSecondaryRef,
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

    // Deep Graphite Environment (#121417) + matching Exponential Fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x121417);
    scene.fog = new THREE.FogExp2(0x121417, 0.031);

    // Studio Reflection Map for crisp metallic basalt & glass bevels
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 140);
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

    // Pure Cyan + Crisp White Lighting Rig (zero blue or teal hues)
    const hemiLight = new THREE.HemisphereLight(0x00ffff, 0x121417, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.1);
    keyLight.position.set(9, 16, 12);
    scene.add(keyLight);

    const cyanRim = new THREE.DirectionalLight(0x00ffff, 1.85);
    cyanRim.position.set(-10, -6, -10);
    scene.add(cyanRim);

    // Procedural Textures
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const glowTex = createPureCyanGlowTexture();
    const obsidianTex = createObsidianSurfaceTexture(maxAniso);
    const circuitTex = createPedestalCircuitTexture(maxAniso);

    // -------------------------------------------------------------------------
    // Build All 4 High-Detail Chambers
    // -------------------------------------------------------------------------
    const summitChamber = buildSummitChamber(obsidianTex, glowTex);
    scene.add(summitChamber.root);

    const driftChamber = buildDriftChamber(DETAILED_CHAMBERS[1].chamberY, glowTex);
    scene.add(driftChamber.root);

    const irisChamber = buildIrisChamber(DETAILED_CHAMBERS[2].chamberY, obsidianTex, glowTex);
    scene.add(irisChamber.root);

    const pedestalChamber = buildPedestalChamber(
      DETAILED_CHAMBERS[3].chamberY,
      circuitTex,
      glowTex
    );
    scene.add(pedestalChamber.root);

    // -------------------------------------------------------------------------
    // Hyperspace Warp Streak Tunnel & Drifting Snow/Ash Motes
    // -------------------------------------------------------------------------
    const rng = createRng(8088);
    const streakCount = 130;
    const streakGeo = new THREE.CylinderGeometry(0.018, 0.018, 1.8, 6);
    const streakMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const warpStreaks = new THREE.InstancedMesh(streakGeo, streakMat, streakCount);
    warpStreaks.frustumCulled = false;

    const streakData = Array.from({ length: streakCount }, () => {
      const a = rng() * Math.PI * 2;
      const r = 1.9 + rng() * 5.8;
      return {
        x: Math.cos(a) * r,
        z: Math.sin(a) * r,
        yBase: -5 - rng() * 75,
        speed: 12 + rng() * 16,
      };
    });
    scene.add(warpStreaks);

    const moteCount = 340;
    const moteGeo = new THREE.BufferGeometry();
    const motePos = new Float32Array(moteCount * 3);
    for (let i = 0; i < moteCount; i++) {
      const a = rng() * Math.PI * 2;
      const r = 2.0 + rng() * 14.0;
      motePos[i * 3] = Math.cos(a) * r;
      motePos[i * 3 + 1] = 10 - rng() * 106;
      motePos[i * 3 + 2] = Math.sin(a) * r;
    }
    moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
    const moteMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.06,
      transparent: true,
      opacity: 0.4,
    });
    const motes = new THREE.Points(moteGeo, moteMat);
    scene.add(motes);

    // Hardware-GPU UnrealBloomPass for radiant Pure Cyan glow
    let composer: EffectComposer | null = null;
    if (!isSoftwareGl) {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        0.42, // subtle crisp strength
        0.35, // tight radius
        0.72 // threshold so only bright pure cyan cores & edges bloom
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

    const projectToButton = (
      btn: HTMLButtonElement | null,
      wx: number,
      wy: number,
      wz: number,
      hide: boolean
    ) => {
      if (!btn) return;
      if (hide) {
        btn.style.opacity = '0';
        btn.style.pointerEvents = 'none';
        return;
      }
      _projVec.set(wx, wy, wz).project(camera);
      if (_projVec.z > 1 || _projVec.z < -1) {
        btn.style.opacity = '0';
        btn.style.pointerEvents = 'none';
        return;
      }
      const vw = container.clientWidth || window.innerWidth;
      const vh = container.clientHeight || window.innerHeight;
      const sx = ((_projVec.x + 1) / 2) * vw;
      const sy = ((-_projVec.y + 1) / 2) * vh;
      btn.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0)`;
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'auto';
    };

    const tick = () => {
      if (disposed) return;

      const delta = Math.min(clock.getDelta(), 0.08);
      const elapsed = clock.elapsedTime;

      const pAlpha = 1 - Math.exp(-6.5 * delta);
      pointerSmooth.x = THREE.MathUtils.lerp(pointerSmooth.x, pointerTarget.x, pAlpha);
      pointerSmooth.y = THREE.MathUtils.lerp(pointerSmooth.y, pointerTarget.y, pAlpha);

      const { chamberIdx, warpIntensity, portalFlyProgress, summitExplodeProgress } =
        sampleDetailedFlight(scrollRef.current, _camGoalPos, _camGoalTarget);

      if (
        chamberIdx !== lastChamberIdx ||
        Math.abs(warpIntensity - lastWarp) > 0.02 ||
        userOrbitingRef.current !== lastOrbit
      ) {
        lastChamberIdx = chamberIdx;
        lastWarp = warpIntensity;
        lastOrbit = userOrbitingRef.current;
        telemetryCbRef.current?.(chamberIdx, warpIntensity, userOrbitingRef.current);
      }

      if (!userOrbitingRef.current) {
        _camGoalPos.x += pointerSmooth.x * 0.78;
        _camGoalPos.y += pointerSmooth.y * 0.44;

        const damp = 4.6;
        camera.position.x = THREE.MathUtils.damp(camera.position.x, _camGoalPos.x, damp, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _camGoalPos.y, damp, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _camGoalPos.z, damp, delta);

        controls.target.x = THREE.MathUtils.damp(controls.target.x, _camGoalTarget.x, damp, delta);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, _camGoalTarget.y, damp, delta);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, _camGoalTarget.z, damp, delta);
      }

      controls.update();

      // Update Chambers cleanly within active range
      if (camera.position.y > -22) {
        summitChamber.update(elapsed, pointerSmooth.x, pointerSmooth.y, summitExplodeProgress);
      }
      if (camera.position.y < -10 && camera.position.y > -46) {
        driftChamber.update(elapsed, pointerSmooth.x, pointerSmooth.y);
      }
      if (camera.position.y < -36 && camera.position.y > -78) {
        irisChamber.update(elapsed, pointerSmooth.x, pointerSmooth.y, portalFlyProgress);
      }
      if (camera.position.y < -64) {
        pedestalChamber.update(
          elapsed,
          delta,
          pedestalModeRef.current,
          pointerSmooth.x,
          pointerSmooth.y
        );
      }

      // Animate Hyperspace Warp Streaks
      streakMat.opacity = 0.08 + warpIntensity * 0.85;
      const stretch = 0.35 + warpIntensity * 3.8;
      for (let i = 0; i < streakCount; i++) {
        const s = streakData[i];
        const yOff = ((elapsed * s.speed) % 24) - 12;
        _dummy.position.set(s.x, camera.position.y + yOff - 4, s.z);
        _dummy.scale.set(1, stretch, 1);
        _dummy.updateMatrix();
        warpStreaks.setMatrixAt(i, _dummy.matrix);
      }
      warpStreaks.instanceMatrix.needsUpdate = true;

      motes.rotation.y = elapsed * 0.018;

      if (composer) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }

      // Project primary & secondary spatial leader-line callouts for active chamber
      const activeCh = DETAILED_CHAMBERS[chamberIdx];
      const hideCallouts = warpIntensity > 0.45;
      projectToButton(
        calloutPrimaryRef.current,
        activeCh.calloutOffsets.primary[0],
        activeCh.calloutOffsets.primary[1],
        activeCh.calloutOffsets.primary[2],
        hideCallouts
      );
      projectToButton(
        calloutSecondaryRef.current,
        activeCh.calloutOffsets.secondary[0],
        activeCh.calloutOffsets.secondary[1],
        activeCh.calloutOffsets.secondary[2],
        hideCallouts
      );

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
