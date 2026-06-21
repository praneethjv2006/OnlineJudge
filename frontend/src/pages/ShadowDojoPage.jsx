import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import {
  Maximize2,
  RotateCcw,
  Play,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  Code2,
  HelpCircle,
  ArrowLeft,
} from "lucide-react";

import {
  LANG_OPTIONS,
  LANG_STARTERS,
  pickChallenge,
} from "../data/dojoChallenges";

import CategoryBadge from "../components/dojo/CategoryBadge";
import CategoryInfoModal from "../components/dojo/CategoryInfoModal";
import ChoiceUI from "../components/dojo/ChoiceUI";
import InteractiveUI from "../components/dojo/InteractiveUI";
import PredictUI from "../components/dojo/PredictUI";

// ─── Ninja motivation quotes for the intro ────────────────────────────────────
const NINJA_QUOTES = [
  { text: "The blade is sharpened in silence.", sub: "— Shadow Proverb" },
  { text: "True skill reveals itself under pressure.", sub: "— Master Kaze" },
  { text: "A ninja's mind is the deadliest weapon.", sub: "— Ancient Scroll" },
  { text: "In darkness, the prepared warrior thrives.", sub: "— Grand Master Hiro" },
  { text: "Every mystery conquered is a step toward mastery.", sub: "— Dojo Creed" },
];

// ─── Main Dojo Page ───────────────────────────────────────────────────────────
export default function ShadowDojoPage() {
  const navigate = useNavigate();

  // Phase: intro → reveal → challenge → result
  const [phase, setPhase] = useState("intro");
  const [challenge, setChallenge] = useState(null);
  const [revealStep, setRevealStep] = useState(0);

  // Editor state
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState("");

  // Run/submit state
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [showCategoryInfo, setShowCategoryInfo] = useState(false);

  // Result state
  const [finalResult, setFinalResult] = useState(null);

  // Quote for intro
  const [quote] = useState(() => NINJA_QUOTES[Math.floor(Math.random() * NINJA_QUOTES.length)]);

  // Sync editor code when language or challenge changes
  useEffect(() => {
    if (!challenge) return;
    if (challenge.starterCode === null) return;
    const templates = challenge.starterCode;
    setCode(templates[language] || LANG_STARTERS[language]);
  }, [language, challenge]);

  const handleFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  const handleStart = () => {
    // Enter fullscreen first
    handleFullscreen();

    const picked = pickChallenge();
    setChallenge(picked);
    setRevealStep(0);
    setPhase("reveal");
    setRunResult(null);
    setShowHint(false);
    setShowCategoryInfo(false);
    setFinalResult(null);

    // Animate reveal steps
    setTimeout(() => setRevealStep(1), 600);
    setTimeout(() => setRevealStep(2), 1400);
    setTimeout(() => {
      setPhase("challenge");
      if (picked.starterCode) {
        setCode(picked.starterCode[language] || LANG_STARTERS[language]);
      }
    }, 2600);
  };

  const handleRun = async () => {
    if (!challenge) return;
    setIsRunning(true);
    setRunResult(null);

    // Simulate run for front-end demo
    await new Promise((res) => setTimeout(res, 1200 + Math.random() * 800));

    if (challenge.uiType === "blind") {
      // Random result for demo — in production, connect to backend
      const passed = Math.random() > 0.4;
      setRunResult({ verdict: passed ? "Accepted" : "Wrong Answer", blind: true });
    } else {
      setRunResult({
        verdict: "Accepted",
        stdout: "Output matches expected.",
        stderr: "",
      });
    }

    setIsRunning(false);
  };

  const handleResult = (correct) => {
    setFinalResult(correct);
    setPhase("result");
  };

  const handleReset = () => {
    setPhase("intro");
    setChallenge(null);
    setRunResult(null);
    setFinalResult(null);
    setRevealStep(0);
    setShowHint(false);
    setShowCategoryInfo(false);
  };

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="dojo-fullscreen dojo-intro">
        <div className="dojo-intro-fog" />
        <div className="dojo-intro-particles">
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              className="dojo-intro-particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${4 + Math.random() * 6}s`,
              }}
            />
          ))}
        </div>

        <div className="dojo-intro-content">
          <div className="dojo-intro-badge">
            <span>⚔</span> Mystery Dojo
          </div>
          <h1 className="dojo-intro-title">
            <span className="dojo-title-shadow">Shadow</span>
            <span className="dojo-title-code">Code</span>
          </h1>

          {/* Ninja motivation quote */}
          <div className="dojo-intro-quote">
            <p className="dojo-quote-text">"{quote.text}"</p>
            <span className="dojo-quote-attr">{quote.sub}</span>
          </div>

          <p className="dojo-intro-sub">
            Sharpen your mind. A mystery challenge awaits — its nature unknown.
          </p>

          <div className="dojo-intro-actions">
            <button className="dojo-start-btn" id="dojo-start-btn" onClick={handleStart}>
              <span className="dojo-start-glow" />
              <Play size={20} />
              Begin
            </button>
          </div>
        </div>

        <button className="dojo-back-btn" onClick={() => navigate("/shadow-code")}>
          <ArrowLeft size={16} /> Back
        </button>
      </div>
    );
  }

  // ── REVEAL ─────────────────────────────────────────────────────────────────
  if (phase === "reveal") {
    return (
      <div className="dojo-fullscreen dojo-reveal">
        <div className="dojo-reveal-content">
          {revealStep >= 1 && (
            <div className={`dojo-reveal-label ${revealStep >= 1 ? "visible" : ""}`}>
              Your challenge category is...
            </div>
          )}
          {revealStep >= 2 && challenge && (
            <div className="dojo-reveal-category">
              <div
                className="dojo-reveal-icon"
                style={{ "--cat-color": challenge.color }}
              >
                {challenge.icon}
              </div>
              <div className="dojo-reveal-name" style={{ color: challenge.color }}>
                {challenge.category}
              </div>
              <div className="dojo-reveal-desc">{challenge.categoryShort}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── RESULT ─────────────────────────────────────────────────────────────────
  if (phase === "result") {
    return (
      <div className="dojo-fullscreen dojo-result">
        <div className="dojo-result-content">
          <div className={`dojo-result-icon ${finalResult ? "pass" : "fail"}`}>
            {finalResult ? (
              <CheckCircle2 size={64} />
            ) : (
              <XCircle size={64} />
            )}
          </div>
          <h2 className={`dojo-result-title ${finalResult ? "pass" : "fail"}`}>
            {finalResult ? "Challenge Conquered!" : "The Shadow Wins This Round"}
          </h2>
          <p className="dojo-result-category">{challenge?.category}</p>
          {!finalResult && challenge?.hint && (
            <div className="dojo-result-hint">
              <strong>Insight:</strong> {challenge.hint}
            </div>
          )}
          <div className="dojo-result-actions">
            <button className="dojo-start-btn" onClick={handleReset}>
              <RotateCcw size={16} /> Try Another
            </button>
            <button className="dojo-back-btn-large" onClick={() => navigate("/shadow-code")}>
              Exit Dojo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── CHALLENGE ──────────────────────────────────────────────────────────────
  const isEditorChallenge = challenge?.uiType === "blind" || challenge?.uiType === "debug";
  const isChoiceChallenge = challenge?.uiType === "choices";
  const isPredictChallenge = challenge?.uiType === "predict";
  const isInteractiveChallenge = challenge?.uiType === "interactive";

  return (
    <div className="dojo-fullscreen dojo-workspace">
      {/* Category Info Modal */}
      {showCategoryInfo && challenge && (
        <CategoryInfoModal
          challenge={challenge}
          onClose={() => setShowCategoryInfo(false)}
        />
      )}

      {/* Header */}
      <header className="dojo-header">
        <div className="dojo-header-left">
          <button className="dojo-back-small" onClick={handleReset}>
            <ArrowLeft size={14} />
          </button>
          {challenge && (
            <CategoryBadge
              challenge={challenge}
              onInfoClick={() => setShowCategoryInfo(true)}
            />
          )}
        </div>

        <div className="dojo-header-right">
          {isEditorChallenge && (
            <>
              <div className="dojo-lang-picker">
                <Code2 size={13} color="var(--accent)" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="dojo-lang-select"
                >
                  {LANG_OPTIONS.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className={`dojo-run-btn ${isRunning ? "loading" : ""}`}
                onClick={handleRun}
                disabled={isRunning}
                id="dojo-run-btn"
              >
                {isRunning ? <Loader2 size={14} className="anim-spin" /> : <Play size={14} />}
                Run
              </button>

              <button
                className="dojo-submit-btn"
                onClick={() => handleResult(runResult?.verdict === "Accepted")}
                disabled={!runResult || isRunning}
                id="dojo-submit-btn"
              >
                <Send size={14} />
                Submit
              </button>
            </>
          )}

          <button
            className="dojo-hint-btn"
            onClick={() => setShowHint((v) => !v)}
            title="Reveal hint"
          >
            <HelpCircle size={14} />
            {showHint ? "Hide Hint" : "Hint"}
          </button>

          <button className="dojo-fs-btn-small" onClick={handleFullscreen}>
            <Maximize2 size={14} />
          </button>
        </div>
      </header>

      {/* Hint bar */}
      {showHint && challenge?.hint && (
        <div className="dojo-hint-bar">
          <span className="dojo-hint-label">💡 Hint:</span> {challenge.hint}
        </div>
      )}

      {/* Main area */}
      <main className="dojo-main">
        {/* Left: description */}
        <div className="dojo-left-panel">
          <div className="dojo-problem-header">
            <div className="dojo-problem-cat" style={{ color: challenge?.color }}>
              {challenge?.icon} {challenge?.category}
            </div>
          </div>
          <div
            className="dojo-problem-body"
            dangerouslySetInnerHTML={{
              __html: challenge?.description
                ? challenge.description
                    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                    .replace(/\*(.*?)\*/g, "<em>$1</em>")
                    .replace(/`([^`]+)`/g, "<code>$1</code>")
                    .replace(/```[\w]*\n([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
                    .replace(/\n/g, "<br/>")
                : "",
            }}
          />
        </div>

        <div className="dojo-divider" />

        {/* Right: editor / special UI */}
        <div className="dojo-right-panel">
          {isEditorChallenge && (
            <>
              <div className="dojo-editor-wrapper">
                <Editor
                  height="100%"
                  language={
                    language === "cpp"
                      ? "cpp"
                      : language === "javascript"
                      ? "javascript"
                      : language === "python"
                      ? "python"
                      : "c"
                  }
                  theme="vs-dark"
                  value={code}
                  onChange={(val) => setCode(val || "")}
                  options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  }}
                />
              </div>

              {/* Run result */}
              {runResult && (
                <div
                  className={`dojo-run-result ${
                    runResult.verdict === "Accepted" ? "pass" : "fail"
                  }`}
                >
                  {runResult.verdict === "Accepted" ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <XCircle size={16} />
                  )}
                  <strong>{runResult.verdict}</strong>
                  {runResult.blind && (
                    <span className="dojo-blind-note">
                      (Test cases are hidden in this challenge)
                    </span>
                  )}
                  {runResult.stdout && !runResult.blind && (
                    <span>{runResult.stdout}</span>
                  )}
                </div>
              )}
            </>
          )}

          {isChoiceChallenge && (
            <div className="dojo-special-ui">
              <ChoiceUI challenge={challenge} onResult={handleResult} />
            </div>
          )}

          {isPredictChallenge && (
            <div className="dojo-special-ui">
              <PredictUI challenge={challenge} onResult={handleResult} />
            </div>
          )}

          {isInteractiveChallenge && (
            <div className="dojo-special-ui">
              <InteractiveUI onResult={handleResult} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
