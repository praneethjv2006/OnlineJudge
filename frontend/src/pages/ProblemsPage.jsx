import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useAppContext } from "../App";
import Modal from "../components/common/Modal";
import { toast } from "../components/common/Toast";
import ProblemEditorModal from "../components/problems/ProblemEditorModal";
import { deleteProblem, getApiHealth, getProblems } from "../services/problemService";

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
    return () => {
      active = false;
    };
  }, []);

  const isAuthor = (problem) => {
    if (!user || !problem.createdBy) return false;
    const authorId = problem.createdBy._id || problem.createdBy;
    return String(user.id || user._id) === String(authorId);
  };

  const openCreateEditor = () => {
    if (!user) {
      toast.info("Sign in to publish a problem.");
      navigate("/auth");
      return;
    }
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
      const exists = current.some((problem) => problem._id === savedProblem._id);
      return exists
        ? current.map((problem) => (problem._id === savedProblem._id ? savedProblem : problem))
        : [savedProblem, ...current];
    });
    setEditorState(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    setIsDeleting(true);
    try {
      await deleteProblem(deleteConfirm._id);
      setProblems((current) =>
        current.filter((problem) => problem._id !== deleteConfirm._id)
      );
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
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      problem.title.toLowerCase().includes(query) ||
      problem.difficulty.toLowerCase().includes(query) ||
      problem.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  return (
    <main className="app-main">
      <div className="page-stack">
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

        <div className="problemset-toolbar">
          <Search size={18} />
          <input
            type="search"
            placeholder="Search by title, difficulty, or tag..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          <span>{filteredProblems.length} problems</span>
        </div>

        {apiFeatures && !apiFeatures.structuredProblems && (
          <div className="problem-api-warning">
            <AlertTriangle size={18} />
            <div>
              <strong>Backend deployment is outdated</strong>
              <p>Create, edit, and delete require the latest Railway backend deployment.</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading-state">Loading problems...</div>
        ) : filteredProblems.length === 0 ? (
          <div className="empty-state panel">
            <h3>No problems found</h3>
            <p>{searchQuery ? "Try a different search term." : "Create the first problem."}</p>
          </div>
        ) : (
          <div className="problems-list-container">
            <table className="problems-list-table">
              <thead>
                <tr>
                  <th className="problem-status-cell">Status</th>
                  <th>Problem</th>
                  <th>Difficulty</th>
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
                      <Link to={`/problems/${problem._id}`} className="problem-title-link">
                        {problem.title}
                      </Link>
                      {problem.tags?.length > 0 && (
                        <div className="problem-list-tags">
                          {problem.tags.slice(0, 3).map((tag) => (
                            <span key={tag}>{tag}</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`difficulty-tag-v2 ${problem.difficulty}`}>
                        {problem.difficulty}
                      </span>
                    </td>
                    <td className="problem-complexity-cell">
                      {problem.timeComplexity || "Not specified"}
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

      <Modal
        isOpen={Boolean(deleteConfirm)}
        onClose={() => !isDeleting && setDeleteConfirm(null)}
        title="Delete problem?"
        footer={
          <>
            <button
              className="modal-btn modal-btn-cancel"
              onClick={() => setDeleteConfirm(null)}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              className="modal-btn modal-btn-danger"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete problem"}
            </button>
          </>
        }
      >
        <div className="delete-confirmation-copy">
          <span className="delete-confirmation-icon">
            <AlertTriangle size={24} />
          </span>
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
