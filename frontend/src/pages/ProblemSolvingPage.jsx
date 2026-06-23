import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppContext } from "../App";
import { 
  getProblem, 
  getProblemSubmissions, 
  runProblemCode,
  analyzeCode
} from "../services/problemService";
import Editor from "@monaco-editor/react";
import Modal from "../components/common/Modal";
import ProblemText from "../components/problems/ProblemText";
import { toast } from "../components/common/Toast";
import { 
  FileText, 
  Code2, 
  ChevronUp, 
  ChevronDown, 
  RotateCcw, 
  Clock, 
  Terminal,
  CheckCircle2,
  XCircle,
  Play,
  Send,
  History,
  ArrowLeft,
  Loader2,
  Info,
  Wand2,
  X
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

const hasFunctionScaffold = (problem, language) =>
  Boolean(
    problem?.isFunctionMode &&
      problem?.codeTemplates?.[language] &&
      problem?.driverCode?.[language]
  );

const formatCompactStarterCode = (source, language) => {
  if (!source || !["cpp", "c", "javascript"].includes(language)) return source;
  if (source.includes("\n")) return source;

  let indent = 0;
  return source
    .replace(/\{\s*/g, "{\n")
    .replace(/;\s*/g, ";\n")
    .replace(/\}\s*/g, "\n}\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (line.startsWith("}")) indent = Math.max(indent - 1, 0);
      const padded = `${"    ".repeat(indent)}${line}`;
      if (line.endsWith("{")) indent += 1;
      return padded;
    })
    .join("\n");
};

const getStarterCode = (problem, language, useFunctionMode) => {
  if (useFunctionMode && hasFunctionScaffold(problem, language)) {
    return formatCompactStarterCode(problem.codeTemplates[language], language);
  }

  return DEFAULT_CODE_TEMPLATES[language] || DEFAULT_CODE_TEMPLATES.cpp;
};

function ProblemSolvingPage() {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const { user } = useAppContext();
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
  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);

  // Analyze state
  const [isAnalyzeOpen, setIsAnalyzeOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisType, setAnalysisType] = useState(null);
  const analyzeRef = useRef(null);

  // New state for mode toggle, accordions, and interview poll
  const [isFunctionMode, setIsFunctionMode] = useState(false);
  const [expandedAccordions, setExpandedAccordions] = useState({
    limits: false,
    topics: false,
    interview: false,
    stats: false,
  });
  const [interviewPoll, setInterviewPoll] = useState(() => {
    const saved = localStorage.getItem(`poll-${problemId}`);
    return saved ? JSON.parse(saved) : null;
  });

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
          setIsFunctionMode(hasFunctionScaffold(data, language));
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

  const canUseFunctionMode = useMemo(
    () => hasFunctionScaffold(problem, language),
    [problem, language]
  );

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
    if (!problem) return;

    if (isFunctionMode && !canUseFunctionMode) {
      setIsFunctionMode(false);
      return;
    }

    setCode(getStarterCode(problem, language, isFunctionMode));
  }, [language, isFunctionMode, canUseFunctionMode, problem]);

  // Update interview poll
  const handleInterviewPoll = (answer) => {
    const newPoll = { answer, timestamp: new Date().toISOString() };
    setInterviewPoll(newPoll);
    localStorage.setItem(`poll-${problemId}`, JSON.stringify(newPoll));
  };

  // Toggle accordion
  const toggleAccordion = (key) => {
    setExpandedAccordions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

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
        customTestCases: customTestCases.length > 0 ? customTestCases : undefined,
        isFunctionMode: isFunctionMode && canUseFunctionMode
      });
      setRunResults(data.results || []);
      const newStatuses = {};
      (data.results || []).forEach((res, idx) => {
        newStatuses[idx] = {
          status:
            res.verdict === 'Accepted'
              ? 'passed'
              : res.verdict === 'Executed'
                ? 'neutral'
                : 'failed'
        };
      });
      setTestCaseStatuses(newStatuses);
    } catch (err) {
      toast.error(err.message || "Execution error.");
    } finally {
      setIsRunning(false);
    }
  };

  const executeSubmit = async () => {
    setIsConfirmSubmitOpen(false);
    setIsSubmitting(true);
    setIsConsoleExpanded(true);
    setConsoleTab("result");
    setSelectedTestCase(0);
    try {
      const data = await runProblemCode(problemId, {
        code,
        language,
        isSubmit: true,
        isFunctionMode: isFunctionMode && canUseFunctionMode
      });
      setRunResults(data.results || []);
      const newStatuses = {};
      const allPassed = (data.results || []).every((res, idx) => {
        const passed = res.verdict === 'Accepted';
        newStatuses[idx] = { status: passed ? 'passed' : 'failed' };
        return passed;
      });
      setTestCaseStatuses(newStatuses);
      
      if (allPassed) {
        toast.success("All test cases passed! Submitted successfully.");
      } else {
        toast.error("Some test cases failed.");
      }
      fetchSubmissions();
    } catch (err) {
      toast.error(err.message || "Submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (!problem) return;
    if (!user) {
      toast.info("Please sign in to submit your solution.");
      navigate("/auth");
      return;
    }
    setIsConfirmSubmitOpen(true);
  };

  const handleAnalyze = async (type) => {
    setIsAnalyzeOpen(false);
    setIsAnalyzing(true);
    setAnalysisType(type);
    setAnalysisResult(null);
    try {
      const data = await analyzeCode({ 
        code, 
        type, 
        problemId 
      });
      setAnalysisResult(data.result);
    } catch {
      setAnalysisResult("Failed to analyze code. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderAnalysisContent = () => {
    if (!analysisResult) return null;

    if (analysisType === 'complexity') {
      const lines = analysisResult.split('\n');
      const timeLine = lines.find(l => l.toLowerCase().includes('time complexity'))?.split(':')[1]?.trim() || "N/A";
      const spaceLine = lines.find(l => l.toLowerCase().includes('space complexity'))?.split(':')[1]?.trim() || "N/A";

      return (
        <div className="analysis-cards">
          <div className="analysis-card complexity-card">
            <div className="card-icon"><Clock size={20} /></div>
            <div className="card-info">
              <label>Time Complexity</label>
              <strong>{timeLine}</strong>
            </div>
          </div>
          <div className="analysis-card complexity-card">
            <div className="card-icon"><Code2 size={20} /></div>
            <div className="card-info">
              <label>Space Complexity</label>
              <strong>{spaceLine}</strong>
            </div>
          </div>
        </div>
      );
    }

    if (analysisType === 'edgeCases') {
      const points = analysisResult.split('\n').filter(p => p.trim() !== '');
      return (
        <div className="analysis-list">
          {points.map((point, i) => (
            <div key={i} className="analysis-list-item">
              <div className="item-bullet">{i + 1}</div>
              <div className="item-text">{point.replace(/^\d+\.\s*/, '').trim()}</div>
            </div>
          ))}
        </div>
      );
    }

    if (analysisType === 'review') {
      const lines = analysisResult.split('\n');
      const verdict = lines.find(l => l.toLowerCase().startsWith('verdict:'))?.split(':')[1]?.trim() || "Analyzed";
      const optimizations = lines.filter(l => !l.toLowerCase().startsWith('verdict:') && !l.toLowerCase().startsWith('optimizations:') && l.trim() !== '');

      return (
        <div className="analysis-review">
          <div className={`verdict-badge ${verdict.toLowerCase().includes('correct') ? 'verdict-pass' : verdict.toLowerCase().includes('incorrect') ? 'verdict-fail' : 'verdict-warn'}`}>
            {verdict}
          </div>
          {optimizations.length > 0 && (
            <div className="optimizations-section">
              <h4>Key Optimizations</h4>
              <div className="analysis-list">
                {optimizations.map((opt, i) => (
                  <div key={i} className="analysis-list-item">
                    <div className="item-bullet opt-bullet"><Info size={14} /></div>
                    <div className="item-text">{opt.replace(/^\d+\.\s*/, '').trim()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="analysis-content-box">
        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
          {analysisResult}
        </pre>
      </div>
    );
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (analyzeRef.current && !analyzeRef.current.contains(event.target)) {
        setIsAnalyzeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

            <div className="analyze-wrapper" ref={analyzeRef}>
              <button 
                className={`btn-analyze ${isAnalyzeOpen ? 'active' : ''}`}
                onClick={() => setIsAnalyzeOpen(!isAnalyzeOpen)}
                disabled={isRunning || isSubmitting || isAnalyzing}
              >
                <Wand2 size={14} /> Analyze
              </button>
              {isAnalyzeOpen && (
                <div className="analyze-dropdown">
                  <button onClick={() => handleAnalyze('complexity')}>Complexity</button>
                  <button onClick={() => handleAnalyze('edgeCases')}>Edge Cases</button>
                  <button onClick={() => handleAnalyze('review')}>Review</button>
                </div>
              )}
            </div>

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

      {isAnalyzing && (
        <div className="analysis-overlay">
          <div className="analysis-modal">
            <div className="modal-header">
              <h3>Analyzing Code...</h3>
            </div>
            <div className="modal-body flex-center">
              <Loader2 size={32} className="anim-spin" />
              <p>Fetching {analysisType} analysis...</p>
            </div>
          </div>
        </div>
      )}

      {analysisResult && (
        <div className="analysis-overlay" onClick={() => setAnalysisResult(null)}>
          <div className="analysis-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{analysisType === 'complexity' ? 'Code Complexity' : analysisType === 'edgeCases' ? 'Critical Edge Cases' : 'AI Code Review'}</h3>
              <button className="close-btn" onClick={() => setAnalysisResult(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {renderAnalysisContent()}
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={isConfirmSubmitOpen}
        onClose={() => setIsConfirmSubmitOpen(false)}
        title="Submit Solution"
        footer={
          <>
            <button
              className="modal-btn modal-btn-cancel"
              onClick={() => setIsConfirmSubmitOpen(false)}
            >
              Cancel
            </button>
            <button
              className="modal-btn modal-btn-submit"
              onClick={executeSubmit}
            >
              Submit
            </button>
          </>
        }
      >
        <p>Are you sure you want to submit? Your code will be evaluated against all test cases.</p>
      </Modal>

      <Modal
        isOpen={isConfirmResetOpen}
        onClose={() => setIsConfirmResetOpen(false)}
        title="Reset Code"
        footer={
          <>
            <button
              className="modal-btn modal-btn-cancel"
              onClick={() => setIsConfirmResetOpen(false)}
            >
              Cancel
            </button>
            <button
              className="modal-btn modal-btn-danger"
              onClick={() => {
                setCode(getStarterCode(problem, language, isFunctionMode && canUseFunctionMode));
                setIsConfirmResetOpen(false);
                toast.success("Code reset to default template.");
              }}
            >
              Reset
            </button>
          </>
        }
      >
        <p>Are you sure you want to reset your code to the current starter template? Your current changes will be lost.</p>
      </Modal>

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

            <div className={`panel-content ${leftTab === "description" ? "problem-description-panel" : ""}`}>
              {leftTab === 'description' ? (
                <div className="problem-statement-container">
                  <div className="problem-statement-scroll">

                    {/* Header - Clean Version */}
                    <div className="problem-display-header">
                      <div className="problem-display-kicker">
                        Practice problem
                        {problem.createdBy?.name && <span>by {problem.createdBy.name}</span>}
                      </div>
                      <div className="problem-header-top">
                        <h1 className="problem-display-title">{problem.title}</h1>
                        <span className={`problem-display-difficulty ${problem.difficulty}`}>
                          {problem.difficulty}
                        </span>
                      </div>
                      <p className="problem-display-subtitle">
                        Read the statement, spot the pattern, and push the cleanest accepted solution you can.
                      </p>
                    </div>

                    <div className="problem-document">
                      {problem.problemStory && (
                        <aside className="problem-story-callout">
                          <span>Story</span>
                          <ProblemText text={problem.problemStory} />
                        </aside>
                      )}

                      <section className="problem-section">
                        <h3 className="problem-section-title">
                          <Code2 size={15} /> Problem Statement
                        </h3>
                        <div className="problem-section-content">
                          <ProblemText text={problem.formalStatement || problem.statement} />
                        </div>
                      </section>

                      {problem.inputFormat && (
                        <section className="problem-section">
                          <h3 className="problem-section-title">
                            <ArrowLeft size={15} style={{ transform: 'rotate(135deg)' }} /> Input Format
                          </h3>
                          <div className="problem-section-content">
                            <ProblemText text={problem.inputFormat} />
                          </div>
                        </section>
                      )}

                      {problem.outputFormat && (
                        <section className="problem-section">
                          <h3 className="problem-section-title">
                            <ArrowLeft size={15} style={{ transform: 'rotate(-45deg)' }} /> Output Format
                          </h3>
                          <div className="problem-section-content">
                            <ProblemText text={problem.outputFormat} />
                          </div>
                        </section>
                      )}

                      {problem.constraints && (
                        <section className="problem-section constraints-section">
                          <h3 className="problem-section-title">
                            <XCircle size={15} /> Constraints
                          </h3>
                          <div className="constraint-list">
                            {problem.constraints.split("\n").filter(Boolean).map((constraint, index) => (
                              <code key={`${constraint}-${index}`}>{constraint.trim()}</code>
                            ))}
                          </div>
                        </section>
                      )}

                      {(problem.examples?.length > 0 || problem.testCases?.length > 0) && (
                        <section className="problem-section examples-section">
                          <h3 className="problem-section-title">
                            <CheckCircle2 size={15} /> Examples
                          </h3>
                          <div className="problem-examples-container">
                            {(problem.examples?.length > 0 ? problem.examples : problem.testCases.slice(0, 3)).map((ex, i) => (
                              <div key={i} className="problem-example-card">
                                <div className="example-card-header">
                                  <span>Example {i + 1}</span>
                                </div>
                                <div className="example-card-body">
                                  <div className="example-io-grid">
                                    <div className="example-io-row">
                                      <div className="example-io-label">Input</div>
                                      <pre className="example-io-value">{ex.input}</pre>
                                    </div>
                                    <div className="example-io-row">
                                      <div className="example-io-label">Output</div>
                                      <pre className="example-io-value">{ex.output || ex.expectedOutput}</pre>
                                    </div>
                                  </div>
                                  {ex.explanation && (
                                    <details className="example-explanation-dropdown">
                                      <summary>Explanation</summary>
                                      <div className="example-explanation">
                                        <ProblemText text={ex.explanation} />
                                      </div>
                                    </details>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}

                      {problem.notes && (
                        <section className="problem-section notes-section">
                          <h3 className="problem-section-title">
                            <Terminal size={15} /> Notes & Hints
                          </h3>
                          <div className="problem-notes-box">
                            <ProblemText text={problem.notes} />
                          </div>
                        </section>
                      )}

                      {/* Accordions Section */}
                      <div className="problem-accordions-section">
                        
                        {/* Complexity & Limits Accordion */}
                        <div className="accordion-item">
                          <button 
                            className={`accordion-button ${expandedAccordions['limits'] ? 'expanded' : ''}`}
                            onClick={() => toggleAccordion('limits')}
                          >
                            <span><Clock size={15} /> Complexity & Limits</span>
                            <ChevronDown size={16} style={{ transform: expandedAccordions['limits'] ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
                          </button>
                          {expandedAccordions['limits'] && (
                            <div className="accordion-content">
                              <div className="accordion-grid">
                                <div className="accordion-item-box">
                                  <label>Time Limit</label>
                                  <span className="accordion-value">{problem.timeLimit || 2000} ms</span>
                                </div>
                                <div className="accordion-item-box">
                                  <label>Memory Limit</label>
                                  <span className="accordion-value">{problem.memoryLimit || 256} MB</span>
                                </div>
                                {problem.timeComplexity && (
                                  <div className="accordion-item-box">
                                    <label>Expected Time Complexity</label>
                                    <span className="accordion-value">{problem.timeComplexity}</span>
                                  </div>
                                )}
                                {problem.spaceComplexity && (
                                  <div className="accordion-item-box">
                                    <label>Expected Space Complexity</label>
                                    <span className="accordion-value">{problem.spaceComplexity}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Topics & Tags Accordion */}
                        {(problem.topics?.length > 0 || problem.tags?.length > 0) && (
                          <div className="accordion-item">
                            <button 
                              className={`accordion-button ${expandedAccordions['topics'] ? 'expanded' : ''}`}
                              onClick={() => toggleAccordion('topics')}
                            >
                              <span><Code2 size={15} /> Topics & Tags</span>
                              <ChevronDown size={16} style={{ transform: expandedAccordions['topics'] ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
                            </button>
                            {expandedAccordions['topics'] && (
                              <div className="accordion-content">
                                {problem.topics?.length > 0 && (
                                  <div className="accordion-tags-group">
                                    <label>Topics</label>
                                    <div className="tags-container">
                                      {problem.topics.map((topic, i) => (
                                        <span key={i} className="tag-badge topic-badge">{topic}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {problem.tags?.length > 0 && (
                                  <div className="accordion-tags-group">
                                    <label>Tags</label>
                                    <div className="tags-container">
                                      {problem.tags.map((tag, i) => (
                                        <span key={i} className="tag-badge skill-badge">{tag}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Interview Poll Accordion */}
                        <div className="accordion-item">
                          <button 
                            className={`accordion-button ${expandedAccordions['interview'] ? 'expanded' : ''}`}
                            onClick={() => toggleAccordion('interview')}
                          >
                            <span><Info size={15} /> Interview Experience</span>
                            <ChevronDown size={16} style={{ transform: expandedAccordions['interview'] ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
                          </button>
                          {expandedAccordions['interview'] && (
                            <div className="accordion-content">
                              <div className="interview-poll-box">
                                <p className="poll-question">Seen in a real interview before?</p>
                                <div className="poll-buttons">
                                  <button 
                                    className={`poll-btn yes-btn ${interviewPoll?.answer === 'yes' ? 'selected' : ''}`}
                                    onClick={() => handleInterviewPoll('yes')}
                                  >
                                    Yes
                                  </button>
                                  <button 
                                    className={`poll-btn no-btn ${interviewPoll?.answer === 'no' ? 'selected' : ''}`}
                                    onClick={() => handleInterviewPoll('no')}
                                  >
                                    No
                                  </button>
                                </div>
                                <div className="poll-stats">
                                  <div className="stat-bar">
                                    <div className="stat-bar-segment yes-segment" style={{ width: '72%' }}>
                                      <span>72% Yes</span>
                                    </div>
                                    <div className="stat-bar-segment no-segment" style={{ width: '28%' }}>
                                      <span>28% No</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Difficulty & Acceptance Stats */}
                        <div className="accordion-item">
                          <button 
                            className={`accordion-button ${expandedAccordions['stats'] ? 'expanded' : ''}`}
                            onClick={() => toggleAccordion('stats')}
                          >
                            <span><CheckCircle2 size={15} /> Statistics</span>
                            <ChevronDown size={16} style={{ transform: expandedAccordions['stats'] ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
                          </button>
                          {expandedAccordions['stats'] && (
                            <div className="accordion-content">
                              <div className="stats-cards">
                                <div className="stat-card">
                                  <label>Difficulty</label>
                                  <div className="difficulty-badge-large" data-difficulty={problem.difficulty}>
                                    {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                                  </div>
                                </div>
                                <div className="stat-card">
                                  <label>Acceptance Rate</label>
                                  <div className="acceptance-rate">
                                    <span className="rate-number">
                                      {problem.difficulty === 'easy' ? '42%' : problem.difficulty === 'medium' ? '28%' : '12%'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
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
                <div className="toolbar-left">
                  <div className="lang-picker">
                    <Code2 size={14} color="var(--accent)" />
                    <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                      {LANGUAGE_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                    </select>
                  </div>
                  {problem.isFunctionMode && (
                    <div className="mode-selector">
                      <select value={isFunctionMode && canUseFunctionMode ? 'function' : 'io'} onChange={(e) => setIsFunctionMode(e.target.value === 'function')} disabled={!canUseFunctionMode}>
                        {canUseFunctionMode && <option value="function">Complete the Function</option>}
                        <option value="io">Standard I/O</option>
                      </select>
                    </div>
                  )}
                </div>
                <button className="reset-btn" onClick={() => setIsConfirmResetOpen(true)} title="Reset Code">
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
                  options={{
                    fontSize: 14,
                    lineHeight: 22,
                    tabSize: 4,
                    insertSpaces: true,
                    detectIndentation: false,
                    formatOnPaste: true,
                    formatOnType: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    wordWrap: "off",
                    renderLineHighlight: "line",
                  }}
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
                              placeholder="Leave empty to just run and inspect your output..."
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
                                ) : runResults[selectedTestCase].verdict === 'Executed' ? (
                                  <Terminal size={16} color="var(--accent)" />
                                ) : (
                                  <XCircle size={16} color="var(--danger)" />
                                )}
                                <span className={runResults[selectedTestCase].verdict === 'Accepted' ? 'pass' : runResults[selectedTestCase].verdict === 'Executed' ? 'neutral' : 'fail'}>
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
