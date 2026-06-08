import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { endContest, enterContest, loadContest, runContestCode, startContest } from "../services/contestService";
import Editor from "@monaco-editor/react";
import { 
  FileText, 
  Code2, 
  ChevronUp, 
  ChevronDown, 
  RotateCcw, 
  Trophy, 
  Clock, 
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Terminal,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  Send,
  Layout
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
  const [terminalOutput, setTerminalOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [nowTick, setNowTick] = useState(Date.now());
  const [isFullscreen, setIsFullscreen] = useState(true); 
  const [testCaseStatuses, setTestCaseStatuses] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConsoleExpanded, setIsConsoleExpanded] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState(0);

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
      } catch (err) {
        if (isMounted) setError("Failed to load contest.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchContest();
    return () => { isMounted = false; };
  }, [contestId]);

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
    setTerminalOutput("Running test cases...");
    
    try {
      const data = await runContestCode(contestId, {
        code,
        language,
        questionIndex: selectedQuestionIndex,
      });
      setRunResults(data.results || []);
      setTerminalOutput(data.terminalOutput || "");
      const newStatuses = {};
      (data.results || []).forEach((res, idx) => {
        newStatuses[idx] = { status: res.verdict === 'Accepted' ? 'passed' : 'failed' };
      });
      setTestCaseStatuses(newStatuses);
    } catch (err) {
      setTerminalOutput("Execution error.");
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentQuestion || !canRun) return;
    if (!window.confirm("Submit your solution?")) return;
    setIsSubmitting(true);
    setIsConsoleExpanded(true);
    setTerminalOutput("Submitting...");
    try {
      const data = await runContestCode(contestId, {
        code,
        language,
        questionIndex: selectedQuestionIndex,
      });
      setRunResults(data.results || []);
      alert("Submitted successfully!");
    } catch (err) {
      alert("Submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="loading-state">Loading...</div>;
  if (!contest) return <div className="error-state">{error || "Contest not found."}</div>;

  return (
    <section className="contest-workspace-root">
      <header className="workspace-header">
        <div className="header-left">
          <button className="icon-btn" onClick={() => navigate("/contests")} title="Exit Workspace">
            <Layout size={18} />
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
            <button className="btn-run" onClick={handleRunTestCases} disabled={isRunning}>
              <Play size={14} /> Run
            </button>
            <button className="btn-submit" onClick={handleSubmit} disabled={isSubmitting}>
              <Send size={14} /> Submit
            </button>
          </div>
          <div className="user-profile-mini">
            <div className="avatar-small">{user?.name?.[0]?.toUpperCase()}</div>
          </div>
        </div>
      </header>

      <main className="workspace-main">
        <div className="leetcode-layout">
          <div className="leetcode-left-panel">
            <div className="panel-tabs">
              <button className={`panel-tab ${leftTab === 'description' ? 'active' : ''}`} onClick={() => setLeftTab('description')}>
                <FileText size={16} /> Description
              </button>
              <button className={`panel-tab ${leftTab === 'questions' ? 'active' : ''}`} onClick={() => setLeftTab('questions')}>
                <Trophy size={16} /> Problems
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
              ) : (
                <div className="questions-view">
                  {contest.questions.map((q, idx) => (
                    <button 
                      key={idx} 
                      className={`q-item ${selectedQuestionIndex === idx ? 'active' : ''}`}
                      onClick={() => setSelectedQuestionIndex(idx)}
                    >
                      <span className="q-idx">{idx + 1}</span>
                      <span className="q-name">{q.title}</span>
                      {selectedQuestionIndex === idx && <CheckCircle2 size={16} className="active-icon" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

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
                    {runResults[selectedTestCase] ? (
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
                          <pre>{runResults[selectedTestCase].stdout}</pre>
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
