import { Suspense, useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations, Environment, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { getCachedModelUrl } from "../utils/modelCache";

// ─── 3D Model Performance & Caching Configuration ───────────────────────────
THREE.Cache.enabled = true;
const MODEL_ORIGINAL_URL = "/ninja_animation.glb";
useGLTF.preload(MODEL_ORIGINAL_URL);

const NINJA_SCALE = 2.5;             // Size/scale of the 3D model
const NINJA_ANIMATION_SPEED = 0.9;  // Speed of the animation (1.0 = normal, smaller = slower)
const NINJA_PAUSE_SECONDS = 0;     // Seconds to pause before restarting the animation

// ─── Japanese/Chinese characters for matrix rain ─────────────────────────────
const MATRIX_CHARS = "忍道影闇剣謎力術武侍龍神鬼刀弓炎水風雷夢魂禅虎鷹桜雪月星空命火水木金土日本語漢字あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん";

/* ── Optimized GLB Ninja Model with animations ──────────────────────────── */
function NinjaModel({ url }) {
  const groupRef = useRef();
  const { scene, animations } = useGLTF(url);
  const { actions, names } = useAnimations(animations, groupRef);

  // Mesh traversal optimization: frustum culling & disable redundant shadow passes
  useEffect(() => {
    if (!scene) return;
    scene.traverse((child) => {
      if (child.isMesh) {
        child.frustumCulled = true;
        child.castShadow = false;
        child.receiveShadow = false;
        if (child.material) {
          child.material.precision = "mediump";
        }
      }
    });
  }, [scene]);

  useEffect(() => {
    if (names.length > 0) {
      const action = actions[names[0]];
      if (action) {
        action.reset().play();
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
        action.timeScale = NINJA_ANIMATION_SPEED;

        const mixer = action.getMixer();
        const handleFinished = (e) => {
          if (e.action === action) {
            setTimeout(() => {
              if (action) action.reset().play();
            }, NINJA_PAUSE_SECONDS * 1000);
          }
        };

        mixer.addEventListener("finished", handleFinished);
        return () => {
          mixer.removeEventListener("finished", handleFinished);
          action.stop();
        };
      }
    }
  }, [actions, names]);

  useFrame((state) => {
    if (names.length === 0 && groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.06;
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.04;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive
        object={scene}
        scale={NINJA_SCALE}
        position={[0, -2.4, 0]}
        rotation={[0, Math.PI * 0.1, 0]}
      />
    </group>
  );
}

/* ── Fallback SVG ninja ─────────────────────────────────────────────────── */
function FallbackNinja() {
  return (
    <div className="sc-ninja-wrapper" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg
        viewBox="0 0 240 380"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%", filter: "drop-shadow(0 0 30px rgba(255,161,22,0.15))" }}
        aria-hidden="true"
      >
        <ellipse cx="120" cy="360" rx="55" ry="8" fill="#ffa116" opacity="0.08" className="ninja-ground-pulse" />
        <path d="M120 135 Q85 175 78 230 Q72 280 85 320 L120 330 L155 320 Q168 280 162 230 Q155 175 120 135Z" fill="#0d0d0d" stroke="#1a1a1a" strokeWidth="1" className="ninja-body-breathe" />
        <circle cx="120" cy="105" r="30" fill="#111" className="ninja-head-bob" />
        <path d="M90 92 Q120 82 150 92" stroke="#ffa116" strokeWidth="3.5" fill="none" strokeLinecap="round" className="ninja-headband-glow" />
        <rect x="101" y="100" width="38" height="5" rx="2.5" fill="#ffa116" opacity="0.9" className="ninja-eye-glow" />
        <line x1="90" y1="180" x2="50" y2="140" stroke="#0d0d0d" strokeWidth="14" strokeLinecap="round" />
        <line x1="50" y1="140" x2="18" y2="80" stroke="#c0c0c0" strokeWidth="2.5" strokeLinecap="round" className="ninja-blade-gleam" />
        <circle cx="45" cy="120" r="2" fill="#ffa116" opacity="0.6" className="ninja-spark-1" />
        <circle cx="195" cy="150" r="1.5" fill="#ffa116" opacity="0.5" className="ninja-spark-2" />
      </svg>
    </div>
  );
}

/* ── Optimized 3D Canvas scene with Caching & Clamped DPR ─────────────────── */
function NinjaScene() {
  const [modelUrl, setModelUrl] = useState(MODEL_ORIGINAL_URL);

  useEffect(() => {
    // Resolve cached Object URL from CacheStorage / memory
    let active = true;
    getCachedModelUrl(MODEL_ORIGINAL_URL).then((url) => {
      if (active && url) {
        setModelUrl(url);
      }
    });
    return () => { active = false; };
  }, []);

  const dpr = useMemo(() => {
    const ratio = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    return [1, Math.min(ratio, 1.5)];
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 0.8, 5.0], fov: 50 }}
      style={{ width: "100%", height: "100%", background: "transparent" }}
      dpr={dpr}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
        stencil: false,
        depth: true,
      }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow={false} />
      <pointLight position={[-3, 2, 2]} intensity={1.5} color="#ffa116" />
      <pointLight position={[3, -1, 2]} intensity={0.6} color="#ff6d00" />

      <Suspense fallback={null}>
        <NinjaModel url={modelUrl} />
        <Environment preset="night" />
      </Suspense>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={false}
        enableDamping={true}
        dampingFactor={0.05}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.6}
      />
    </Canvas>
  );
}

/* ── Matrix Rain Canvas (tuned speed & frequency) ────────────────────────── */
function MatrixRain() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const FONT_SIZE = 15;
    const getColumns = () => Math.floor(canvas.width / FONT_SIZE);

    let columns = getColumns();
    // Slightly reduced frequency by starting columns with wider random negative offsets
    let drops = Array.from({ length: columns }, () => Math.random() * -70);

    const draw = () => {
      // Fade trail
      ctx.fillStyle = "rgba(5, 5, 5, 0.065)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      columns = getColumns();
      while (drops.length < columns) drops.push(Math.random() * -70);

      for (let i = 0; i < drops.length; i++) {
        const char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
        const x = i * FONT_SIZE;
        const y = drops[i] * FONT_SIZE;

        // Leading character — brighter gold
        const intensity = Math.random();
        if (intensity > 0.91) {
          ctx.fillStyle = `rgba(255, 235, 120, ${0.9 + Math.random() * 0.1})`; // gold head
        } else if (intensity > 0.68) {
          ctx.fillStyle = `rgba(255, 161, 22, ${0.55 + Math.random() * 0.3})`; // vibrant orange mid
        } else {
          ctx.fillStyle = `rgba(255, 110, 0, ${0.15 + Math.random() * 0.2})`; // amber tail
        }

        ctx.font = `${FONT_SIZE}px 'Noto Sans JP', 'MS Gothic', monospace`;
        ctx.fillText(char, x, y);

        // Reset column at slightly reduced frequency
        if (y > canvas.height && Math.random() > 0.982) {
          drops[i] = 0;
        }
        // Slightly reduced speed (fast, but controlled: 0.42 to 0.65)
        drops[i] += 0.42 + Math.random() * 0.23;
      }
    };

    const interval = setInterval(draw, 50);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="sc-matrix-canvas"
      aria-hidden="true"
    />
  );
}

/* ── Floating ambient particle ───────────────────────────────────────────── */
function Particle({ style }) {
  return <div className="sc-particle" style={style} />;
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function ShadowCodePage() {
  const navigate = useNavigate();
  const [revealed, setRevealed] = useState(false);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const generated = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 6}s`,
      animationDuration: `${6 + Math.random() * 8}s`,
      width: `${2 + Math.random() * 4}px`,
      height: `${2 + Math.random() * 4}px`,
      opacity: 0.1 + Math.random() * 0.3,
    }));
    setParticles(generated);
  }, []);

  const handleEnterDojo = () => navigate("/shadow-code/dojo");

  return (
    <div className="sc-landing">
      {/* Matrix rain canvas background */}
      <MatrixRain />

      {/* Fog layers */}
      <div className="sc-fog sc-fog-1" />
      <div className="sc-fog sc-fog-2" />
      <div className="sc-fog sc-fog-3" />

      {/* Floating particles */}
      {particles.map((p) => (
        <Particle
          key={p.id}
          style={{
            left: p.left,
            width: p.width,
            height: p.height,
            opacity: p.opacity,
            animationDelay: p.animationDelay,
            animationDuration: p.animationDuration,
          }}
        />
      ))}

      {/* Radial glow behind ninja */}
      <div className="sc-ninja-glow" />

      {/* Main content layout */}
      <div className={`sc-content ${revealed ? "sc-content-visible" : ""}`}>

        {/* 3D Ninja — full left column */}
        <div className="sc-ninja-wrapper">
          <Suspense fallback={<FallbackNinja />}>
            <NinjaScene />
          </Suspense>
          <div className="sc-ninja-shadow" />
        </div>

        {/* Text story — right column */}
        <div className="sc-story">
          <div className="sc-eyebrow">
            <span className="sc-dot" />
            Mystery Dojo
            <span className="sc-dot" />
          </div>

          <h1 className="sc-headline">
            You feel bored by attempting
            <br />
            <span className="sc-headline-accent">regular style questions?</span>
          </h1>

          <p className="sc-subtext">
            Enter the Mystery Dojo — where questions wear masks and every challenge
            <br />
            is a surprise. No patterns. No comfort zones. Only your instinct and skill.
          </p>

          <button
            id="enter-dojo-btn"
            className="sc-enter-btn"
            onClick={handleEnterDojo}
          >
            <span className="sc-enter-btn-glow" />
            <span className="sc-enter-icon">⚔</span>
            Enter Dojo
          </button>

          <p className="sc-disclaimer">
            10 categories of surprise challenges await inside.
          </p>

          {/* Next section hint */}
          <button className="sc-scroll-hint" onClick={handleEnterDojo} aria-label="Enter dojo">
            <span className="sc-scroll-hint-label">Enter the Dojo</span>
            <div className="sc-scroll-arrow">
              <div className="sc-scroll-arrow-icon" />
            </div>
          </button>
        </div>
      </div>

      {/* Bottom vignette */}
      <div className="sc-vignette-bottom" />
    </div>
  );
}
