import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../App";
import { createContest, searchProblems } from "../services/contestService";
import { getErrorMessage } from "../services/api";
import {
  ArrowLeft, ArrowRight, Plus, Trash2, Search, CheckCircle2,
  Clock, Database, Cpu, ChevronDown, ChevronUp, Globe, Lock,
  Calendar, BookOpen, Pencil, X, Check, AlertCircle, Award,
  Sparkles, Layers, ShieldCheck, Zap
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const createTestCase = () => ({ input: "", expectedOutput: "" });

const createNewQuestion = () => ({
  title: "",
  prompt: "",
  timeLimitMs: 2000,
  memoryLimitMb: 256,
  difficulty: "medium",
  tags: "",
  points: 200,
  cognitiveRatings: {
    algorithmicThinking: 1200,
    problemSolving: 1200,
    optimization: 1200,
    edgeCaseAnalysis: 1200,
    speedComplexity: 1200,
  },
  testCases: [createTestCase()],
  _mode: "new",    // "new" | "existing"
  _expanded: true,
});

const DIFF_COLORS = {
  easy:   { bg: "rgba(44,187,93,0.12)",  color: "#2cbb5d", border: "rgba(44,187,93,0.3)" },
  medium: { bg: "rgba(255,161,22,0.12)", color: "#ffa116", border: "rgba(255,161,22,0.3)" },
  hard:   { bg: "rgba(239,71,67,0.12)",  color: "#ef4743", border: "rgba(239,71,67,0.3)" },
};

// ─── Problem Search Modal (LeetCode Library Picker) ───────────────────────────
function ProblemPickerModal({ onSelect, onClose, alreadyAdded }) {
  const [query, setQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [problems, setProblems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    fetchProblems("");
  }, []);

  const fetchProblems = useCallback(async (q) => {
    setIsLoading(true);
    try {
      const data = await searchProblems(q);
      setProblems(data || []);
    } catch {
      setProblems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchProblems(query), 300);
    return () => clearTimeout(t);
  }, [query, fetchProblems]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const filtered = problems
    .filter((p) => !alreadyAdded.includes(p._id))
    .filter((p) => difficultyFilter === "all" || (p.difficulty || "medium").toLowerCase() === difficultyFilter);

  return (
    <div className="cp-modal-overlay" onClick={onClose}>
      <div className="cp-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cp-modal-header">
          <div className="cp-modal-title">
            <Database size={18} style={{ color: "#ffa116" }} />
            <h3>Select from Problem Library</h3>
          </div>
          <button className="cp-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="cp-search-box">
          <Search size={16} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search problems by title, tag, or topic..."
            className="cp-search-input"
          />
          {query && (
            <button
              type="button"
              className="cp-icon-btn"
              onClick={() => setQuery("")}
              style={{ padding: 2 }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="cp-modal-filters">
          {["all", "easy", "medium", "hard"].map((diff) => (
            <button
              key={diff}
              type="button"
              className={`cp-filter-chip ${difficultyFilter === diff ? "active" : ""}`}
              onClick={() => setDifficultyFilter(diff)}
            >
              {diff.charAt(0).toUpperCase() + diff.slice(1)}
            </button>
          ))}
        </div>

        {/* Problem List */}
        <div className="cp-problem-list">
          {isLoading ? (
            <div className="cp-modal-loading">
              <div className="sk-line" style={{ height: 48, borderRadius: 8, background: "rgba(255,255,255,0.05)" }} />
              <div className="sk-line" style={{ height: 48, borderRadius: 8, background: "rgba(255,255,255,0.05)" }} />
              <div className="sk-line" style={{ height: 48, borderRadius: 8, background: "rgba(255,255,255,0.05)" }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="cp-modal-empty">
              <BookOpen size={36} style={{ opacity: 0.25, marginBottom: 10, color: "#aaa" }} />
              <p>No available problems match your criteria.</p>
            </div>
          ) : (
            filtered.map((problem) => {
              const dc = DIFF_COLORS[problem.difficulty] || DIFF_COLORS.medium;
              return (
                <button
                  key={problem._id}
                  className="cp-problem-row"
                  onClick={() => onSelect(problem)}
                >
                  <div className="cp-problem-row-left">
                    <span className="cp-problem-title">{problem.title}</span>
                    <div className="cp-problem-meta">
                      {(problem.tags || []).slice(0, 3).map((t) => (
                        <span key={t} className="cp-problem-tag">{t}</span>
                      ))}
                      <span style={{ fontSize: "0.72rem", color: "#666" }}>
                        {problem.timeLimit || 2000}ms • {problem.memoryLimit || 256}MB
                      </span>
                    </div>
                  </div>
                  <span
                    className="cp-diff-badge"
                    style={{ background: dc.bg, color: dc.color, border: `1px solid ${dc.border}` }}
                  >
                    {problem.difficulty}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Single Question Card (LeetCode Contest Problem Card) ─────────────────────
function QuestionCard({ question, index, onUpdate, onRemove, isAdmin }) {
  const [expanded, setExpanded] = useState(question._expanded !== false);
  const dc = DIFF_COLORS[question.difficulty] || DIFF_COLORS.medium;
  const isExisting = question._mode === "existing";
  const problemLetter = String.fromCharCode(65 + index); // A, B, C, D...

  return (
    <div
      className="cp-q-card"
      style={{ "--q-stripe": dc.color }}
    >
      <div className="cp-q-card-header" onClick={() => setExpanded(!expanded)}>
        <div className="cp-q-card-left">
          <div className="cp-q-badge">
            Problem {problemLetter}
          </div>
          <div className="cp-q-card-info">
            <div className="cp-q-card-title">
              {question.title || <span style={{ color: "#777", fontStyle: "italic" }}>Untitled problem</span>}
            </div>
            <div className="cp-q-card-meta">
              <span
                className="cp-diff-badge-sm"
                style={{ background: dc.bg, color: dc.color, border: `1px solid ${dc.border}` }}
              >
                {question.difficulty}
              </span>
              {isExisting ? (
                <span className="cp-existing-badge">
                  <Database size={10} /> Library
                </span>
              ) : (
                <span className="cp-q-meta-chip">
                  <Pencil size={10} /> Custom
                </span>
              )}
              <span className="cp-q-meta-chip points">
                <Award size={11} /> {question.points || 200} pts
              </span>
              <span className="cp-q-meta-chip">
                <Clock size={11} /> {question.timeLimitMs}ms
              </span>
              <span className="cp-q-meta-chip">
                <Cpu size={11} /> {question.memoryLimitMb}MB
              </span>
              <span className="cp-q-meta-chip">
                {question.testCases?.length || 0} case{question.testCases?.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        <div className="cp-q-card-right">
          <button
            type="button"
            className="cp-icon-btn danger"
            onClick={(e) => { e.stopPropagation(); onRemove(index); }}
            title="Remove problem"
          >
            <Trash2 size={16} />
          </button>
          <div className="cp-expand-icon" style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>
            <ChevronDown size={18} />
          </div>
        </div>
      </div>

      {expanded && (
        <div className="cp-q-card-body">
          {/* For existing library problems */}
          {isExisting ? (
            <div className="cp-existing-info">
              <AlertCircle size={15} style={{ color: "#ffa116", flexShrink: 0, marginTop: 2 }} />
              <p>
                This problem is sourced directly from your library. Title, description, and hidden test cases are managed by the platform.
                You can configure custom execution limits and points below.
              </p>
            </div>
          ) : (
            <>
              <div className="cp-field-row two-col">
                <div className="cp-field">
                  <label className="cp-label">Problem Title *</label>
                  <input
                    className="cp-input"
                    value={question.title}
                    onChange={(e) => onUpdate(index, "title", e.target.value)}
                    placeholder="e.g. Two Sum II - Input Array Is Sorted"
                  />
                </div>
                <div className="cp-field">
                  <label className="cp-label">Difficulty Tier</label>
                  <div className="cp-segmented">
                    {["easy", "medium", "hard"].map((d) => (
                      <button
                        key={d}
                        type="button"
                        className={`cp-seg-btn ${question.difficulty === d ? "active" : ""}`}
                        style={question.difficulty === d ? { background: DIFF_COLORS[d].bg, color: DIFF_COLORS[d].color, borderColor: DIFF_COLORS[d].border } : {}}
                        onClick={() => onUpdate(index, "difficulty", d)}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="cp-field">
                <label className="cp-label">Problem Statement & Constraints *</label>
                <textarea
                  className="cp-textarea"
                  rows={5}
                  value={question.prompt}
                  onChange={(e) => onUpdate(index, "prompt", e.target.value)}
                  placeholder="Describe the task clearly. Include input/output format, sample explanations, and mathematical constraints."
                />
              </div>

              <div className="cp-field">
                <label className="cp-label">
                  Tags <span style={{ color: "#777", fontWeight: 400 }}>(comma-separated)</span>
                </label>
                <input
                  className="cp-input"
                  value={question.tags}
                  onChange={(e) => onUpdate(index, "tags", e.target.value)}
                  placeholder="array, hash-table, two-pointers"
                />
              </div>
            </>
          )}

          {/* Limits & Points (Editable for both library and custom) */}
          <div className="cp-field-row three-col">
            <div className="cp-field">
              <label className="cp-label">
                <Clock size={13} style={{ color: "#ffa116" }} /> Time Limit (ms)
              </label>
              <input
                className="cp-input"
                type="number"
                min="100"
                max="15000"
                step="100"
                value={question.timeLimitMs}
                onChange={(e) => onUpdate(index, "timeLimitMs", Number(e.target.value))}
              />
            </div>
            <div className="cp-field">
              <label className="cp-label">
                <Cpu size={13} style={{ color: "#ffa116" }} /> Memory Limit (MB)
              </label>
              <input
                className="cp-input"
                type="number"
                min="16"
                max="1024"
                step="16"
                value={question.memoryLimitMb}
                onChange={(e) => onUpdate(index, "memoryLimitMb", Number(e.target.value))}
              />
            </div>
            <div className="cp-field">
              <label className="cp-label">
                <Award size={13} style={{ color: "#ffa116" }} /> Contest Points
              </label>
              <input
                className="cp-input"
                type="number"
                min="10"
                step="50"
                value={question.points}
                onChange={(e) => onUpdate(index, "points", Number(e.target.value))}
              />
            </div>
          </div>

          {/* Cognitive Ratings (Admin-only editable) */}
          <div className="cp-cognitive-section">
            <div className="cp-cognitive-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldCheck size={14} style={{ color: "var(--accent)" }} />
                <span className="cp-label" style={{ margin: 0 }}>Cognitive Dimension Ratings</span>
                {isAdmin ? (
                  <span className="cp-admin-chip">Admin Calibration</span>
                ) : (
                  <span className="cp-readonly-chip">System Calibrated</span>
                )}
              </div>
              <span className="cp-hint-inline">Scale: 800 (Intro) - 2800 (Grandmaster)</span>
            </div>

            <div className="cp-cognitive-grid">
              {[
                { key: "algorithmicThinking", label: "Algorithmic Thinking" },
                { key: "problemSolving", label: "Problem Solving" },
                { key: "optimization", label: "Optimization" },
                { key: "edgeCaseAnalysis", label: "Edge Cases" },
                { key: "speedComplexity", label: "Speed & Complexity" },
              ].map(({ key, label }) => {
                const val = question.cognitiveRatings?.[key] ?? 1200;
                return (
                  <div key={key} className="cp-cog-item">
                    <div className="cp-cog-label-row">
                      <span>{label}</span>
                      <strong>{val}</strong>
                    </div>
                    {isAdmin ? (
                      <input
                        type="range"
                        min="800"
                        max="2800"
                        step="50"
                        value={val}
                        onChange={(e) => {
                          const updated = {
                            ...(question.cognitiveRatings || {}),
                            [key]: Number(e.target.value),
                          };
                          onUpdate(index, "cognitiveRatings", updated);
                        }}
                        className="cp-cog-slider"
                      />
                    ) : (
                      <div className="cp-cog-bar-track">
                        <div
                          className="cp-cog-bar-fill"
                          style={{ width: `${Math.min(100, Math.max(10, ((val - 800) / 2000) * 100))}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Test cases (For custom problems) */}
          {!isExisting && (
            <div className="cp-testcases">
              <div className="cp-testcases-header">
                <span className="cp-label">
                  <Layers size={14} style={{ color: "#ffa116" }} /> Test Cases ({question.testCases.length})
                </span>
                <button
                  type="button"
                  className="cp-add-tc-btn"
                  onClick={() => onUpdate(index, "testCases", [...question.testCases, createTestCase()])}
                >
                  <Plus size={13} /> Add Test Case
                </button>
              </div>

              {question.testCases.map((tc, tcIdx) => (
                <div key={tcIdx} className="cp-tc-row">
                  <div className="cp-tc-num">Case {tcIdx + 1}</div>
                  <div className="cp-field" style={{ flex: 1 }}>
                    <label className="cp-label-sm">Standard Input (stdin)</label>
                    <textarea
                      className="cp-textarea-sm"
                      rows={2}
                      value={tc.input}
                      onChange={(e) => {
                        const updated = question.testCases.map((t, i) =>
                          i === tcIdx ? { ...t, input: e.target.value } : t
                        );
                        onUpdate(index, "testCases", updated);
                      }}
                      placeholder="Input parameters..."
                    />
                  </div>
                  <div className="cp-field" style={{ flex: 1 }}>
                    <label className="cp-label-sm">Expected Output (stdout)</label>
                    <textarea
                      className="cp-textarea-sm"
                      rows={2}
                      value={tc.expectedOutput}
                      onChange={(e) => {
                        const updated = question.testCases.map((t, i) =>
                          i === tcIdx ? { ...t, expectedOutput: e.target.value } : t
                        );
                        onUpdate(index, "testCases", updated);
                      }}
                      placeholder="Expected output..."
                    />
                  </div>
                  {question.testCases.length > 1 && (
                    <button
                      type="button"
                      className="cp-icon-btn danger"
                      style={{ marginTop: 22 }}
                      onClick={() => {
                        const updated = question.testCases.filter((_, i) => i !== tcIdx);
                        onUpdate(index, "testCases", updated);
                      }}
                      title="Delete test case"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function CreateContestPage() {
  const navigate = useNavigate();
  const { user } = useAppContext();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const isAdmin = user?.role === "admin";

  // Step 1 — Contest settings: admins default to public, regular users default to private
  const [settings, setSettings] = useState(() => ({
    title: "",
    description: "",
    visibility: user?.role === "admin" ? "public" : "private",
    durationMinutes: 120,
    timingMode: "now", // "now" | "scheduled"
    scheduledAt: "",
    isOfficial: false,
  }));

  // Step 2 — Questions
  const [questions, setQuestions] = useState([]);

  // IDs of existing library problems already added
  const addedProblemIds = questions
    .filter((q) => q._mode === "existing" && q.problemRef)
    .map((q) => q.problemRef);

  const updateSettings = (field) => (e) => {
    const val = field === "durationMinutes" ? Number(e.target.value) : e.target.value;
    setSettings((s) => ({ ...s, [field]: val }));
  };

  // Add a problem from the library
  const handleProblemSelect = (problem) => {
    setShowPicker(false);
    const q = {
      title: problem.title,
      prompt: problem.formalStatement || problem.statement || "",
      timeLimitMs: problem.timeLimit || 2000,
      memoryLimitMb: problem.memoryLimit || 256,
      difficulty: problem.difficulty || "medium",
      tags: (problem.tags || []).join(", "),
      points: problem.difficulty === "hard" ? 300 : problem.difficulty === "medium" ? 200 : 100,
      cognitiveRatings: problem.cognitiveRatings || {
        algorithmicThinking: 1200,
        problemSolving: 1200,
        optimization: 1200,
        edgeCaseAnalysis: 1200,
        speedComplexity: 1200,
      },
      testCases: problem.testCases || [createTestCase()],
      _mode: "existing",
      _expanded: false,
      problemRef: problem._id,
    };
    setQuestions((prev) => [...prev, q]);
  };

  // Add a blank new question
  const handleAddNewQuestion = () => {
    setQuestions((prev) => [...prev, createNewQuestion()]);
  };

  // Update a field of a question
  const handleUpdateQuestion = (idx, field, value) => {
    setQuestions((prev) => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  // Remove a question
  const handleRemoveQuestion = (idx) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  // Calculate total points
  const totalPoints = questions.reduce((acc, q) => acc + (Number(q.points) || 0), 0);

  // Validate step 1
  const validateStep1 = () => {
    if (!settings.title.trim()) return "Contest title is required.";
    if (!settings.durationMinutes || settings.durationMinutes < 15) return "Duration must be at least 15 minutes.";
    if (settings.timingMode === "scheduled" && !settings.scheduledAt) {
      return "Please select a scheduled start date & time, or choose Start Now.";
    }
    if (settings.visibility === "public" && !isAdmin) {
      return "Only administrators can create public contests. Please select Private Room.";
    }
    return null;
  };

  // Validate step 2
  const validateStep2 = () => {
    if (questions.length === 0) return "Add at least one problem to your contest.";
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.title?.trim()) return `Problem ${String.fromCharCode(65 + i)}: title is required.`;
      if (q._mode !== "existing" && !q.prompt?.trim()) return `Problem ${String.fromCharCode(65 + i)}: problem statement is required.`;
      if (!q.testCases || q.testCases.length === 0) return `Problem ${String.fromCharCode(65 + i)}: at least one test case is required.`;
      for (let j = 0; j < q.testCases.length; j++) {
        const tc = q.testCases[j];
        if (tc.expectedOutput?.trim() === "") return `Problem ${String.fromCharCode(65 + i)}, Case ${j + 1}: expected output is required.`;
      }
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep1();
    if (err) { setError(err); return; }
    setError("");
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const err = validateStep2();
    if (err) { setError(err); return; }
    setError("");
    setIsSubmitting(true);

    try {
      const existingProblemIds = questions
        .filter((q) => q._mode === "existing" && q.problemRef)
        .map((q) => q.problemRef);

      const inlineQuestions = questions
        .filter((q) => q._mode !== "existing")
        .map((q) => ({
          title: q.title.trim(),
          prompt: q.prompt.trim(),
          timeLimitMs: q.timeLimitMs,
          memoryLimitMb: q.memoryLimitMb,
          difficulty: q.difficulty,
          tags: q.tags ? q.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
          points: q.points,
          cognitiveRatings: q.cognitiveRatings || {},
          testCases: q.testCases,
        }));

      const payload = {
        title: settings.title.trim(),
        description: settings.description.trim(),
        visibility: settings.visibility,
        durationMinutes: settings.durationMinutes,
        startNow: settings.timingMode === "now",
        scheduledAt: settings.timingMode === "scheduled" ? (settings.scheduledAt || undefined) : undefined,
        isOfficial: Boolean(user?.role === "admin" && settings.isOfficial),
        questions: inlineQuestions,
        existingProblemIds,
      };

      const data = await createContest(payload);
      const contest = data.contest;
      if (contest?._id) {
        navigate(`/contests/${contest._id}`);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Contest creation failed. Please check your inputs and try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const step1Done = Boolean(settings.title.trim() && settings.durationMinutes >= 15);
  const canSubmit = questions.length > 0;

  return (
    <div className="cp-page">
      {/* Sticky Header & Stepper */}
      <header className="cp-header">
        <button
          className="cp-back-btn"
          onClick={() => step === 2 ? setStep(1) : navigate("/contests")}
        >
          <ArrowLeft size={16} /> {step === 2 ? "Contest Details" : "All Contests"}
        </button>

        {/* LeetCode Stepper */}
        <div className="cp-steps">
          <div className={`cp-step ${step >= 1 ? "active" : ""} ${step > 1 ? "done" : ""}`}>
            <div className="cp-step-num">
              {step > 1 ? <Check size={14} /> : "1"}
            </div>
            <span>Contest Details</span>
          </div>
          <div className={`cp-step-connector ${step > 1 ? "done" : ""}`} />
          <div className={`cp-step ${step >= 2 ? "active" : ""}`}>
            <div className="cp-step-num">2</div>
            <span>Problems & Tests</span>
          </div>
        </div>

        <div style={{ width: 110 }} /> {/* balance layout */}
      </header>

      {/* Step 1 — Contest Settings */}
      {step === 1 && (
        <div className="cp-step-panel">
          <div className="cp-step-header">
            <div className="cp-step-title">
              <h2>
                <Sparkles size={22} style={{ color: "#ffa116" }} />
                Contest Details
              </h2>
              <p>Configure the title, visibility format, duration, and optional schedule for your contest</p>
            </div>
          </div>

          {/* Section 1: Basic Info */}
          <div className="cp-card">
            <div className="cp-card-header">
              <h3>General Information</h3>
              <p>Provide an engaging title and a concise description of the contest rules or topics</p>
            </div>
            <div className="cp-form-grid">
              <div className="cp-field full">
                <label className="cp-label">Contest Title *</label>
                <input
                  className="cp-input lg"
                  value={settings.title}
                  onChange={updateSettings("title")}
                  placeholder="e.g. Biweekly Contest #42 — Dynamic Programming & Trees"
                  autoFocus
                />
              </div>

              <div className="cp-field full">
                <label className="cp-label">Description & Rules</label>
                <textarea
                  className="cp-textarea"
                  rows={3}
                  value={settings.description}
                  onChange={updateSettings("description")}
                  placeholder="Provide contest context, rules regarding penalties, or topics covered."
                />
              </div>
            </div>
          </div>

          {/* Section 2: Format & Duration */}
          <div className="cp-card">
            <div className="cp-card-header">
              <h3>Format & Access Control</h3>
              <p>Choose the contest privacy level and specify the total solving time limit</p>
            </div>

            <div className="cp-form-grid">
              <div className="cp-field">
                <label className="cp-label">Contest Visibility</label>
                <div className="cp-vis-group">
                  <button
                    type="button"
                    className={`cp-vis-btn ${settings.visibility === "public" ? "active" : ""} ${!isAdmin ? "cp-vis-btn-disabled" : ""}`}
                    onClick={() => {
                      if (isAdmin) setSettings((s) => ({ ...s, visibility: "public" }));
                    }}
                    disabled={!isAdmin}
                    title={!isAdmin ? "Public contests are reserved for Administrators." : ""}
                  >
                    <div className="cp-vis-btn-top">
                      <Globe size={18} /> Public Contest
                      {!isAdmin && <span className="cp-admin-lock-pill">Admin Only</span>}
                    </div>
                    <span className="cp-vis-desc">
                      {isAdmin
                        ? "Open for all registered community members to discover and join"
                        : "Reserved for administrators to host official platform rounds"}
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`cp-vis-btn ${settings.visibility === "private" ? "active" : ""}`}
                    onClick={() => setSettings((s) => ({ ...s, visibility: "private" }))}
                  >
                    <div className="cp-vis-btn-top">
                      <Lock size={18} /> Private Room
                    </div>
                    <span className="cp-vis-desc">
                      Exclusive contest — invite your friends directly or share the 6-character room code
                    </span>
                  </button>
                </div>
              </div>

              <div className="cp-field">
                <label className="cp-label">Contest Duration (Minutes) *</label>
                <div className="cp-duration-group">
                  {[60, 90, 120, 180].map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`cp-dur-preset ${settings.durationMinutes === d ? "active" : ""}`}
                      onClick={() => setSettings((s) => ({ ...s, durationMinutes: d }))}
                    >
                      {d} min
                    </button>
                  ))}
                  <div className="cp-dur-custom-wrap">
                    <input
                      className="cp-input"
                      type="number"
                      min="15"
                      max="1440"
                      value={settings.durationMinutes}
                      onChange={updateSettings("durationMinutes")}
                    />
                    <span className="cp-dur-suffix">min</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Contest Launch Mode */}
          <div className="cp-card">
            <div className="cp-card-header">
              <h3>Contest Launch & Timing</h3>
              <p>Choose whether to launch this contest live immediately or schedule for a future date</p>
            </div>

            <div className="cp-vis-group" style={{ marginBottom: settings.timingMode === "scheduled" ? 16 : 0 }}>
              <button
                type="button"
                className={`cp-vis-btn ${settings.timingMode === "now" ? "active" : ""}`}
                onClick={() => setSettings((s) => ({ ...s, timingMode: "now" }))}
              >
                <div className="cp-vis-btn-top">
                  <Zap size={18} style={{ color: "#2cbb5d" }} /> Start Now (Live Immediately)
                </div>
                <span className="cp-vis-desc">Contest unlocks immediately upon creation. Participants can jump in and compete.</span>
              </button>

              <button
                type="button"
                className={`cp-vis-btn ${settings.timingMode === "scheduled" ? "active" : ""}`}
                onClick={() => setSettings((s) => ({ ...s, timingMode: "scheduled" }))}
              >
                <div className="cp-vis-btn-top">
                  <Calendar size={18} style={{ color: "#ffa116" }} /> Schedule for Later
                </div>
                <span className="cp-vis-desc">Locks until scheduled start time. Displayed under Upcoming with a live countdown.</span>
              </button>
            </div>

            {settings.timingMode === "scheduled" && (
              <div className="cp-field full" style={{ marginTop: 14 }}>
                <label className="cp-label">
                  <Calendar size={15} style={{ color: "#ffa116" }} />
                  Scheduled Start Time *
                </label>
                <input
                  className="cp-input"
                  type="datetime-local"
                  value={settings.scheduledAt}
                  onChange={updateSettings("scheduledAt")}
                  min={new Date().toISOString().slice(0, 16)}
                />
                {settings.scheduledAt && (
                  <p className="cp-hint">
                    Contest will automatically unlock at {new Date(settings.scheduledAt).toLocaleString()} and conclude after {settings.durationMinutes} minutes.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Section 4: Admin Controls (Official Rated Contest) */}
          {user?.role === "admin" && (
            <div className="cp-card cp-card-admin">
              <div className="cp-card-header">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <ShieldCheck size={18} style={{ color: "var(--accent)" }} />
                  <h3>Admin: Official Rated Contest</h3>
                </div>
                <p>Designate this contest as an official platform round that alters user ratings</p>
              </div>

              <label className="cp-toggle-label">
                <input
                  type="checkbox"
                  checked={Boolean(settings.isOfficial)}
                  onChange={(e) => setSettings((s) => ({ ...s, isOfficial: e.target.checked }))}
                  className="cp-toggle-checkbox"
                />
                <span className="cp-toggle-text">
                  Mark as <strong>Official Rated Contest</strong> (Codeforces/LeetCode Style Rating Calculation)
                </span>
              </label>
            </div>
          )}

          {error && (
            <div className="cp-error">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Sticky Bottom Bar for Step 1 */}
          <div className="cp-sticky-bar">
            <div className="cp-sticky-bar-inner">
              <div className="cp-summary-bar">
                <span>Step 1 of 2</span>
                <span>•</span>
                <span className="cp-summary-chip">
                  <Globe size={12} /> {settings.visibility === "public" ? "Public" : "Private"}
                </span>
                <span className="cp-summary-chip">
                  <Clock size={12} /> {settings.durationMinutes} Minutes
                </span>
              </div>

              <div className="cp-action-buttons">
                <button
                  type="button"
                  className="cp-btn-primary"
                  onClick={handleNext}
                  disabled={!step1Done}
                >
                  Next: Add Problems <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2 — Problems */}
      {step === 2 && (
        <div className="cp-step-panel">
          <div className="cp-step-header">
            <div className="cp-step-title">
              <h2>
                <Layers size={22} style={{ color: "#ffa116" }} />
                Contest Problems
              </h2>
              <p>Curate your problem set from the library or write custom challenges with custom limits</p>
            </div>
            <div className="cp-stats-pills">
              <span className="cp-stat-pill">
                <strong>{questions.length}</strong> {questions.length === 1 ? "Problem" : "Problems"}
              </span>
              <span className="cp-stat-pill">
                <strong>{totalPoints}</strong> Total Pts
              </span>
              <span className="cp-stat-pill">
                <strong>{settings.durationMinutes}m</strong> Duration
              </span>
            </div>
          </div>

          {/* Action cards: Library vs Custom */}
          <div className="cp-add-question-bar">
            <button
              type="button"
              className="cp-add-btn library"
              onClick={() => setShowPicker(true)}
            >
              <div className="cp-add-btn-icon">
                <Database size={20} />
              </div>
              <div className="cp-add-btn-text">
                <span className="cp-add-btn-title">Add from Problem Library</span>
                <span className="cp-add-btn-sub">Search and import verified platform problems</span>
              </div>
            </button>

            <button
              type="button"
              className="cp-add-btn new"
              onClick={handleAddNewQuestion}
            >
              <div className="cp-add-btn-icon">
                <Pencil size={20} />
              </div>
              <div className="cp-add-btn-text">
                <span className="cp-add-btn-title">Create Custom Problem</span>
                <span className="cp-add-btn-sub">Compose a statement, custom test cases & limits</span>
              </div>
            </button>
          </div>

          {/* Problem List */}
          {questions.length === 0 ? (
            <div className="cp-empty-questions">
              <BookOpen size={44} style={{ opacity: 0.2, color: "#ffa116" }} />
              <h3>No problems added yet</h3>
              <p>Click "Add from Problem Library" or "Create Custom Problem" to build your contest challenge set.</p>
            </div>
          ) : (
            <div className="cp-questions-list">
              {questions.map((q, idx) => (
                <QuestionCard
                  key={idx}
                  question={q}
                  index={idx}
                  onUpdate={handleUpdateQuestion}
                  onRemove={handleRemoveQuestion}
                  isAdmin={user?.role === "admin"}
                />
              ))}
            </div>
          )}

          {error && (
            <div className="cp-error">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Sticky Bottom Bar for Step 2 */}
          <div className="cp-sticky-bar">
            <div className="cp-sticky-bar-inner">
              <div className="cp-summary-bar">
                <span className="cp-summary-chip">
                  <strong>{questions.length}</strong> {questions.length === 1 ? "Problem" : "Problems"}
                </span>
                <span className="cp-summary-chip">
                  <Award size={12} style={{ color: "#ffa116" }} />
                  <strong>{totalPoints}</strong> Pts
                </span>
                <span className="cp-summary-chip">
                  <Clock size={12} /> {settings.durationMinutes} min
                </span>
                <span className="cp-summary-chip">
                  {settings.visibility === "public" ? <Globe size={12} /> : <Lock size={12} />}
                  <span style={{ textTransform: "capitalize" }}>{settings.visibility}</span>
                </span>
              </div>

              <div className="cp-action-buttons">
                <button
                  type="button"
                  className="cp-btn-secondary"
                  onClick={() => {
                    setStep(1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <ArrowLeft size={15} /> Edit Details
                </button>
                <button
                  type="button"
                  className="cp-btn-primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !canSubmit}
                >
                  {isSubmitting ? "Publishing Contest..." : (
                    <><CheckCircle2 size={16} /> Publish Contest</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Problem picker modal */}
      {showPicker && (
        <ProblemPickerModal
          onSelect={handleProblemSelect}
          onClose={() => setShowPicker(false)}
          alreadyAdded={addedProblemIds}
        />
      )}
    </div>
  );
}

export default CreateContestPage;