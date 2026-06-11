import { useCallback, useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { 
  getContestSubmissions, 
  loadContest, 
  runContestCode, 
  startContest,
  endContest
} from "../services/contestService";
import { analyzeCode } from "../services/problemService";
import Editor from "@monaco-editor/react";
import { 
  FileText, 
  Code2, 
  ChevronUp, 
  ChevronDown, 
  RotateCcw, 
  Trophy, 
  Clock, 
  ChevronRight,
  ChevronLeft,
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

data = sys.stdin.read().strip()

# Example: echo input
print(data)
`,
  javascript: `// Write your solution here
const fs = require("fs");

const input = fs.readFileSync(0, "utf8").trim();

// Example: echo input
console.log(input);
`,
};

const formatCountdown = (dateValue, referenceTime = Date.now()) => {
  if (!dateValue) return "00:00:00";
  const remainingMs = new Date(dateValue).getTime() - referenceTime;
  if (remainingMs <= 0) return "00:00:00";
  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

function ContestRoomPage() {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const { user } = useOutletContext();
  const [contest, setContest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [leftTab, setLeftTab] = useState("description");
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState(DEFAULT_CODE_TEMPLATES.cpp);
  const [runResults, setRunResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [nowTick, setNowTick] = useState(Date.now());
  const [isFullscreen] = useState(true); 
  const [testCaseStatuses, setTestCaseStatuses] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConsoleExpanded, setIsConsoleExpanded] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState(0);
  const [leftWidth, setLeftWidth] = useState(50); // percentage
  const [isResizing, setIsResizing] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [isSubmissionsLoading, setIsSubmissionsLoading] = useState(false);

  // Analyze state
  const [isAnalyzeOpen, setIsAnalyzeOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisType, setAnalysisType] = useState(null);
  const analyzeRef = useRef(null);

  const fetchSubmissions = useCallback(async () => {
    setIsSubmissionsLoading(true);
    try {
      const data = await getContestSubmissions(contestId);
      setSubmissions(data.submissions || []);
    } catch {
      // Failed to load submissions
    } finally {
      setIsSubmissionsLoading(false);
    }
  }, [contestId]);

  useEffect(() => {
    if (leftTab === 'submissions') {
      fetchSubmissions();
    }
  }, [leftTab, fetchSubmissions]);

  useEffect(() => {
    let isMounted = true;
    const fetchContest = async () => {
      setIsLoading(true);
      try {
        const data = await loadContest(contestId);
        if (isMounted) {
          setContest(data.contest);
          setSelectedQuestionIndex(0);
        }
      } catch {
        if (isMounted) setError("Failed to load contest.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchContest();
    return () => { isMounted = false; };
  }, [contestId]);

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
    const interval = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isFullscreen) document.body.classList.add('fullscreen-contest-active');
    else document.body.classList.remove('fullscreen-contest-active');
    return () => document.body.classList.remove('fullscreen-contest-active');
  }, [isFullscreen]);

  useEffect(() => {
    setCode(DEFAULT_CODE_TEMPLATES[language] || DEFAULT_CODE_TEMPLATES.cpp);
  }, [language]);

  const currentQuestion = contest?.questions?.[selectedQuestionIndex];
  const isLive = contest?.status === "live";
  const isEnded = contest?.status === "ended";
  const liveDeadline = contest?.actualEndAt || contest?.endAt;
  const canRun = !isEnded;

  const handleRunTestCases = async () => {
    if (!currentQuestion || !canRun) return;
    setIsRunning(true);
    setIsConsoleExpanded(true);
    
    try {
      const data = await runContestCode(contestId, {
        code,
        language,
        questionIndex: selectedQuestionIndex,
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
    if (!currentQuestion || !canRun) return;
    if (!window.confirm("Submit your solution?")) return;
    setIsSubmitting(true);
    setIsConsoleExpanded(true);
    try {
      const data = await runContestCode(contestId, {
        code,
        language,
        questionIndex: selectedQuestionIndex,
        isSubmit: true,
      });
      setRunResults(data.results || []);
      alert("Submitted successfully!");
      fetchSubmissions();
    } catch {
      alert("Submission failed.");
    } finally {
      setIsSubmitting(false);
    }
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
        contestId,
        questionIndex: selectedQuestionIndex
      });
      setAnalysisResult(data.result);
    } catch (err) {
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

  const handleStartContest = async () => {
    if (!window.confirm("Start the contest?")) return;
    try {
      const data = await startContest(contestId);
      setContest(data.contest);
      alert("Contest started!");
    } catch {
      alert("Failed to start contest.");
    }
  };

  const handleEndContest = async () => {
    if (!window.confirm("End the contest?")) return;
    try {
      const data = await endContest(contestId);
      setContest(data.contest);
      alert("Contest ended!");
    } catch {
      alert("Failed to end contest.");
    }
  };

  if (isLoading) return <div className="loading-state">Loading...</div>;
  if (!contest) return <div className="error-state">{error || "Contest not found."}</div>;

  return (
    <section className="contest-workspace-root">
      <header className="workspace-header">
        <div className="header-left">
          <button className="back-to-contests" onClick={() => navigate("/contests")}>
            <ArrowLeft size={16} /> Back
          </button>
          <div className="problem-nav">
            <button 
              className="nav-arrow" 
              disabled={selectedQuestionIndex === 0}
              onClick={() => setSelectedQuestionIndex(idx => idx - 1)}
            >
              <ChevronLeft size={20} />
            </button>
            <span className="current-problem-title">
              {selectedQuestionIndex + 1}. {currentQuestion?.title}
            </span>
            <button 
              className="nav-arrow" 
              disabled={selectedQuestionIndex === (contest.questions.length - 1)}
              onClick={() => setSelectedQuestionIndex(idx => idx + 1)}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="header-center">
          <div className="timer-display">
            <Clock size={16} />
            <span className={isLive ? "timer-live" : ""}>
              {formatCountdown(liveDeadline, nowTick)}
            </span>
          </div>
        </div>

        <div className="header-right">
          <div className="workspace-actions">
            {contest?.createdBy?._id === user?.id && (
              <>
                {contest.status === "ready" && (
                  <button className="btn-start" onClick={handleStartContest}>
                    Start Contest
                  </button>
                )}
                {contest.status === "live" && (
                  <button className="btn-end" onClick={handleEndContest}>
                    End Contest
                  </button>
                )}
              </>
            )}
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
              <h3>{analysisType === 'complexity' ? 'Code Complexity' : analysisType === 'edgeCases' ? 'Edge Cases' : 'Code Review'}</h3>
              <button className="close-btn" onClick={() => setAnalysisResult(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {renderAnalysisContent()}
            </div>
          </div>
        </div>
      )}

      <main className="workspace-main">

        <div className="leetcode-layout" style={{ gridTemplateColumns: `${leftWidth}% 6px 1fr` }}>
          <div className="leetcode-left-panel">
            <div className="panel-tabs">
              <button className={`panel-tab ${leftTab === 'questions' ? 'active' : ''}`} onClick={() => setLeftTab('questions')}>
                <Trophy size={16} /> Problems
              </button>
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
                  <h2 className="problem-title">{currentQuestion?.title}</h2>
                  <div className="problem-meta">
                    <span className="difficulty-tag medium">Medium</span>
                    <span className="meta-item"><Clock size={14}/> {currentQuestion?.timeLimitMs}ms</span>
                  </div>
                  <div className="problem-body">
                    <p>{currentQuestion?.prompt}</p>
                    <div className="example-section">
                      {currentQuestion?.testCases?.slice(0, 2).map((tc, i) => (
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
              ) : leftTab === 'questions' ? (
                <div className="questions-view">
                  {contest.questions.map((q, idx) => (
                    <button 
                      key={idx} 
                      className={`q-item ${selectedQuestionIndex === idx ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedQuestionIndex(idx);
                        setLeftTab('description');
                      }}
                    >
                      <span className="q-idx">{idx + 1}</span>
                      <span className="q-name">{q.title}</span>
                      {selectedQuestionIndex === idx && <CheckCircle2 size={16} className="active-icon" />}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="submissions-view">
                  <h3 className="section-title">My Submissions</h3>
                  {isSubmissionsLoading ? (
                    <div className="loading-sub">Loading...</div>
                  ) : submissions.filter(s => s.questionIndex === selectedQuestionIndex).length === 0 ? (
                    <div className="empty-sub">No submissions found for this question.</div>
                  ) : (
                    <div className="sub-list">
                      {submissions
                        .filter(s => s.questionIndex === selectedQuestionIndex)
                        .map((sub, idx) => (
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
                  <div className="tc-tabs">
                    {currentQuestion?.testCases?.map((_, idx) => (
                      <button 
                        key={idx} 
                        className={`tc-tab ${selectedTestCase === idx ? 'active' : ''} ${testCaseStatuses[idx]?.status || ''}`}
                        onClick={() => setSelectedTestCase(idx)}
                      >
                        Case {idx + 1}
                      </button>
                    ))}
                  </div>
                  <div className="tc-results">
                    {(isRunning || isSubmitting) ? (
                      <div className="loading-results anim-pulse">
                        <Loader2 size={24} className="anim-spin" />
                        <span>Executing test cases...</span>
                      </div>
                    ) : runResults[selectedTestCase] ? (
                      <div className="result-detail">
                        <div className="verdict-line">
                          {runResults[selectedTestCase].verdict === 'Accepted' ? <CheckCircle2 size={16} color="var(--success)" /> : <XCircle size={16} color="var(--danger)" />}
                          <span className={runResults[selectedTestCase].verdict === 'Accepted' ? 'pass' : 'fail'}>{runResults[selectedTestCase].verdict}</span>
                        </div>
                        <div className="io-box">
                          <label>Input</label>
                          <pre>{currentQuestion.testCases[selectedTestCase].input}</pre>
                        </div>
                        <div className="io-box">
                          <label>Output</label>
                          <pre className={runResults[selectedTestCase].verdict === 'Accepted' ? 'stdout-pass' : 'stdout-fail'}>
                            {runResults[selectedTestCase].stdout}
                          </pre>
                        </div>
                        <div className="io-box">
                          <label>Expected</label>
                          <pre>{currentQuestion.testCases[selectedTestCase].expectedOutput}</pre>
                        </div>
                      </div>
                    ) : (
                      <div className="tc-input">
                        <label>Input</label>
                        <pre>{currentQuestion?.testCases[selectedTestCase]?.input}</pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </section>
  );
}

export default ContestRoomPage;

