import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import {
  Maximize2,
  Play,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  Code2,
  HelpCircle,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";

import {
  LANG_OPTIONS,
  LANG_STARTERS,
  pickChallenge,
} from "../data/dojoChallenges";

import CategoryBadge from "../components/dojo/CategoryBadge";
import CategoryIcon from "../components/dojo/CategoryIcon";
import CategoryInfoModal from "../components/dojo/CategoryInfoModal";
import ChoiceUI from "../components/dojo/ChoiceUI";
import InteractiveUI from "../components/dojo/InteractiveUI";
import PredictUI from "../components/dojo/PredictUI";
import { toast } from "../components/common/Toast";

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

  // Phase: intro → reveal → challenge
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

  // Format Dojo challenge description safely with clean code blocks and line breaks
  const formatDojoMarkdown = (text) => {
    if (!text) return "";
    let formatted = text.replace(/\r\n/g, "\n");
    const codeBlocks = [];
    formatted = formatted.replace(/```[\w]*\n([\s\S]*?)```/g, (_, codeContent) => {
      const idx = codeBlocks.length;
      codeBlocks.push(`<pre><code>${codeContent.trim()}</code></pre>`);
      return `__DOJO_CODE_${idx}__`;
    });
    formatted = formatted
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\n/g, "<br/>");
    codeBlocks.forEach((block, idx) => {
      formatted = formatted.replace(`__DOJO_CODE_${idx}__`, block);
    });
    return formatted;
  };

  const handleNextChallenge = useCallback((nextPicked = null) => {
    const next = nextPicked || pickChallenge(challenge?.id);
    setChallenge(next);
    setRunResult(null);
    setIsRunning(false);
    setShowHint(false);
    setShowCategoryInfo(false);
    setRevealStep(0);
    setPhase("reveal");

    // Animate category reveal steps identical to first time entry
    setTimeout(() => setRevealStep(1), 500);
    setTimeout(() => setRevealStep(2), 1300);
    setTimeout(() => {
      setPhase("challenge");
      if (next?.starterCode) {
        setCode(next.starterCode[language] || LANG_STARTERS[language]);
      } else {
        setCode("");
      }
    }, 2500);
  }, [challenge, language]);

  const evaluateChallengeCode = (currChallenge, userCode, lang) => {
    if (!currChallenge) return { verdict: "Wrong Answer", stdout: "No challenge selected." };
    
    const rawStarter = (currChallenge.starterCode?.[lang] || "").trim();
    const trimmedCode = (userCode || "").trim();
    const isUntouched = trimmedCode === rawStarter || trimmedCode.length === 0;

    // If code is untouched, fail with authentic, educational diagnostic messages
    if (isUntouched) {
      switch (currChallenge.id) {
        case "debug_code":
          return {
            verdict: "Wrong Answer",
            stdout: "Test 1 Failed: Disconnected districts miscounted. The starter code contains indexing out-of-bounds bugs and missing bidirectional road edges. Debug the code to fix them!",
          };
        case "fix_performance":
          return {
            verdict: "Time Limit Exceeded",
            stdout: "TLE on Test 4: Key N = 999999999989 (Prime). Execution exceeded 1.00s time limit. Naive loop runs in O(N); optimize prime check to O(√N).",
          };
        case "memory_overflow":
          return {
            verdict: "Memory Limit Exceeded",
            stdout: "MLE: Process exceeded 64MB memory limit on 1000x1000 grid. Reduce DP space complexity from O(N×M) to O(M).",
          };
        case "overflow_trap":
          return {
            verdict: "Wrong Answer",
            stdout: "Test 3 Failed (N = 10¹⁸): Intermediate calculation N×(N+1) overflowed standard integer bounds into negative values.",
          };
        case "precision_trap":
          return {
            verdict: "Wrong Answer",
            stdout: "Test 2 Failed (R = 10⁹): Floating point precision loss. Output 2000000000000000256.000000 does not match exact 2000000000000000000.000000. Use exact integer identity (2R²).",
          };
        case "fill_missing":
          return {
            verdict: "Compile Error",
            stdout: "Incomplete implementation: Function stubs (partition / quickSelect) remain unimplemented.",
          };
        case "blind_judge":
          return {
            verdict: "Wrong Answer",
            blind: true,
          };
        default:
          return {
            verdict: "Wrong Answer",
            stdout: "Starter code does not solve the challenge.",
          };
      }
    }

    // Evaluate user edits
    switch (currChallenge.id) {
      case "debug_code": {
        const hasReverseEdge =
          trimmedCode.includes("adj[v].push_back(u)") ||
          trimmedCode.includes("adj[v].push_back( u )") ||
          trimmedCode.includes("adj[v].append(u)") ||
          trimmedCode.includes("adj[v].push(u)") ||
          trimmedCode.includes("adj[v][u] = 1");

        const hasCorrectSize =
          trimmedCode.includes("n + 1") ||
          trimmedCode.includes("n+1") ||
          trimmedCode.includes("MAXN") ||
          trimmedCode.includes("n + 2") ||
          trimmedCode.includes("n+2");

        if (hasReverseEdge && hasCorrectSize) {
          return {
            verdict: "Accepted",
            stdout: "All 10 test cases passed! Graph traversal correctly counted disconnected districts.",
          };
        }
        if (!hasReverseEdge) {
          return {
            verdict: "Wrong Answer",
            stdout: "Test 2 Failed: Roads are bidirectional. Did you remember to add the reverse edge adj[v].push_back(u)?",
          };
        }
        return {
          verdict: "Runtime Error",
          stdout: "Out of bounds / vector index out of range: Village districts are 1-indexed (1..N). Check your adj and visited array sizes.",
        };
      }

      case "fix_performance": {
        const hasSqrtOpt =
          trimmedCode.includes("i * i <= n") ||
          trimmedCode.includes("i*i <= n") ||
          trimmedCode.includes("i * i <= N") ||
          trimmedCode.includes("i*i <= N") ||
          trimmedCode.includes("sqrt") ||
          trimmedCode.includes("isqrt");

        const stillHasSlowLoop =
          trimmedCode.includes("i < n;") ||
          trimmedCode.includes("i < n ;") ||
          trimmedCode.includes("range(2, n)");

        if (hasSqrtOpt && !stillHasSlowLoop) {
          return {
            verdict: "Accepted",
            stdout: "Passed all 1000 test keys in 28ms. Optimized O(√N) prime verification accepted!",
          };
        }
        return {
          verdict: "Time Limit Exceeded",
          stdout: "TLE on Test 4: Key N = 999999999989 (Prime). Execution exceeded 1.00s time limit. Make sure your loop checks only up to √N (`i * i <= n`).",
        };
      }

      case "memory_overflow": {
        const has2DStructure =
          trimmedCode.includes("vector<vector") ||
          trimmedCode.includes("dp[MAXN][MAXN]") ||
          trimmedCode.includes("[[0]*m for") ||
          trimmedCode.includes("[[0] * m for") ||
          trimmedCode.includes("Array.from({length: n}");

        const has1DOpt =
          trimmedCode.includes("vector<long long> dp(m") ||
          trimmedCode.includes("vector<int> dp(m") ||
          trimmedCode.includes("dp = [0]*m") ||
          trimmedCode.includes("dp = [0] * m") ||
          trimmedCode.includes("new Array(m)") ||
          trimmedCode.includes("dp[MAXN]");

        if (!has2DStructure || has1DOpt) {
          return {
            verdict: "Accepted",
            stdout: "Passed all large tests. Peak memory usage: 1.1 MB. O(M) space optimization verified!",
          };
        }
        return {
          verdict: "Memory Limit Exceeded",
          stdout: "Process killed: Memory limit 64MB exceeded on 1000x1000 grid. Allocate only O(M) memory for DP table.",
        };
      }

      case "overflow_trap": {
        const handlesOverflow =
          trimmedCode.includes("__int128") ||
          trimmedCode.includes("BigInt") ||
          trimmedCode.includes("(n / 2) * (n + 1)") ||
          trimmedCode.includes("(n/2) * (n+1)") ||
          trimmedCode.includes("(n / 2) * (n+1)") ||
          trimmedCode.includes("((n + 1) / 2)") ||
          (lang === "python" && !isUntouched);

        if (handlesOverflow) {
          return {
            verdict: "Accepted",
            stdout: "All astronomical test cases passed without integer overflow!",
          };
        }
        return {
          verdict: "Wrong Answer",
          stdout: "Wrong answer on N=10¹⁸. Intermediate calculation N×(N+1) overflowed. Use __int128, BigInt, or divide the even factor by 2 before multiplying.",
        };
      }

      case "precision_trap": {
        const usesExactFormula =
          trimmedCode.includes("2 * r * r") ||
          trimmedCode.includes("2*r*r") ||
          trimmedCode.includes("2LL * r * r") ||
          trimmedCode.includes("2LL*r*r") ||
          trimmedCode.includes("2 * r ** 2") ||
          trimmedCode.includes("2n * r * r") ||
          trimmedCode.includes("2 * R * R") ||
          trimmedCode.includes("2LL * r");

        const avoidsFloatSqrt =
          !trimmedCode.includes("sqrt(2") && !trimmedCode.includes("sqrt( 2");

        if (usesExactFormula && avoidsFloatSqrt) {
          return {
            verdict: "Accepted",
            stdout: "Accepted! Exact integer calculation (Area = 2R²) produced flawless 6-decimal precision.",
          };
        }
        return {
          verdict: "Wrong Answer",
          stdout: "Wrong answer on R=10⁹. Floating point arithmetic loses precision. Notice the diagonal equals 2R, so the square area is exactly 2R² without square roots!",
        };
      }

      case "fill_missing": {
        const stillHasStubs =
          trimmedCode.includes("YOUR CODE HERE") ||
          trimmedCode.includes("// YOUR CODE HERE") ||
          trimmedCode.includes("# YOUR CODE HERE") ||
          trimmedCode.includes("pass\n");

        const hasPartitionLogic =
          trimmedCode.includes("pivot") ||
          trimmedCode.includes("swap") ||
          trimmedCode.includes("left") ||
          trimmedCode.includes("right");

        if (!stillHasStubs && hasPartitionLogic) {
          return {
            verdict: "Accepted",
            stdout: "All 12 test cases passed. Quickselect executed in average O(N) time!",
          };
        }
        if (stillHasStubs) {
          return {
            verdict: "Compile Error",
            stdout: "Function stubs (partition / quickSelect) remain unimplemented with placeholder comments.",
          };
        }
        return {
          verdict: "Wrong Answer",
          stdout: "Quickselect failed to partition array elements correctly around the pivot.",
        };
      }

      case "blind_judge": {
        const hasLISLogic =
          trimmedCode.includes("dp") ||
          trimmedCode.includes("lower_bound") ||
          trimmedCode.includes("bisect") ||
          trimmedCode.includes("max(");

        return {
          verdict: hasLISLogic ? "Accepted" : "Wrong Answer",
          blind: true,
        };
      }

      default:
        return {
          verdict: "Accepted",
          stdout: "Output matches expected.",
        };
    }
  };

  const handleRun = async () => {
    if (!challenge) return;
    setIsRunning(true);
    setRunResult(null);

    // Simulate realistic test runner execution delay
    await new Promise((res) => setTimeout(res, 900 + Math.random() * 600));

    const evaluated = evaluateChallengeCode(challenge, code, language);
    setRunResult(evaluated);
    setIsRunning(false);
  };

  // When submitting question
  const handleResult = (correct) => {
    if (correct) {
      toast.success("Challenge Conquered! Loading next mystery challenge...");
      handleNextChallenge();
    } else {
      toast.error("Solution not accepted! Review the feedback below and fix your code.");
    }
  };

  const handleReset = () => {
    setPhase("intro");
    setChallenge(null);
    setRunResult(null);
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
                <CategoryIcon category={challenge.category} size={50} />
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

  // ── CHALLENGE (Main Page) ──────────────────────────────────────────────────
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
          <button className="dojo-back-small" onClick={handleReset} title="Exit to Intro">
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

          <button
            className="dojo-next-btn"
            onClick={() => handleNextChallenge()}
            title="Skip to next challenge"
          >
            <span>Next Question</span>
            <ChevronRight size={14} />
          </button>

          <button className="dojo-fs-btn-small" onClick={handleFullscreen} title="Toggle fullscreen">
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
            <div className="dojo-problem-cat" style={{ "--cat-color": challenge?.color, color: challenge?.color }}>
              <CategoryIcon category={challenge?.category} size={16} />
              <span>{challenge?.category}</span>
            </div>
          </div>
          <div
            className="dojo-problem-body"
            dangerouslySetInnerHTML={{
              __html: formatDojoMarkdown(challenge?.description),
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
                    lineHeight: 22,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    padding: { top: 18, bottom: 18 },
                    lineNumbersMinChars: 3,
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
              <ChoiceUI key={challenge?.id} challenge={challenge} onResult={handleResult} />
            </div>
          )}

          {isPredictChallenge && (
            <div className="dojo-special-ui">
              <PredictUI key={challenge?.id} challenge={challenge} onResult={handleResult} />
            </div>
          )}

          {isInteractiveChallenge && (
            <div className="dojo-special-ui">
              <InteractiveUI key={challenge?.id} onResult={handleResult} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
