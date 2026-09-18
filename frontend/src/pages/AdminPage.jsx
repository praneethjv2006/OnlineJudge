import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Users,
  BookOpen,
  Plus,
  Search,
  Check,
  ChevronRight,
  Brain,
  TrendingUp,
  Zap,
  GitBranch,
  Cpu,
} from "lucide-react";
import { useAppContext } from "../App";
import { listAdmins, addAdmin } from "../services/authService";
import { searchProblems, updateCognitiveRatings } from "../services/problemService";
import { createContest } from "../services/contestService";
import { getErrorMessage } from "../services/api";
import "../styles/_admin.css";

const COGNITIVE_SKILLS = [
  { key: "patternRecognition", label: "Pattern Recognition", icon: <Brain size={16} />, color: "#7c3aed" },
  { key: "optimizationAbility", label: "Optimization Ability", icon: <TrendingUp size={16} />, color: "#2563eb" },
  { key: "mathematicalReasoning", label: "Mathematical Reasoning", icon: <GitBranch size={16} />, color: "#059669" },
  { key: "logicFlowDebugging", label: "Logic Flow & Debugging", icon: <Zap size={16} />, color: "#d97706" },
  { key: "memoryComplexity", label: "Memory & Complexity", icon: <Cpu size={16} />, color: "#dc2626" },
];

// ─── Tab: Manage Admins ───────────────────────────────────────────────────────
function AdminsTab() {
  const [admins, setAdmins] = useState([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    listAdmins()
      .then((d) => setAdmins(d.admins || []))
      .catch(() => {});
  }, []);

  const handlePromote = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const data = await addAdmin(email.trim());
      setMessage(data.message);
      const fresh = await listAdmins();
      setAdmins(fresh.admins || []);
      setEmail("");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to promote user."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-tab-content">
      <div className="admin-section-header">
        <h2>Admin Members</h2>
        <p>Promote users to admin so they can create rated contests and set cognitive skill ratings.</p>
      </div>

      <form className="admin-promote-form" onSubmit={handlePromote}>
        <div className="admin-input-row">
          <input
            type="email"
            className="admin-input"
            placeholder="Enter user email to promote..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="admin-btn-primary" type="submit" disabled={loading}>
            <Plus size={16} />
            {loading ? "Promoting…" : "Promote to Admin"}
          </button>
        </div>
        {message && <p className="admin-feedback success">{message}</p>}
        {error && <p className="admin-feedback error">{error}</p>}
      </form>

      <div className="admin-card-grid">
        {admins.map((a) => (
          <div key={a._id || a.email} className="admin-member-card">
            <div className="admin-avatar">{a.name?.[0]?.toUpperCase() || "A"}</div>
            <div className="admin-member-info">
              <span className="admin-member-name">{a.name}</span>
              <span className="admin-member-email">{a.email}</span>
            </div>
            <span className="admin-role-badge">
              <ShieldCheck size={12} /> Admin
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Question Studio (Cognitive Ratings) ──────────────────────────────────
function QuestionStudioTab() {
  const [query, setQuery] = useState("");
  const [problems, setProblems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [ratings, setRatings] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const handleSearch = useCallback(async () => {
    try {
      const results = await searchProblems(query);
      setProblems(results);
    } catch {
      setProblems([]);
    }
  }, [query]);

  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  const selectProblem = (p) => {
    setSelected(p);
    setSaveMsg("");
    setRatings({
      patternRecognition: p.cognitiveRatings?.patternRecognition ?? 0,
      optimizationAbility: p.cognitiveRatings?.optimizationAbility ?? 0,
      mathematicalReasoning: p.cognitiveRatings?.mathematicalReasoning ?? 0,
      logicFlowDebugging: p.cognitiveRatings?.logicFlowDebugging ?? 0,
      memoryComplexity: p.cognitiveRatings?.memoryComplexity ?? 0,
    });
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    setSaveMsg("");
    try {
      await updateCognitiveRatings(selected._id, ratings);
      setSaveMsg("Ratings saved!");
      // update local list
      setProblems((prev) =>
        prev.map((p) => (p._id === selected._id ? { ...p, cognitiveRatings: { ...ratings } } : p))
      );
    } catch {
      setSaveMsg("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-tab-content studio-layout">
      {/* Left: problem list */}
      <div className="studio-sidebar">
        <div className="studio-search">
          <Search size={16} />
          <input
            className="studio-search-input"
            placeholder="Search problems..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="studio-problem-list">
          {problems.map((p) => (
            <button
              key={p._id}
              className={`studio-problem-item ${selected?._id === p._id ? "active" : ""}`}
              onClick={() => selectProblem(p)}
            >
              <div className="studio-problem-title">{p.title}</div>
              <div className={`studio-difficulty ${p.difficulty}`}>{p.difficulty}</div>
              <ChevronRight size={14} className="studio-chevron" />
            </button>
          ))}
          {problems.length === 0 && <p className="studio-empty">No problems found.</p>}
        </div>
      </div>

      {/* Right: rating editor */}
      <div className="studio-editor">
        {selected ? (
          <>
            <div className="studio-editor-header">
              <h3>{selected.title}</h3>
              <span className={`studio-difficulty ${selected.difficulty}`}>{selected.difficulty}</span>
            </div>
            <p className="studio-editor-subtitle">Set cognitive skill ratings for this problem (0–100)</p>

            <div className="cognitive-ratings-grid">
              {COGNITIVE_SKILLS.map(({ key, label, icon, color }) => (
                <div key={key} className="cognitive-rating-item">
                  <div className="cognitive-label" style={{ color }}>
                    {icon} <span>{label}</span>
                  </div>
                  <div className="cognitive-slider-row">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={ratings[key] ?? 0}
                      onChange={(e) => setRatings((r) => ({ ...r, [key]: Number(e.target.value) }))}
                      className="cognitive-slider"
                      style={{ "--track-color": color }}
                    />
                    <span className="cognitive-value" style={{ color }}>{ratings[key] ?? 0}</span>
                  </div>
                  <div className="cognitive-bar">
                    <div
                      className="cognitive-bar-fill"
                      style={{ width: `${ratings[key] ?? 0}%`, background: color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="studio-save-row">
              <button className="admin-btn-primary" onClick={handleSave} disabled={saving}>
                <Check size={16} />
                {saving ? "Saving…" : "Save Ratings"}
              </button>
              {saveMsg && (
                <span className={`admin-feedback inline ${saveMsg.includes("saved") ? "success" : "error"}`}>
                  {saveMsg}
                </span>
              )}
            </div>
          </>
        ) : (
          <div className="studio-empty-state">
            <BookOpen size={48} strokeWidth={1} />
            <p>Select a problem to edit cognitive skill ratings</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Quick Contest Launch ─────────────────────────────────────────────────
function QuickLaunchTab() {
  const { user } = useAppContext();
  const [form, setForm] = useState({
    title: "",
    description: "",
    durationMinutes: 90,
    visibility: "public",
    isOfficial: true,
    startMode: "now",
    scheduledAt: "",
  });
  const [problems, setProblems] = useState([]);
  const [selectedProblemIds, setSelectedProblemIds] = useState([]);
  const [query, setQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    searchProblems(query).then(setProblems).catch(() => setProblems([]));
  }, [query]);

  const toggleProblem = (id) => {
    setSelectedProblemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleLaunch = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setError("Title is required.");
    if (selectedProblemIds.length === 0) return setError("Select at least one problem.");
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        durationMinutes: Number(form.durationMinutes),
        visibility: form.visibility,
        isOfficial: form.isOfficial,
        existingProblemIds: selectedProblemIds,
        startNow: form.startMode === "now",
        scheduledAt: form.startMode === "scheduled" ? form.scheduledAt : undefined,
      };
      const data = await createContest(payload);
      setResult(data.contest);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create contest."));
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="admin-tab-content">
        <div className="admin-launch-success">
          <Check size={48} className="launch-success-icon" />
          <h2>Contest Created!</h2>
          <p className="launch-room-code">{result.roomCode}</p>
          <p className="launch-status-badge">{result.status === "live" ? "🟢 Live Now" : `Scheduled for ${new Date(result.scheduledAt).toLocaleString()}`}</p>
          <a href={`/contests/${result._id}`} className="admin-btn-primary">
            Go to Contest Room
          </a>
          <button className="admin-btn-ghost" onClick={() => { setResult(null); setSelectedProblemIds([]); }}>
            Create Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-tab-content">
      <div className="admin-section-header">
        <h2>Quick Contest Launch</h2>
        <p>Create a rated official contest from the problem library. Only admins can create official contests.</p>
      </div>

      <form className="admin-launch-form" onSubmit={handleLaunch}>
        <div className="admin-form-row">
          <label className="admin-label">Contest Title</label>
          <input
            className="admin-input"
            placeholder="e.g. Weekly Challenge #42"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
        </div>

        <div className="admin-form-row">
          <label className="admin-label">Description (optional)</label>
          <textarea
            className="admin-input admin-textarea"
            placeholder="Describe the contest theme..."
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>

        <div className="admin-form-grid-2">
          <div className="admin-form-row">
            <label className="admin-label">Duration (minutes)</label>
            <input
              type="number"
              className="admin-input"
              min={15}
              max={360}
              value={form.durationMinutes}
              onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
            />
          </div>
          <div className="admin-form-row">
            <label className="admin-label">Visibility</label>
            <select
              className="admin-input admin-select"
              value={form.visibility}
              onChange={(e) => setForm((f) => ({ ...f, visibility: e.target.value }))}
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>

        <div className="admin-form-row">
          <label className="admin-label">Start Mode</label>
          <div className="admin-toggle-group">
            <button
              type="button"
              className={`admin-toggle ${form.startMode === "now" ? "active" : ""}`}
              onClick={() => setForm((f) => ({ ...f, startMode: "now" }))}
            >
              🚀 Start Now (Live)
            </button>
            <button
              type="button"
              className={`admin-toggle ${form.startMode === "ready" ? "active" : ""}`}
              onClick={() => setForm((f) => ({ ...f, startMode: "ready" }))}
            >
              ⏳ Ready (Manual Start)
            </button>
            <button
              type="button"
              className={`admin-toggle ${form.startMode === "scheduled" ? "active" : ""}`}
              onClick={() => setForm((f) => ({ ...f, startMode: "scheduled" }))}
            >
              📅 Schedule
            </button>
          </div>
        </div>

        {form.startMode === "scheduled" && (
          <div className="admin-form-row">
            <label className="admin-label">Scheduled At</label>
            <input
              type="datetime-local"
              className="admin-input"
              value={form.scheduledAt}
              onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
            />
          </div>
        )}

        <div className="admin-form-row">
          <label className="admin-label">Official Rated Contest</label>
          <div className="admin-toggle-row">
            <input
              type="checkbox"
              id="isOfficial"
              checked={form.isOfficial}
              onChange={(e) => setForm((f) => ({ ...f, isOfficial: e.target.checked }))}
              className="admin-checkbox"
            />
            <label htmlFor="isOfficial" className="admin-checkbox-label">
              Affects user ratings (ELO-style)
            </label>
          </div>
        </div>

        <div className="admin-form-row">
          <label className="admin-label">Select Problems ({selectedProblemIds.length} selected)</label>
          <div className="admin-search-bar">
            <Search size={15} />
            <input
              className="admin-search-input"
              placeholder="Search problem library..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="admin-problem-picker">
            {problems.map((p) => {
              const selected = selectedProblemIds.includes(p._id);
              return (
                <div
                  key={p._id}
                  className={`admin-picker-item ${selected ? "selected" : ""}`}
                  onClick={() => toggleProblem(p._id)}
                >
                  <div className={`picker-check ${selected ? "checked" : ""}`}>
                    {selected && <Check size={12} />}
                  </div>
                  <div className="picker-info">
                    <span className="picker-title">{p.title}</span>
                    <span className={`picker-diff ${p.difficulty}`}>{p.difficulty}</span>
                  </div>
                </div>
              );
            })}
            {problems.length === 0 && <p className="studio-empty">No problems found.</p>}
          </div>
        </div>

        {error && <p className="admin-feedback error">{error}</p>}

        <button className="admin-btn-primary admin-btn-lg" type="submit" disabled={submitting}>
          {submitting ? "Creating…" : "🚀 Launch Contest"}
        </button>
      </form>
    </div>
  );
}

// ─── AdminPage Root ────────────────────────────────────────────────────────────
const TABS = [
  { id: "admins", label: "Manage Admins", icon: <Users size={18} /> },
  { id: "studio", label: "Question Studio", icon: <BookOpen size={18} /> },
  { id: "launch", label: "Launch Contest", icon: <ShieldCheck size={18} /> },
];

export default function AdminPage() {
  const { user } = useAppContext();
  const [activeTab, setActiveTab] = useState("admins");

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-header-badge">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h1>Admin Portal</h1>
          <p>Logged in as <strong>{user?.email}</strong> · All powers come with responsibility.</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="admin-tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`admin-tab-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="admin-content-area">
        {activeTab === "admins" && <AdminsTab />}
        {activeTab === "studio" && <QuestionStudioTab />}
        {activeTab === "launch" && <QuickLaunchTab />}
      </div>
    </div>
  );
}
