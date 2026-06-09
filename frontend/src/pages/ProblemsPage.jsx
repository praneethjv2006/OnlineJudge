import React, { useState, useEffect } from "react";
import { Plus, Trash2, X, Info, Code2, Beaker, ChevronRight, Activity } from "lucide-react";
import { getProblems, createProblem } from "../services/problemService";

const ProblemsPage = () => {
  const [problems, setProblems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    difficulty: "easy",
    statement: "",
    timeComplexity: "",
    spaceComplexity: "",
    testCases: [{ input: "", expectedOutput: "" }],
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
      testCases: [...prev.testCases, { input: "", expectedOutput: "" }],
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
      await createProblem(formData);
      setIsModalOpen(false);
      setFormData({
        title: "",
        difficulty: "easy",
        statement: "",
        timeComplexity: "",
        spaceComplexity: "",
        testCases: [{ input: "", expectedOutput: "" }],
      });
      fetchProblems();
    } catch (error) {
      console.error("Error creating problem:", error);
      alert("Failed to create problem. " + (error.response?.data?.message || ""));
    }
  };

  return (
    <main className="app-main">
      <div className="page-stack">
        <div className="section-heading inline">
          <div>
            <h1 className="brand-mark">
              <strong>Problems</strong>
            </h1>
            <p className="muted-copy">Practice your coding skills with community-created problems.</p>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Loading problems...</div>
        ) : problems.length === 0 ? (
          <div className="empty-state panel">
            <h3>No problems found</h3>
            <p>Be the first to create a problem!</p>
          </div>
        ) : (
          <div className="contest-grid">
            {problems.map((problem) => (
              <div key={problem._id} className="contest-card panel clickable-card">
                <div className="contest-card-head">
                  <h3 style={{ margin: 0 }}>{problem.title}</h3>
                  <span className={`difficulty-tag ${problem.difficulty}`}>
                    {problem.difficulty.toUpperCase()}
                  </span>
                </div>
                <p style={{ margin: "12px 0", color: "var(--muted)", fontSize: "0.9rem" }}>
                  {problem.statement.substring(0, 100)}...
                </p>
                <div className="contest-meta">
                  <div>
                    <dt>Complexity</dt>
                    <dd>{problem.timeComplexity || "N/A"}</dd>
                  </div>
                  <div>
                    <dt>Space</dt>
                    <dd>{problem.spaceComplexity || "N/A"}</dd>
                  </div>
                </div>
                <div className="contest-owner" style={{ marginTop: "auto", paddingTop: "12px" }}>
                  <span style={{ fontSize: "0.8rem" }}>Created by {problem.createdBy?.name || "Unknown"}</span>
                </div>
              </div>
            ))}
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
                    <span style={{ fontSize: "0.85rem", color: "#999", marginBottom: "8px", display: "block" }}>Problem Statement</span>
                    <textarea
                      name="statement"
                      value={formData.statement}
                      onChange={handleInputChange}
                      required
                      placeholder="Explain the problem clearly, including constraints and examples..."
                      style={{ minHeight: "180px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", lineHeight: "1.6" }}
                    />
                  </label>
                </div>

                {/* Section 2: Complexity */}
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

                {/* Section 3: Test Cases */}
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