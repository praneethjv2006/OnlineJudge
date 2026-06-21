import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ── Animated Ninja SVG with multiple keyframe-driven parts ─────────────── */
function AnimatedNinja() {
  return (
    <svg
      className="ninja-figure"
      viewBox="0 0 240 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Ground shadow */}
      <ellipse cx="120" cy="360" rx="55" ry="8" fill="#ffa116" opacity="0.08" className="ninja-ground-pulse" />

      {/* Cloak / body */}
      <path
        d="M120 135 Q85 175 78 230 Q72 280 85 320 L120 330 L155 320 Q168 280 162 230 Q155 175 120 135Z"
        fill="#0d0d0d"
        stroke="#1a1a1a"
        strokeWidth="1"
        className="ninja-body-breathe"
      />
      {/* Inner cloak fold lines */}
      <path d="M100 200 Q110 250 105 310" stroke="#1a1a1a" strokeWidth="1.5" opacity="0.4" fill="none" />
      <path d="M140 200 Q130 250 135 310" stroke="#1a1a1a" strokeWidth="1.5" opacity="0.4" fill="none" />

      {/* Head */}
      <circle cx="120" cy="105" r="30" fill="#111" className="ninja-head-bob" />
      {/* Mask wrapping */}
      <path d="M90 113 Q120 130 150 113 L150 100 Q120 117 90 100 Z" fill="#151515" />
      {/* Headband */}
      <path d="M90 92 Q120 82 150 92" stroke="#ffa116" strokeWidth="3.5" fill="none" strokeLinecap="round" className="ninja-headband-glow" />
      {/* Headband tail flowing */}
      <path d="M150 92 Q165 95 178 88 Q188 80 195 85" stroke="#ffa116" strokeWidth="2.5" fill="none" strokeLinecap="round" className="ninja-scarf-flow" />
      <path d="M150 92 Q162 100 172 98 Q180 95 185 100" stroke="#ffa116" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" className="ninja-scarf-flow-2" />

      {/* Eyes - glowing slit */}
      <rect x="101" y="100" width="38" height="5" rx="2.5" fill="#ffa116" opacity="0.9" className="ninja-eye-glow" />
      {/* Eye glow aura */}
      <ellipse cx="120" cy="102" rx="22" ry="6" fill="#ffa116" opacity="0.15" className="ninja-eye-aura" />

      {/* Left arm holding katana — raised */}
      <line x1="90" y1="180" x2="50" y2="140" stroke="#0d0d0d" strokeWidth="14" strokeLinecap="round" />
      {/* Katana blade */}
      <line x1="50" y1="140" x2="18" y2="80" stroke="#c0c0c0" strokeWidth="2.5" strokeLinecap="round" className="ninja-blade-gleam" />
      <line x1="18" y1="80" x2="12" y2="65" stroke="#e8e8e8" strokeWidth="1.5" strokeLinecap="round" />
      {/* Katana guard (tsuba) */}
      <ellipse cx="50" cy="140" rx="6" ry="3" fill="#444" stroke="#666" strokeWidth="1" transform="rotate(-35 50 140)" />
      {/* Katana handle */}
      <line x1="50" y1="140" x2="58" y2="155" stroke="#2a1a0a" strokeWidth="4" strokeLinecap="round" />

      {/* Right arm — ready stance */}
      <line x1="150" y1="180" x2="180" y2="210" stroke="#0d0d0d" strokeWidth="14" strokeLinecap="round" />
      {/* Shuriken in right hand */}
      <g transform="translate(180, 210)" className="ninja-shuriken-spin">
        <polygon points="0,-8 3,-3 8,0 3,3 0,8 -3,3 -8,0 -3,-3" fill="#888" stroke="#aaa" strokeWidth="0.5" />
      </g>

      {/* Left leg */}
      <line x1="105" y1="328" x2="85" y2="350" stroke="#0d0d0d" strokeWidth="14" strokeLinecap="round" />
      {/* Right leg — slight stance */}
      <line x1="135" y1="328" x2="152" y2="350" stroke="#0d0d0d" strokeWidth="14" strokeLinecap="round" />

      {/* Energy particles around ninja */}
      <circle cx="45" cy="120" r="2" fill="#ffa116" opacity="0.6" className="ninja-spark-1" />
      <circle cx="195" cy="150" r="1.5" fill="#ffa116" opacity="0.5" className="ninja-spark-2" />
      <circle cx="30" cy="200" r="1.5" fill="#ffa116" opacity="0.4" className="ninja-spark-3" />
      <circle cx="210" cy="100" r="2" fill="#ffa116" opacity="0.3" className="ninja-spark-4" />
    </svg>
  );
}

function Particle({ style }) {
  return <div className="sc-particle" style={style} />;
}

const KANJI = ["忍", "道", "影", "闇", "剣", "謎", "力", "術"];

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

  const handleEnterDojo = () => {
    navigate("/shadow-code/dojo");
  };

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

      {/* Content */}
      <div className={`sc-content ${revealed ? "sc-content-visible" : ""}`}>

        {/* Ninja */}
        <div className="sc-ninja-wrapper">
          <AnimatedNinja />
          <div className="sc-ninja-shadow" />
        </div>

        {/* Text story */}
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
