import { Suspense, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations, Environment, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// ─── 3D Model Configuration (Tweak values here) ─────────────────────────────
const NINJA_SCALE = 2.5;             // Size/scale of the 3D model
const NINJA_ANIMATION_SPEED = 0.9;  // Speed of the animation (1.0 = normal, smaller = slower)
const NINJA_PAUSE_SECONDS = 0;     // Seconds to pause before restarting the animation

/* ── GLB Ninja Model with animations ────────────────────────────────────── */
function NinjaModel({ url }) {
  const groupRef = useRef();
  const { scene, animations } = useGLTF(url);
  const { actions, names } = useAnimations(animations, groupRef);

  // Play the first available animation slower, with a pause before loops
  useEffect(() => {
    if (names.length > 0) {
      const action = actions[names[0]];
      if (action) {
        action.reset().play();
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
        action.timeScale = NINJA_ANIMATION_SPEED; // Slow down the animation speed

        const mixer = action.getMixer();
        const handleFinished = (e) => {
          if (e.action === action) {
            setTimeout(() => {
              if (action) {
                action.reset().play();
              }
            }, NINJA_PAUSE_SECONDS * 1000); // Wait configured seconds before repeating the animation
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

  // Gentle idle float only when no animations exist to avoid overlapping rotations
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

/* ── Fallback SVG ninja when GLB is loading ─────────────────────────────── */
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

/* ── 3D Canvas scene ─────────────────────────────────────────────────────── */
function NinjaScene() {
  return (
    <Canvas
      camera={{ position: [0, 0.8, 5.0], fov: 50 }}
      style={{ width: "100%", height: "100%", background: "transparent" }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        castShadow={false}
      />
      {/* Accent orange point light to match theme */}
      <pointLight position={[-3, 2, 2]} intensity={1.5} color="#ffa116" />
      <pointLight position={[3, -1, 2]} intensity={0.6} color="#ff6d00" />

      <Suspense fallback={null}>
        <NinjaModel url="/ninja_animation.glb" />
        <Environment preset="night" />
      </Suspense>

      {/* Manual rotation controls — autoRotate disabled */}
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

/* ── Floating ambient particle ───────────────────────────────────────────── */
function Particle({ style }) {
  return <div className="sc-particle" style={style} />;
}

const KANJI = ["忍", "道", "影", "闇", "剣", "謎", "力", "術"];

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function ShadowCodePage() {
  const navigate = useNavigate();
  const [revealed, setRevealed] = useState(false);
  const [particles, setParticles] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const generated = Array.from({ length: 28 }, (_, i) => ({
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
    <div className="sc-landing" ref={containerRef}>
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

      {/* Kanji watermarks */}
      <div className="sc-kanji-bg" aria-hidden="true">
        {KANJI.map((k, i) => (
          <span
            key={i}
            className="sc-kanji"
            style={{
              left: `${8 + i * 12}%`,
              top: `${10 + (i % 3) * 30}%`,
              animationDelay: `${i * 0.5}s`,
              fontSize: `${3 + (i % 3) * 1.5}rem`,
            }}
          >
            {k}
          </span>
        ))}
      </div>

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
        </div>
      </div>

      {/* Bottom vignette */}
      <div className="sc-vignette-bottom" />
    </div>
  );
}
