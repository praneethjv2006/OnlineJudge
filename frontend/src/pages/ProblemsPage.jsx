import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Plus, 
  Trash2, 
  X, 
  Info, 
  Code2, 
  Beaker, 
  ChevronRight, 
  Activity,
  CheckCircle2,
  Filter,
  Search,
  AlertTriangle
} from "lucide-react";
import { getProblems, createProblem, deleteProblem } from "../services/problemService";
import { useAppContext } from "../App";
import { toast } from "../components/common/Toast";
import Modal from "../components/common/Modal";

const ProblemsPage = () => {
  const { user } = useAppContext();
  const [problems, setProblems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    difficulty: "easy",
    statement: "",
    tags: "",
    timeLimit: 2000,
    memoryLimit: 256,
    problemStory: "",
    formalStatement: "",
    inputFormat: "",
    outputFormat: "",
    constraints: "",
    notes: "",
    timeComplexity: "",
    spaceComplexity: "",
    testCases: [{ input: "", expectedOutput: "", explanation: "" }],
  });

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      const data = await getProblems();
      setProblems(data);
    } catch (error) {
      console.error("Error fetching problems:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTestCaseChange = (index, field, value) => {
    const newTestCases = [...formData.testCases];
    newTestCases[index][field] = value;
    setFormData((prev) => ({ ...prev, testCases: newTestCases }));
  };

  const addTestCase = () => {
    setFormData((prev) => ({
      ...prev,
      testCases: [...prev.testCases, { input: "", expectedOutput: "", explanation: "" }],
    }));
  };

  const removeTestCase = (index) => {
    if (formData.testCases.length > 1) {
      const newTestCases = formData.testCases.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, testCases: newTestCases }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createProblem({
        ...formData,
        examples: formData.testCases.map((testCase) => ({
          input: testCase.input,
          output: testCase.expectedOutput,
          explanation: testCase.explanation,
        })),
      });
      setIsModalOpen(false);
      setFormData({
        title: "",
        difficulty: "easy",
        statement: "",
        tags: "",
        timeLimit: 2000,
        memoryLimit: 256,
        problemStory: "",
        formalStatement: "",
        inputFormat: "",
        outputFormat: "",
        constraints: "",
        notes: "",
        timeComplexity: "",
        spaceComplexity: "",
        testCases: [{ input: "", expectedOutput: "", explanation: "" }],
      });
      fetchProblems();
      toast.success("Problem created successfully!");
    } catch (error) {
      console.error("Error creating problem:", error);
      toast.error("Failed to create problem. " + (error.response?.data?.message || ""));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      await deleteProblem(deleteConfirm._id);
      toast.success("Problem deleted successfully.");
      setDeleteConfirm(null);
      setProblems((current) =>
        current.filter((problem) => problem._id !== deleteConfirm._id)
      );
    } catch (error) {
      const serverMessage = error.response?.data?.message;
      const message =
        error.response?.status === 404 && !serverMessage
          ? "The delete API is not available on the deployed backend yet. Redeploy the Railway backend and try again."
          : serverMessage || "Failed to delete problem.";

      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const isAuthor = (problem) => {
    if (!user || !problem.createdBy) return false;
    const authorId = problem.createdBy._id || problem.createdBy;
    return String(user.id || user._id) === String(authorId);
  };

  const filteredProblems = problems.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="app-main">
      <div className="page-stack">
        <div className="section-heading inline">
          <div>
            <h1 className="brand-mark">
              <strong>Problemset</strong>
            </h1>
            <p className="muted-copy">Master your skills with our curated collection of coding challenges.</p>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
             <div style={{ position: "relative" }}>
                <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
                <input 
                  type="text" 
                  placeholder="Search problems..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ 
                    padding: "10px 12px 10px 40px", 
                    borderRadius: "10px", 
                    background: "rgba(255,255,255,0.04)", 
                    border: "1px solid var(--border)",
                    color: "#fff",
                    width: "240px",
                    fontSize: "0.9rem"
                  }} 
                />
             </div>
             <button className="ghost-button" style={{ borderRadius: "10px", padding: "0 16px" }}>
                <Filter size={18} style={{ marginRight: "8px" }} /> Filter
             </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Loading problems...</div>
        ) : filteredProblems.length === 0 ? (
          <div className="empty-state panel">
            <h3>No problems found</h3>
            <p>{searchQuery ? "Try a different search term." : "Be the first to create a problem!"}</p>
          </div>
        ) : (
          <div className="problems-list-container">
            <table className="problems-list-table">
              <thead>
                <tr>
                  <th className="problem-status-cell">Status</th>
                  <th>Title</th>
                  <th>Difficulty</th>
                  <th>Complexity</th>
                  <th>Created By</th>
                  <th style={{ width: "60px" }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredProblems.map((problem) => (
                  <tr key={problem._id}>
                    <td className="problem-status-cell">
                      <div className="problem-status-icon">
                        {/* Placeholder for solved status */}
                        <CheckCircle2 size={18} style={{ opacity: 0.1 }} />
                      </div>
                    </td>
                    <td>
                      <Link to={`/problems/${problem._id}`} className="problem-title-link">
                        {problem.title}
                      </Link>
                    </td>
                    <td>
                      <span className={`difficulty-tag-v2 ${problem.difficulty}`}>
                        {problem.difficulty}
                      </span>
                    </td>
                    <td style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                      {problem.timeComplexity || "N/A"}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                         <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--accent)", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700 }}>
                            {problem.createdBy?.name?.charAt(0) || "U"}
                         </div>
                         <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>{problem.createdBy?.name || "Unknown"}</span>
                      </div>
                    </td>
                    <td>
                      {isAuthor(problem) && (
                        <button
                          onClick={() => setDeleteConfirm(problem)}
                          className="problem-delete-btn"
                          title="Delete problem"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        className="fab"
        onClick={() => setIsModalOpen(true)}
        style={{
          position: "fixed",
          bottom: "40px",
          right: "40px",
          width: "60px",
          height: "60px",
          borderRadius: "18px",
          backgroundColor: "var(--accent)",
          color: "#1a130a",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 12px 32px rgba(255, 161, 22, 0.35)",
          cursor: "pointer",
          zIndex: 100,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = "translateY(-4px) scale(1.05)";
          e.currentTarget.style.boxShadow = "0 16px 40px rgba(255, 161, 22, 0.45)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = "translateY(0) scale(1)";
          e.currentTarget.style.boxShadow = "0 12px 32px rgba(255, 161, 22, 0.35)";
        }}
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

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
          <span className="delete-confirmation-icon"><AlertTriangle size={24} /></span>
          <p>
            Are you sure you want to delete <strong>{deleteConfirm?.title}</strong>? This action
            cannot be undone, and its submissions will also be removed.
          </p>
        </div>
      </Modal>

      {/* Professional Modal */}
      {isModalOpen && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            className="panel"
            style={{
              maxWidth: "900px",
              width: "95%",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              background: "#121212",
              borderRadius: "24px",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.8)",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "24px 32px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#1a1a1a",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ padding: "8px", background: "rgba(255, 161, 22, 0.1)", borderRadius: "10px", color: "var(--accent)" }}>
                  <Code2 size={20} />
                </div>
                <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700 }}>New Problem</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "none",
                  color: "#999",
                  padding: "8px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  display: "flex",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = "#fff")}
                onMouseOut={(e) => (e.currentTarget.style.color = "#999")}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "32px",
                scrollBehavior: "smooth",
              }}
            >
              <form id="problem-form" onSubmit={handleSubmit} className="contest-form">
                {/* Section 1: Basic Info */}
                <div style={{ marginBottom: "40px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px", color: "var(--accent)" }}>
                    <Info size={16} />
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>Basic Information</span>
                  </div>
                  <div className="form-grid two-up" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
                    <label style={{ minWidth: 0 }}>
                      <span style={{ fontSize: "0.85rem", color: "#999", marginBottom: "8px", display: "block" }}>Problem Title</span>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g. Longest Palindromic Substring"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", width: "100%" }}
                      />
                    </label>

                    <label style={{ minWidth: 0 }}>
                      <span style={{ fontSize: "0.85rem", color: "#999", marginBottom: "8px", display: "block" }}>Difficulty</span>
                      <select
                        name="difficulty"
                        value={formData.difficulty}
                        onChange={handleInputChange}
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", width: "100%" }}
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </label>
                  </div>

                  <label style={{ marginTop: "20px", display: "block" }}>
                    <span style={{ fontSize: "0.85rem", color: "#999", marginBottom: "8px", display: "block" }}>Short Statement / Summary</span>
                    <textarea
                      name="statement"
                      value={formData.statement}
                      onChange={handleInputChange}
                      required
                      placeholder="A concise version used as the fallback problem statement..."
                      style={{ minHeight: "110px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", lineHeight: "1.6" }}
                    />
                  </label>

                  <div className="form-grid two-up" style={{ marginTop: "20px", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
                    <label style={{ minWidth: 0 }}>
                      <span style={{ fontSize: "0.85rem", color: "#999", marginBottom: "8px", display: "block" }}>Tags</span>
                      <input
                        type="text"
                        name="tags"
                        value={formData.tags}
                        onChange={handleInputChange}
                        placeholder="arrays, greedy, sorting"
                      />
                    </label>
                    <label style={{ minWidth: 0 }}>
                      <span style={{ fontSize: "0.85rem", color: "#999", marginBottom: "8px", display: "block" }}>Time Limit (ms)</span>
                      <input
                        type="number"
                        name="timeLimit"
                        min="100"
                        value={formData.timeLimit}
                        onChange={handleInputChange}
                      />
                    </label>
                    <label style={{ minWidth: 0 }}>
                      <span style={{ fontSize: "0.85rem", color: "#999", marginBottom: "8px", display: "block" }}>Memory (MB)</span>
                      <input
                        type="number"
                        name="memoryLimit"
                        min="16"
                        value={formData.memoryLimit}
                        onChange={handleInputChange}
                      />
                    </label>
                  </div>
                </div>

                {/* Section 2: Structured statement */}
                <div style={{ marginBottom: "40px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px", color: "var(--accent)" }}>
                    <Code2 size={16} />
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>Structured Statement</span>
                  </div>

                  <label style={{ display: "block", marginBottom: "18px" }}>
                    <span style={{ fontSize: "0.85rem", color: "#999", marginBottom: "8px", display: "block" }}>Problem Story</span>
                    <textarea
                      name="problemStory"
                      value={formData.problemStory}
                      onChange={handleInputChange}
                      placeholder="Optional narrative or real-world setup..."
                      style={{ minHeight: "90px" }}
                    />
                  </label>

                  <label style={{ display: "block", marginBottom: "18px" }}>
                    <span style={{ fontSize: "0.85rem", color: "#999", marginBottom: "8px", display: "block" }}>Formal Problem Statement</span>
                    <textarea
                      name="formalStatement"
                      value={formData.formalStatement}
                      onChange={handleInputChange}
                      placeholder="Define exactly what the contestant must compute..."
                      style={{ minHeight: "130px" }}
                    />
                  </label>

                  <div className="form-grid two-up" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", marginBottom: "18px" }}>
                    <label style={{ minWidth: 0 }}>
                      <span style={{ fontSize: "0.85rem", color: "#999", marginBottom: "8px", display: "block" }}>Input Format</span>
                      <textarea
                        name="inputFormat"
                        value={formData.inputFormat}
                        onChange={handleInputChange}
                        placeholder="Describe every input line and value..."
                        style={{ minHeight: "110px" }}
                      />
                    </label>
                    <label style={{ minWidth: 0 }}>
                      <span style={{ fontSize: "0.85rem", color: "#999", marginBottom: "8px", display: "block" }}>Output Format</span>
                      <textarea
                        name="outputFormat"
                        value={formData.outputFormat}
                        onChange={handleInputChange}
                        placeholder="Describe exactly what should be printed..."
                        style={{ minHeight: "110px" }}
                      />
                    </label>
                  </div>

                  <div className="form-grid two-up" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
                    <label style={{ minWidth: 0 }}>
                      <span style={{ fontSize: "0.85rem", color: "#999", marginBottom: "8px", display: "block" }}>Constraints</span>
                      <textarea
                        name="constraints"
                        value={formData.constraints}
                        onChange={handleInputChange}
                        placeholder={"1 ≤ N ≤ 2 × 10⁵\n0 ≤ Aᵢ ≤ 10⁹"}
                        style={{ minHeight: "110px", fontFamily: "monospace" }}
                      />
                    </label>
                    <label style={{ minWidth: 0 }}>
                      <span style={{ fontSize: "0.85rem", color: "#999", marginBottom: "8px", display: "block" }}>Notes or Hints</span>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="Optional clarifications or non-spoiler hints..."
                        style={{ minHeight: "110px" }}
                      />
                    </label>
                  </div>
                </div>

                {/* Section 3: Complexity */}
                <div style={{ marginBottom: "40px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px", color: "var(--accent)" }}>
                    <Activity size={16} />
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>Complexity Targets</span>
                  </div>
                  <div className="form-grid two-up" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
                    <label style={{ minWidth: 0 }}>
                      <span style={{ fontSize: "0.85rem", color: "#999", marginBottom: "8px", display: "block" }}>Time Complexity</span>
                      <input
                        type="text"
                        name="timeComplexity"
                        value={formData.timeComplexity}
                        onChange={handleInputChange}
                        placeholder="e.g. O(N log N)"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", width: "100%" }}
                      />
                    </label>
                    <label style={{ minWidth: 0 }}>
                      <span style={{ fontSize: "0.85rem", color: "#999", marginBottom: "8px", display: "block" }}>Space Complexity</span>
                      <input
                        type="text"
                        name="spaceComplexity"
                        value={formData.spaceComplexity}
                        onChange={handleInputChange}
                        placeholder="e.g. O(1)"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", width: "100%" }}
                      />
                    </label>
                  </div>
                </div>

                {/* Section 4: Test Cases */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent)" }}>
                      <Beaker size={16} />
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>Verification Test Cases</span>
                    </div>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={addTestCase}
                      style={{ padding: "6px 12px", fontSize: "0.8rem", borderRadius: "8px", display: "flex", alignItems: "center", gap: "6px" }}
                    >
                      <Plus size={14} /> Add Case
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {formData.testCases.map((tc, index) => (
                      <div
                        key={index}
                        style={{
                          background: "rgba(255, 255, 255, 0.02)",
                          border: "1px solid rgba(255, 255, 255, 0.06)",
                          borderRadius: "16px",
                          padding: "20px",
                          position: "relative",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ color: "var(--accent)", fontWeight: 700, fontSize: "0.9rem" }}>CASE #{index + 1}</span>
                          </div>
                          {formData.testCases.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeTestCase(index)}
                              style={{ background: "rgba(239, 71, 67, 0.1)", border: "none", color: "var(--danger)", padding: "6px", borderRadius: "6px", cursor: "pointer" }}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                        <div className="form-grid two-up" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                          <label style={{ minWidth: 0 }}>
                            <span style={{ fontSize: "0.75rem", color: "#666", marginBottom: "6px", display: "block" }}>Input Data</span>
                            <textarea
                              value={tc.input}
                              onChange={(e) => handleTestCaseChange(index, "input", e.target.value)}
                              required
                              placeholder="Standard input..."
                              style={{ minHeight: "80px", fontSize: "0.85rem", fontFamily: "monospace", background: "rgba(0,0,0,0.2)", width: "100%" }}
                            />
                          </label>
                          <label style={{ minWidth: 0 }}>
                            <span style={{ fontSize: "0.75rem", color: "#666", marginBottom: "6px", display: "block" }}>Expected Output</span>
                            <textarea
                              value={tc.expectedOutput}
                              onChange={(e) => handleTestCaseChange(index, "expectedOutput", e.target.value)}
                              required
                              placeholder="Standard output..."
                              style={{ minHeight: "80px", fontSize: "0.85rem", fontFamily: "monospace", background: "rgba(0,0,0,0.2)", width: "100%" }}
                            />
                          </label>
                        </div>
                        <label style={{ minWidth: 0, display: "block", marginTop: "14px" }}>
                          <span style={{ fontSize: "0.75rem", color: "#666", marginBottom: "6px", display: "block" }}>Example Explanation (optional)</span>
                          <textarea
                            value={tc.explanation}
                            onChange={(e) => handleTestCaseChange(index, "explanation", e.target.value)}
                            placeholder="Explain why this sample produces the expected output..."
                            style={{ minHeight: "70px", width: "100%" }}
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "24px 32px",
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                justifyContent: "flex-end",
                background: "#1a1a1a",
                gap: "12px",
              }}
            >
              <button
                type="button"
                className="secondary-action"
                onClick={() => setIsModalOpen(false)}
                style={{ minHeight: "44px", padding: "0 24px" }}
              >
                Cancel
              </button>
              <button
                form="problem-form"
                type="submit"
                className="primary-action"
                style={{ minHeight: "44px", padding: "0 28px", display: "flex", alignItems: "center", gap: "8px" }}
              >
                Create Problem <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default ProblemsPage;
