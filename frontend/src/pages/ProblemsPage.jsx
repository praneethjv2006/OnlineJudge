import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAppContext } from "../App";
import Modal from "../components/common/Modal";
import { toast } from "../components/common/Toast";
import ProblemEditorModal from "../components/problems/ProblemEditorModal";
import { deleteProblem, getApiHealth, getProblems } from "../services/problemService";

const DIFFICULTIES = ["easy", "medium", "hard"];
const CATEGORIES = ["Coding", "Debugging", "Concept", "Speedrun"];
const COGNITIVE_CATS = [
  "Pattern Recognition",
  "Optimization Ability",
  "Mathematical Reasoning",
  "Logic Flow & Debugging",
  "Memory & Complexity",
];

function FilterSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="filter-section">
      <button className="filter-section-toggle" onClick={() => setOpen(!open)}>
        <span>{title}</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && <div className="filter-section-body">{children}</div>}
    </div>
  );
}

function FilterPill({ label, active, onClick }) {
  return (
    <button
      className={`filter-pill ${active ? "filter-pill-active" : ""}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function ProblemsPage() {
  const { user } = useAppContext();
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [apiFeatures, setApiFeatures] = useState(null);
  const [editorState, setEditorState] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  // Filter states
  const [selectedDifficulties, setSelectedDifficulties] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [selectedCognitive, setSelectedCognitive] = useState([]);

  useEffect(() => {
    let active = true;
    const fetchProblems = async () => {
      try {
        const [data, health] = await Promise.all([getProblems(), getApiHealth()]);
        if (active) {
          setProblems(data);
          setApiFeatures(health.features || {});
        }
      } catch {
        toast.error("Unable to load problems.");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchProblems();
    return () => { active = false; };
  }, []);

  const allTopics = Array.from(
    new Set(problems.flatMap((p) => p.topics || []))
  ).sort();

  const activeFilterCount =
    selectedDifficulties.length +
    selectedCategories.length +
    selectedTopics.length +
    selectedCognitive.length;

  const clearAllFilters = () => {
    setSelectedDifficulties([]);
    setSelectedCategories([]);
    setSelectedTopics([]);
    setSelectedCognitive([]);
    setSearchQuery("");
  };

  const toggleFilter = (setter, value) =>
    setter((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );

  const isAuthor = (problem) => {
    if (!user || !problem.createdBy) return false;
    const authorId = problem.createdBy._id || problem.createdBy;
    return String(user.id || user._id) === String(authorId);
  };

  const openCreateEditor = () => {
    if (!user) { toast.info("Sign in to publish a problem."); navigate("/auth"); return; }
    if (apiFeatures && !apiFeatures.structuredProblems) {
      toast.error("Railway is still running the old backend. Redeploy the latest main commit first.");
      return;
    }
    setEditorState({ problem: null });
  };

  const openEditEditor = (problem) => {
    if (apiFeatures && !apiFeatures.problemEdit) {
      toast.error("Railway is still running the old backend. Redeploy the latest main commit first.");
      return;
    }
    setEditorState({ problem });
  };

  const handleSaved = (savedProblem) => {
    setProblems((current) => {
      const exists = current.some((p) => p._id === savedProblem._id);
      return exists
        ? current.map((p) => (p._id === savedProblem._id ? savedProblem : p))
        : [savedProblem, ...current];
    });
    setEditorState(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      await deleteProblem(deleteConfirm._id);
      setProblems((current) => current.filter((p) => p._id !== deleteConfirm._id));
      setDeleteConfirm(null);
      toast.success("Problem deleted successfully.");
    } catch (error) {
      const serverMessage = error.response?.data?.message;
      const message =
        error.response?.status === 404 && !serverMessage
          ? "The deployed backend does not have the delete route yet. Redeploy Railway and try again."
          : serverMessage || "Failed to delete problem.";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredProblems = problems.filter((problem) => {
    // Difficulty filter
    if (selectedDifficulties.length > 0 && !selectedDifficulties.includes(problem.difficulty)) return false;
    // Category filter
    if (selectedCategories.length > 0 && !selectedCategories.includes(problem.category)) return false;
    // Topic filter (ANY match)
    if (selectedTopics.length > 0) {
      const hasAny = selectedTopics.some((t) =>
        problem.topics?.some((pt) => pt.toLowerCase() === t.toLowerCase())
      );
      if (!hasAny) return false;
    }
    // Cognitive category filter (ANY match)
    if (selectedCognitive.length > 0) {
      const hasAny = selectedCognitive.some((c) =>
        problem.cognitiveCategories?.some((pc) => pc.toLowerCase() === c.toLowerCase())
      );
      if (!hasAny) return false;
    }
    // Text search
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      return (
        problem.title.toLowerCase().includes(query) ||
        problem.difficulty.toLowerCase().includes(query) ||
        problem.category?.toLowerCase().includes(query) ||
        problem.tags?.some((tag) => tag.toLowerCase().includes(query)) ||
        problem.topics?.some((t) => t.toLowerCase().includes(query))
      );
    }
    return true;
  });

  return (
    <main className="app-main">
      <div className="page-stack">
        {/* Header */}
        <header className="problemset-header">
          <div>
            <span className="problemset-eyebrow">Practice library</span>
            <h1>Problemset</h1>
            <p>Choose a challenge, write a solution, and sharpen your competitive programming skills.</p>
          </div>
          <button className="problem-create-button" onClick={openCreateEditor}>
            <Plus size={18} /> Create problem
          </button>
        </header>

        {/* Search + Filter Toggle */}
        <div className="problemset-toolbar">
          <Search size={18} />
          <input
            type="search"
            placeholder="Search by title, difficulty, tag, or topic…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            className={`filter-toggle-btn ${showFilters ? "active" : ""}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            Filters
            {activeFilterCount > 0 && (
              <span className="filter-active-badge">{activeFilterCount}</span>
            )}
          </button>
          <span>{filteredProblems.length} problems</span>
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="active-filters-row">
            {selectedDifficulties.map((d) => (
              <span key={d} className="active-filter-chip">
                {d} <button onClick={() => toggleFilter(setSelectedDifficulties, d)}><X size={11} /></button>
              </span>
            ))}
            {selectedCategories.map((c) => (
              <span key={c} className="active-filter-chip active-filter-chip-cat">
                {c} <button onClick={() => toggleFilter(setSelectedCategories, c)}><X size={11} /></button>
              </span>
            ))}
            {selectedTopics.map((t) => (
              <span key={t} className="active-filter-chip active-filter-chip-topic">
                #{t} <button onClick={() => toggleFilter(setSelectedTopics, t)}><X size={11} /></button>
              </span>
            ))}
            {selectedCognitive.map((cog) => (
              <span key={cog} className="active-filter-chip active-filter-chip-cog">
                {cog} <button onClick={() => toggleFilter(setSelectedCognitive, cog)}><X size={11} /></button>
              </span>
            ))}
            <button className="clear-filters-btn" onClick={clearAllFilters}>
              <X size={13} /> Clear all
            </button>
          </div>
        )}

        {apiFeatures && !apiFeatures.structuredProblems && (
          <div className="problem-api-warning">
            <AlertTriangle size={18} />
            <div>
              <strong>Backend deployment is outdated</strong>
              <p>Create, edit, and delete require the latest Railway backend deployment.</p>
            </div>
          </div>
        )}

        {/* Main layout: sidebar + table */}
        <div className={`problems-layout ${showFilters ? "with-sidebar" : ""}`}>

          {/* Filter Sidebar */}
          {showFilters && (
            <aside className="problems-filter-sidebar">
              <div className="filter-sidebar-header">
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <button className="filter-clear-small" onClick={clearAllFilters}>Clear all</button>
                )}
              </div>

              <FilterSection title="Difficulty">
                <div className="filter-pill-group">
                  {DIFFICULTIES.map((d) => (
                    <FilterPill
                      key={d}
                      label={d.charAt(0).toUpperCase() + d.slice(1)}
                      active={selectedDifficulties.includes(d)}
                      onClick={() => toggleFilter(setSelectedDifficulties, d)}
                    />
                  ))}
                </div>
              </FilterSection>

              <FilterSection title="Category">
                <div className="filter-pill-group">
                  {CATEGORIES.map((c) => (
                    <FilterPill
                      key={c}
                      label={c}
                      active={selectedCategories.includes(c)}
                      onClick={() => toggleFilter(setSelectedCategories, c)}
                    />
                  ))}
                </div>
              </FilterSection>

              {allTopics.length > 0 && (
                <FilterSection title="Topics">
                  <div className="filter-pill-group">
                    {allTopics.map((t) => (
                      <FilterPill
                        key={t}
                        label={t}
                        active={selectedTopics.includes(t)}
                        onClick={() => toggleFilter(setSelectedTopics, t)}
                      />
                    ))}
                  </div>
                </FilterSection>
              )}

              <FilterSection title="Cognitive Category">
                <div className="filter-pill-group filter-pill-group-vertical">
                  {COGNITIVE_CATS.map((cog) => (
                    <FilterPill
                      key={cog}
                      label={cog}
                      active={selectedCognitive.includes(cog)}
                      onClick={() => toggleFilter(setSelectedCognitive, cog)}
                    />
                  ))}
                </div>
              </FilterSection>
            </aside>
          )}

          {/* Problem Table */}
          <div className="problems-table-area">
            {loading ? (
              <div className="loading-state">Loading problems...</div>
            ) : filteredProblems.length === 0 ? (
              <div className="empty-state panel">
                <h3>No problems found</h3>
                <p>
                  {activeFilterCount > 0 || searchQuery
                    ? "Try adjusting your filters or search."
                    : "Create the first problem."}
                </p>
                {activeFilterCount > 0 && (
                  <button className="friend-btn friend-btn-ghost" onClick={clearAllFilters}>
                    <X size={15} /> Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="problems-list-container">
                <table className="problems-list-table">
                  <thead>
                    <tr>
                      <th className="problem-status-cell">Status</th>
                      <th>Problem</th>
                      <th>Difficulty</th>
                      <th>Category</th>
                      <th>Target</th>
                      <th>Author</th>
                      <th className="problem-actions-column">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProblems.map((problem) => (
                      <tr key={problem._id}>
                        <td className="problem-status-cell">
                          <span className="problem-status-icon">
                            <CheckCircle2 size={18} />
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <Link to={`/problems/${problem._id}`} className="problem-title-link">
                              {problem.title}
                            </Link>
                          </div>
                          {((problem.topics && problem.topics.length > 0) || (problem.tags && problem.tags.length > 0)) && (
                            <div className="problem-list-tags" style={{ marginTop: "4px" }}>
                              {problem.topics?.map((topic) => (
                                <span
                                  key={`topic-${topic}`}
                                  style={{ color: "#00b4d8", fontWeight: "600", cursor: "pointer" }}
                                  onClick={() => { if (!selectedTopics.includes(topic)) toggleFilter(setSelectedTopics, topic); }}
                                >
                                  #{topic}
                                </span>
                              ))}
                              {problem.tags?.filter((tag) => !problem.topics?.includes(tag)).slice(0, 3).map((tag) => (
                                <span key={`tag-${tag}`}>{tag}</span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`difficulty-tag-v2 ${problem.difficulty}`}>
                            {problem.difficulty}
                          </span>
                        </td>
                        <td>
                          {problem.category && (
                            <span
                              className="problem-category-badge"
                              onClick={() => { if (!selectedCategories.includes(problem.category)) toggleFilter(setSelectedCategories, problem.category); }}
                            >
                              {problem.category}
                            </span>
                          )}
                        </td>
                        <td className="problem-complexity-cell">
                          {problem.timeComplexity || "—"}
                        </td>
                        <td>
                          <div className="problem-author-cell">
                            <span>{problem.createdBy?.name?.charAt(0) || "U"}</span>
                            <div>
                              <strong>{problem.createdBy?.name || "Unknown"}</strong>
                              {isAuthor(problem) && <small>You</small>}
                            </div>
                          </div>
                        </td>
                        <td>
                          {isAuthor(problem) ? (
                            <div className="problem-row-actions">
                              <button
                                className="problem-edit-btn"
                                onClick={() => openEditEditor(problem)}
                                title="Edit problem"
                                aria-label={`Edit ${problem.title}`}
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                className="problem-delete-btn"
                                onClick={() => setDeleteConfirm(problem)}
                                title="Delete problem"
                                aria-label={`Delete ${problem.title}`}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          ) : (
                            <span className="problem-no-actions">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={Boolean(deleteConfirm)}
        onClose={() => !isDeleting && setDeleteConfirm(null)}
        title="Delete problem?"
        footer={
          <>
            <button className="modal-btn modal-btn-cancel" onClick={() => setDeleteConfirm(null)} disabled={isDeleting}>
              Cancel
            </button>
            <button className="modal-btn modal-btn-danger" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete problem"}
            </button>
          </>
        }
      >
        <div className="delete-confirmation-copy">
          <span className="delete-confirmation-icon"><AlertTriangle size={24} /></span>
          <p>
            Are you sure you want to delete <strong>{deleteConfirm?.title}</strong>? This
            action cannot be undone, and its submissions will also be removed.
          </p>
        </div>
      </Modal>

      {editorState && (
        <ProblemEditorModal
          problem={editorState.problem}
          onClose={() => setEditorState(null)}
          onSaved={handleSaved}
        />
      )}
    </main>
  );
}

export default ProblemsPage;
