import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { 
  getProblem, 
  getProblemSubmissions, 
  runProblemCode 
} from "../services/problemService";
import Editor from "@monaco-editor/react";
import { 
  FileText, 
  Code2, 
  ChevronUp, 
  ChevronDown, 
  RotateCcw, 
  Terminal,
  CheckCircle2,
  XCircle,
  Play,
  Send,
  History,
  ArrowLeft,
  Loader2,
  Info
} from "lucide-react";

const LANGUAGE_OPTIONS = [
  { id: "cpp", label: "C++" },
  { id: "c", label: "C" },
  { id: "python", label: "Python" },
  { id: "javascript", label: "JavaScript" },
];

const DEFAULT_CODE_TEMPLATES = {
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    // Write your solution here
    return 0;
}`,
  c: `#include <stdio.h>

int main() {
    // Write your solution here
    return 0;
}`,
  python: `# Write your solution here
import sys

# Example: read from stdin
# data = sys.stdin.read().strip()

# Your code goes here
`,
  javascript: `// Write your solution here
const fs = require("fs");

// const input = fs.readFileSync(0, "utf8").trim();

// Your code goes here
`,
};

function ProblemSolvingPage() {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const { user } = useOutletContext();
  const [problem, setProblem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [leftTab, setLeftTab] = useState("description");
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState(DEFAULT_CODE_TEMPLATES.cpp);
  const [runResults, setRunResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testCaseStatuses, setTestCaseStatuses] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConsoleExpanded, setIsConsoleExpanded] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState(0);
  const [consoleTab, setConsoleTab] = useState("testcase");
  const [customInput, setCustomInput] = useState("");
  const [customExpected, setCustomExpected] = useState("");
  const [leftWidth, setLeftWidth] = useState(50); // percentage
  const [isResizing, setIsResizing] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [isSubmissionsLoading, setIsSubmissionsLoading] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    setIsSubmissionsLoading(true);
    try {
      const data = await getProblemSubmissions(problemId);
      setSubmissions(data.submissions || []);
    } catch {
      // Failed to load submissions
    } finally {
      setIsSubmissionsLoading(false);
    }
  }, [problemId]);

  useEffect(() => {
    if (leftTab === 'submissions') {
      fetchSubmissions();
    }
  }, [leftTab, fetchSubmissions]);

  useEffect(() => {
    let isMounted = true;
    const fetchProblem = async () => {
      setIsLoading(true);
      try {
        const data = await getProblem(problemId);
        if (isMounted) {
          setProblem(data);
        }
      } catch {
        if (isMounted) setError("Failed to load problem.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchProblem();
    return () => { isMounted = false; };
  }, [problemId]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const newWidth = (e.clientX / window.innerWidth) * 100;
      if (newWidth > 20 && newWidth < 80) {
        setLeftWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.classList.remove('is-resizing');
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const startResizing = () => {
    setIsResizing(true);
    document.body.classList.add('is-resizing');
  };

  useEffect(() => {
    setCode(DEFAULT_CODE_TEMPLATES[language] || DEFAULT_CODE_TEMPLATES.cpp);
  }, [language]);

  const handleRunTestCases = async () => {
    if (!problem) return;
    setIsRunning(true);
    setIsConsoleExpanded(true);
    setConsoleTab("result");
    setSelectedTestCase(customInput.trim() ? (problem.testCases?.length || 0) : 0);
    
    try {
      const customTestCases = [];
      if (customInput.trim()) {
        // Run all default test cases + the custom one
        const defaultCases = (problem.testCases || []).map(tc => ({
          input: tc.input || "",
          expectedOutput: tc.expectedOutput || ""
        }));
        customTestCases.push(...defaultCases);
        customTestCases.push({
          input: customInput,
          expectedOutput: customExpected,
        });
      }

      const data = await runProblemCode(problemId, {
        code,
        language,
        isSubmit: false,
        customTestCases: customTestCases.length > 0 ? customTestCases : undefined
      });
      setRunResults(data.results || []);
      const newStatuses = {};
      (data.results || []).forEach((res, idx) => {
        newStatuses[idx] = { status: res.verdict === 'Accepted' ? 'passed' : 'failed' };
      });
      setTestCaseStatuses(newStatuses);
    } catch {
      // Execution error
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!problem) return;
    if (!window.confirm("Submit your solution?")) return;
    setIsSubmitting(true);
    setIsConsoleExpanded(true);
    setConsoleTab("result");
    setSelectedTestCase(0);
    try {
      const data = await runProblemCode(problemId, {
        code,
        language,
        isSubmit: true,
      });
      setRunResults(data.results || []);
      const newStatuses = {};
      (data.results || []).forEach((res, idx) => {
        newStatuses[idx] = { status: res.verdict === 'Accepted' ? 'passed' : 'failed' };
      });
      setTestCaseStatuses(newStatuses);
      alert("Submitted successfully!");
      fetchSubmissions();
    } catch {
      alert("Submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="loading-state">Loading...</div>;
  if (!problem) return <div className="error-state">{error || "Problem not found."}</div>;

  return (
    <section className="contest-workspace-root">
      <header className="workspace-header">
        <div className="header-left">
          <button className="back-to-contests" onClick={() => navigate("/problems")}>
            <ArrowLeft size={16} /> Back
          </button>
          <div className="problem-nav">
            <span className="current-problem-title">
              {problem.title}
            </span>
          </div>
        </div>

        <div className="header-right">
          <div className="workspace-actions">
            <button 
              className={`btn-run ${isRunning ? 'loading' : ''}`} 
              onClick={handleRunTestCases} 
              disabled={isRunning || isSubmitting}
            >
              {isRunning ? <Loader2 size={14} className="anim-spin" /> : <Play size={14} />} 
              Run
            </button>
            <button 
              className={`btn-submit ${isSubmitting ? 'loading' : ''}`} 
              onClick={handleSubmit} 
              disabled={isSubmitting || isRunning}
            >
              {isSubmitting ? <Loader2 size={14} className="anim-spin" /> : <Send size={14} />} 
              Submit
            </button>
          </div>
          <div className="user-profile-mini">
            <div className="avatar-small">{user?.name?.[0]?.toUpperCase()}</div>
          </div>
        </div>
      </header>

      <main className="workspace-main">
        <div className="leetcode-layout" style={{ gridTemplateColumns: `${leftWidth}% 6px 1fr` }}>
          <div className="leetcode-left-panel">
            <div className="panel-tabs">
              <button className={`panel-tab ${leftTab === 'description' ? 'active' : ''}`} onClick={() => setLeftTab('description')}>
                <FileText size={16} /> Description
              </button>
              <button className={`panel-tab ${leftTab === 'submissions' ? 'active' : ''}`} onClick={() => setLeftTab('submissions')}>
                <History size={16} /> Submissions
              </button>
            </div>

            <div className="panel-content">
              {leftTab === 'description' ? (
                <div className="description-view">
                  <h2 className="problem-title">{problem.title}</h2>
                  <div className="problem-meta">
                    <span className={`difficulty-tag-v2 ${problem.difficulty}`}>{problem.difficulty}</span>
                    <span className="meta-item"><Info size={14}/> {problem.timeComplexity || "N/A"}</span>
                  </div>
                  <div className="problem-body">
                    <p style={{ whiteSpace: 'pre-wrap' }}>{problem.statement}</p>
                    <div className="example-section">
                      {problem.testCases?.slice(0, 2).map((tc, i) => (
                        <div key={i} className="example-block">
                          <h5>Example {i + 1}</h5>
                          <div className="io-group">
                            <p><strong>Input:</strong> <code>{tc.input}</code></p>
                            <p><strong>Output:</strong> <code>{tc.expectedOutput}</code></p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="submissions-view">
                  <h3 className="section-title">My Submissions</h3>
                  {isSubmissionsLoading ? (
                    <div className="loading-sub">Loading...</div>
                  ) : submissions.length === 0 ? (
                    <div className="empty-sub">No submissions found for this question.</div>
                  ) : (
                    <div className="sub-list">
                      {submissions.map((sub, idx) => (
                        <div key={sub._id || idx} className="sub-card">
                          <div className="sub-row">
                            <span className={`verdict-tag ${sub.verdict === 'Accepted' ? 'pass' : 'fail'}`}>
                              {sub.verdict}
                            </span>
                            <span className="sub-date">{new Date(sub.submittedAt).toLocaleString()}</span>
                          </div>
                          <div className="sub-row">
                            <span className="sub-lang">{sub.language}</span>
                            <button className="view-code-link" onClick={() => setCode(sub.code)}>Load Code</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="resizer-v" onMouseDown={startResizing}></div>

          <div className="leetcode-right-panel">
            <div className="editor-container">
              <div className="editor-toolbar-clean">
                <div className="lang-picker">
                  <Code2 size={14} color="var(--accent)" />
                  <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                    {LANGUAGE_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                  </select>
                </div>
                <button className="reset-btn" onClick={() => setCode(DEFAULT_CODE_TEMPLATES[language])} title="Reset Code">
                  <RotateCcw size={14} />
                </button>
              </div>
              <div className="monaco-wrapper">
                <Editor
                  height="100%"
                  language={language === 'cpp' ? 'cpp' : language === 'javascript' ? 'javascript' : language === 'python' ? 'python' : 'c'}
                  theme="vs-dark"
                  value={code}
                  onChange={setCode}
                  options={{ fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false, automaticLayout: true }}
                />
              </div>
            </div>

            <div className={`console-panel ${isConsoleExpanded ? 'expanded' : ''}`}>
              <div className="console-bar" onClick={() => setIsConsoleExpanded(!isConsoleExpanded)}>
                <div className="bar-left"><Terminal size={14} /> Console</div>
                {isConsoleExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </div>
              {isConsoleExpanded && (
                <div className="console-body">
                  <div className="console-mode-tabs">
                    <button 
                      className={`console-mode-tab ${consoleTab === 'testcase' ? 'active' : ''}`}
                      onClick={() => setConsoleTab('testcase')}
                    >
                      Testcase
                    </button>
                    <button 
                      className={`console-mode-tab ${consoleTab === 'result' ? 'active' : ''}`}
                      onClick={() => setConsoleTab('result')}
                    >
                      Result
                    </button>
                  </div>

                  {consoleTab === 'testcase' ? (
                    <div className="console-testcase-content">
                      <div className="tc-tabs">
                        {problem.testCases?.map((_, idx) => (
                          <button 
                            key={idx} 
                            className={`tc-tab ${selectedTestCase === idx ? 'active' : ''}`}
                            onClick={() => setSelectedTestCase(idx)}
                          >
                            Case {idx + 1}
                          </button>
                        ))}
                        <button 
                          className={`tc-tab custom-tc-tab ${selectedTestCase === (problem.testCases?.length || 0) ? 'active' : ''}`}
                          onClick={() => setSelectedTestCase(problem.testCases?.length || 0)}
                        >
                          Custom Case
                        </button>
                      </div>

                      {selectedTestCase < (problem.testCases?.length || 0) ? (
                        <div className="tc-details">
                          <div className="io-box">
                            <label>Input</label>
                            <pre>{problem.testCases[selectedTestCase]?.input}</pre>
                          </div>
                          <div className="io-box">
                            <label>Expected Output</label>
                            <pre>{problem.testCases[selectedTestCase]?.expectedOutput}</pre>
                          </div>
                        </div>
                      ) : (
                        <div className="tc-details custom-tc-inputs">
                          <div className="io-box">
                            <label>Custom Input</label>
                            <textarea 
                              className="custom-tc-textarea"
                              value={customInput}
                              onChange={(e) => setCustomInput(e.target.value)}
                              placeholder="Enter custom input..."
                              rows={4}
                            />
                          </div>
                          <div className="io-box">
                            <label>Custom Expected Output (Optional)</label>
                            <textarea 
                              className="custom-tc-textarea"
                              value={customExpected}
                              onChange={(e) => setCustomExpected(e.target.value)}
                              placeholder="Enter expected output to verify against..."
                              rows={4}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="console-result-content">
                      {(isRunning || isSubmitting) ? (
                        <div className="loading-results anim-pulse">
                          <Loader2 size={24} className="anim-spin" />
                          <span>Executing test cases...</span>
                        </div>
                      ) : runResults.length === 0 ? (
                        <div className="empty-results">
                          <span>Please run your code to see the execution results.</span>
                        </div>
                      ) : (
                        <>
                          <div className="tc-tabs">
                            {runResults.map((res, idx) => {
                              const isCustom = idx >= (problem.testCases?.length || 0);
                              return (
                                <button 
                                  key={idx} 
                                  className={`tc-tab ${selectedTestCase === idx ? 'active' : ''} ${testCaseStatuses[idx]?.status || ''}`}
                                  onClick={() => setSelectedTestCase(idx)}
                                >
                                  {isCustom ? "Custom Case" : `Case ${idx + 1}`}
                                </button>
                              );
                            })}
                          </div>

                          {runResults[selectedTestCase] ? (
                            <div className="result-detail">
                              <div className="verdict-line">
                                {runResults[selectedTestCase].verdict === 'Accepted' ? (
                                  <CheckCircle2 size={16} color="var(--success)" />
                                ) : (
                                  <XCircle size={16} color="var(--danger)" />
                                )}
                                <span className={runResults[selectedTestCase].verdict === 'Accepted' ? 'pass' : 'fail'}>
                                  {runResults[selectedTestCase].verdict}
                                </span>
                              </div>
                              
                              {runResults[selectedTestCase].stderr && (
                                <div className="io-box error-box">
                                  <label>Error / Stderr</label>
                                  <pre className="stderr-pre">{runResults[selectedTestCase].stderr}</pre>
                                </div>
                              )}

                              <div className="io-box">
                                <label>Input</label>
                                <pre>{runResults[selectedTestCase].input}</pre>
                              </div>
                              <div className="io-box">
                                <label>Output</label>
                                <pre className={runResults[selectedTestCase].verdict === 'Accepted' ? 'stdout-pass' : 'stdout-fail'}>
                                  {runResults[selectedTestCase].stdout || "(no output)"}
                                </pre>
                              </div>
                              {runResults[selectedTestCase].expectedOutput && (
                                <div className="io-box">
                                  <label>Expected Output</label>
                                  <pre>{runResults[selectedTestCase].expectedOutput}</pre>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="empty-results">
                              <span>No results for the selected case.</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </section>
  );
}

export default ProblemSolvingPage;
