import { useCallback, useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppContext } from "../App";
import { 
  getContestSubmissions, 
  loadContest, 
  loadContestLeaderboard,
  runContestCode, 
  startContest,
  endContest,
  inviteToContest
} from "../services/contestService";
import { analyzeCode } from "../services/problemService";
import Editor from "@monaco-editor/react";
import Modal from "../components/common/Modal";
import { toast } from "../components/common/Toast";
import { getErrorMessage } from "../services/api";
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
  X,
  Monitor,
  Medal,
  UserPlus,
  Copy,
  Check
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

// ─── Inline Leaderboard Tab ──────────────────────────────────────────────────
function LeaderboardTab({ contestId, currentUserId, questions = [], contestStatus = "live" }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [questionMeta, setQuestionMeta] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshIn, setRefreshIn] = useState(30);
  const [search, setSearch] = useState("");

  const fetchLeaderboard = useCallback(async () => {
    try {
      const data = await loadContestLeaderboard(contestId);
      setLeaderboard(data.leaderboard || []);
      setQuestionMeta(data.questions || []);
      setRefreshIn(30);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [contestId]);

  useEffect(() => {
    fetchLeaderboard();
    if (contestStatus === "live") {
      const iv = setInterval(fetchLeaderboard, 30000);
      const countdown = setInterval(() => setRefreshIn((n) => (n > 0 ? n - 1 : 30)), 1000);
      return () => { clearInterval(iv); clearInterval(countdown); };
    }
  }, [fetchLeaderboard, contestStatus]);

  const qs = questionMeta.length > 0 ? questionMeta : questions.map((q, i) => ({ index: i, title: q.title, points: q.points || 100, difficulty: q.difficulty }));

  const filtered = leaderboard.filter((e) =>
    !search || (e.userName || "").toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return (
    <div className="lb-inline-loading"><Loader2 size={20} className="anim-spin" /><span>Loading standings...</span></div>
  );

  if (leaderboard.length === 0) return (
    <div className="lb-inline-empty"><Trophy size={32} style={{ opacity: 0.15 }} /><p>No submissions yet</p></div>
  );

  const medalColor = (rank) => {
    if (rank === 1) return "#fbbf24";
    if (rank === 2) return "#d1d5db";
    if (rank === 3) return "#cd7f32";
    return null;
  };

  return (
    <div className="lb-matrix-wrapper">
      {/* Header */}
      <div className="lb-matrix-header">
        <div className="lb-header-left">
          <Trophy size={14} style={{ color: "var(--accent)" }} />
          <span>Live Standings</span>
          {contestStatus === "live" && (
            <span className="lb-live-dot">🟢 Live</span>
          )}
        </div>
        <div className="lb-header-right">
          {contestStatus === "live" && (
            <span className="lb-refresh-badge">Refreshes in {refreshIn}s</span>
          )}
          <button className="lb-refresh-btn" onClick={fetchLeaderboard} title="Refresh now">
            <RotateCcw size={12} />
          </button>
          <input
            className="lb-search"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Matrix Table */}
      <div className="lb-matrix-scroll">
        <table className="lb-matrix-table">
          <thead>
            <tr>
              <th className="lb-col-rank">#</th>
              <th className="lb-col-name">Participant</th>
              <th className="lb-col-score">Score</th>
              {qs.map((q, i) => (
                <th key={i} className="lb-col-prob" title={q.title}>
                  {i + 1}
                </th>
              ))}
              <th className="lb-col-penalty">Pen.</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry, idx) => {
              const rank = entry.rank || idx + 1;
              const isMe = String(entry.user) === String(currentUserId);
              const mc = medalColor(rank);
              return (
                <tr key={entry.user || idx} className={`lb-row ${isMe ? "lb-row-me" : ""}`}>
                  <td className="lb-col-rank">
                    {mc ? (
                      <Medal size={16} style={{ color: mc }} />
                    ) : (
                      <span className="lb-rank-num">{rank}</span>
                    )}
                  </td>
                  <td className="lb-col-name">
                    <div className="lb-name-cell">
                      <div className="lb-avatar">{(entry.userName || "U")[0]}</div>
                      <span>{entry.userName}{isMe && <span className="lb-you"> (You)</span>}</span>
                    </div>
                  </td>
                  <td className="lb-col-score">{entry.score || 0}</td>
                  {qs.map((q, qi) => {
                    const qr = entry.questionResults?.[String(qi)];
                    if (!qr) return <td key={qi} className="lb-prob-cell lb-prob-unsolved">—</td>;
                    if (qr.solved) {
                      const mins = qr.penaltyMinutes || 0;
                      const h = Math.floor(mins / 60);
                      const m = mins % 60;
                      const timeStr = h > 0 ? `${h}:${String(m).padStart(2, "0")}` : `${m}:00`;
                      return (
                        <td key={qi} className="lb-prob-cell lb-prob-solved">
                          <span className="lb-solve-time">+{qr.attempts > 1 ? qr.attempts - 1 : ""}{timeStr}</span>
                        </td>
                      );
                    }
                    return (
                      <td key={qi} className="lb-prob-cell lb-prob-failed">
                        <span className="lb-fail-count">-{qr.attempts}</span>
                      </td>
                    );
                  })}
                  <td className="lb-col-penalty">{entry.penalty || 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ContestRoomPage() {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const { user } = useAppContext();
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
  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);
  const [isConfirmStartOpen, setIsConfirmStartOpen] = useState(false);
  const [isConfirmEndOpen, setIsConfirmEndOpen] = useState(false);
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);

  // Invite modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteIdentifier, setInviteIdentifier] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [copiedRoomCode, setCopiedRoomCode] = useState(false);

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
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load submissions."));
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
      } catch (err) {
        if (isMounted) setError(getErrorMessage(err, "Failed to load contest."));
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
  const isScheduled = contest?.status === "scheduled";
  const isVirtual = contest?.type === "virtual";
  const liveDeadline = contest?.actualEndAt || contest?.endAt;
  // Allow running code in live contests, virtual contests, and upsolve (ended) mode
  const canRun = isLive || isVirtual || isEnded;

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
    } catch (err) {
      toast.error(getErrorMessage(err, "Code execution failed. Please try again."));
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = () => {
    if (!currentQuestion || !canRun) return;
    setIsConfirmSubmitOpen(true);
  };

  const executeSubmit = async () => {
    setIsConfirmSubmitOpen(false);
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
      const allPassed = (data.results || []).every(res => res.verdict === 'Accepted');
      if (allPassed) {
        toast.success("All test cases passed! Submitted successfully.");
      } else {
        toast.error("Some test cases failed.");
      }
      fetchSubmissions();
    } catch (err) {
      toast.error(getErrorMessage(err, "Submission failed. Please try again."));
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
      setAnalysisResult(getErrorMessage(err, "Failed to analyze code. Please try again."));
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

  const handleStartContest = () => {
    setIsConfirmStartOpen(true);
  };

  const executeStartContest = async () => {
    setIsConfirmStartOpen(false);
    try {
      const data = await startContest(contestId);
      setContest(data.contest);
      toast.success("Contest started!");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to start contest."));
    }
  };

  const handleEndContest = () => {
    setIsConfirmEndOpen(true);
  };

  const executeEndContest = async () => {
    setIsConfirmEndOpen(false);
    try {
      const data = await endContest(contestId);
      setContest(data.contest);
      toast.success("Contest ended!");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to end contest."));
    }
  };

  const handleInviteFriend = async (e) => {
    e?.preventDefault?.();
    if (!inviteIdentifier.trim()) return;
    setIsInviting(true);
    try {
      const res = await inviteToContest(contestId, { identifier: inviteIdentifier.trim() });
      toast.success(res.message || "Friend invited successfully!");
      setInviteIdentifier("");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to send contest invite."));
    } finally {
      setIsInviting(false);
    }
  };

  if (isLoading) return (
    <div className="contest-workspace-root workspace-skeleton">
      <div className="workspace-header skeleton-header">
        <div className="sk-line sk-back" />
        <div className="sk-line sk-problem-nav" />
        <div className="sk-line sk-timer" />
        <div className="sk-line sk-actions" />
      </div>
      <div className="workspace-main">
        <div className="leetcode-layout" style={{ gridTemplateColumns: '50% 6px 1fr' }}>
          <div className="leetcode-left-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="sk-line" style={{ height: '32px', borderRadius: '8px', width: '180px' }} />
            <div className="sk-line" style={{ height: '24px', borderRadius: '8px', width: '80%' }} />
            <div className="sk-line" style={{ height: '16px', borderRadius: '8px', width: '100%' }} />
            <div className="sk-line" style={{ height: '16px', borderRadius: '8px', width: '90%' }} />
            <div className="sk-line" style={{ height: '16px', borderRadius: '8px', width: '70%' }} />
            <div className="sk-line" style={{ height: '100px', borderRadius: '12px', width: '100%' }} />
          </div>
          <div className="resizer-v" />
          <div className="leetcode-right-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="sk-line" style={{ height: '36px', borderRadius: '8px', width: '140px' }} />
            <div className="sk-line" style={{ flex: 1, borderRadius: '12px' }} />
          </div>
        </div>
      </div>
    </div>
  );
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
            {isScheduled ? (
              <span style={{ color: "var(--accent)", fontSize: "0.82rem" }}>
                Starts {contest.scheduledAt ? new Date(contest.scheduledAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "soon"}
              </span>
            ) : isEnded ? (
              <span style={{ color: "var(--muted)", fontSize: "0.82rem" }}>Contest Ended</span>
            ) : (
              <span className={isLive ? "timer-live" : ""}>
                {formatCountdown(liveDeadline, nowTick)}
              </span>
            )}
          </div>
          {contest?.isOfficial && (
            <span className="official-badge">
              ★ Official
            </span>
          )}
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
            {(contest?.createdBy?._id === user?.id || contest?.visibility === "private" || user?.role === "admin") && (
              <button 
                className="btn-invite-room" 
                onClick={() => setIsInviteModalOpen(true)}
                title="Invite friends or copy room code"
              >
                <UserPlus size={14} /> Invite
              </button>
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

      {/* Invite Friends Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Friends to Contest"
      >
        <div className="invite-modal-content">
          <div className="invite-code-card">
            <span className="invite-code-label">Contest Room Code</span>
            <div className="invite-code-val-row">
              <span className="invite-code-val">{contest?.roomCode || contest?._id}</span>
              <button
                type="button"
                className="invite-copy-btn"
                onClick={() => {
                  navigator.clipboard.writeText(contest?.roomCode || contest?._id);
                  setCopiedRoomCode(true);
                  setTimeout(() => setCopiedRoomCode(false), 2000);
                  toast.success("Room code copied to clipboard!");
                }}
              >
                {copiedRoomCode ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
                <span>{copiedRoomCode ? "Copied" : "Copy Code"}</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleInviteFriend} className="invite-user-form">
            <label className="invite-form-label">Invite Friend by Username or Email</label>
            <div className="invite-input-row">
              <input
                type="text"
                className="invite-input"
                placeholder="Enter username or email..."
                value={inviteIdentifier}
                onChange={(e) => setInviteIdentifier(e.target.value)}
                disabled={isInviting}
              />
              <button
                type="submit"
                className="primary-button invite-submit-btn"
                disabled={isInviting || !inviteIdentifier.trim()}
              >
                {isInviting ? <Loader2 size={15} className="anim-spin" /> : <UserPlus size={14} />}
                <span>Invite</span>
              </button>
            </div>
            <p className="invite-hint-text">
              Invited participants gain immediate access to enter this contest room.
            </p>
          </form>
        </div>
      </Modal>

      {/* Confirmation Modals */}
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
        <p>Are you sure you want to submit? Your code will be evaluated against hidden test cases.</p>
      </Modal>

      <Modal
        isOpen={isConfirmStartOpen}
        onClose={() => setIsConfirmStartOpen(false)}
        title="Start Contest"
        footer={
          <>
            <button
              className="modal-btn modal-btn-cancel"
              onClick={() => setIsConfirmStartOpen(false)}
            >
              Cancel
            </button>
            <button
              className="modal-btn modal-btn-success"
              onClick={executeStartContest}
            >
              Start
            </button>
          </>
        }
      >
        <p>Are you sure you want to start the contest? This will make all problems visible to participants.</p>
      </Modal>

      <Modal
        isOpen={isConfirmEndOpen}
        onClose={() => setIsConfirmEndOpen(false)}
        title="End Contest"
        footer={
          <>
            <button
              className="modal-btn modal-btn-cancel"
              onClick={() => setIsConfirmEndOpen(false)}
            >
              Cancel
            </button>
            <button
              className="modal-btn modal-btn-danger"
              onClick={executeEndContest}
            >
              End
            </button>
          </>
        }
      >
        <p>This will immediately end the contest. No further submissions will be accepted.</p>
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
                setCode(DEFAULT_CODE_TEMPLATES[language] || DEFAULT_CODE_TEMPLATES.cpp);
                setIsConfirmResetOpen(false);
                toast.success("Code reset to default template.");
              }}
            >
              Reset
            </button>
          </>
        }
      >
        <p>Are you sure you want to reset your code to the default template? Your current changes will be lost.</p>
      </Modal>

      <main className="workspace-main">

        <div className="leetcode-layout" style={{ gridTemplateColumns: `${leftWidth}% 6px 1fr` }}>
          <div className="leetcode-left-panel">
            {/* Virtual Contest Banner */}
            {contest.type === 'virtual' && (
              <div className="virtual-contest-banner">
                <Monitor size={14} />
                <span>Virtual Contest — replaying <strong>{contest.title?.replace('[Virtual] ', '')}</strong></span>
              </div>
            )}
            {isEnded && contest.type !== 'virtual' && (
              <div className="upsolve-banner">
                <CheckCircle2 size={14} />
                <span>Contest ended — upsolve mode active · submissions won't affect the leaderboard</span>
              </div>
            )}
            {isScheduled && (
              <div className="scheduled-banner">
                <Clock size={14} />
                <span>
                  Contest is scheduled to start at{" "}
                  <strong>{contest.scheduledAt ? new Date(contest.scheduledAt).toLocaleString() : "TBD"}</strong>
                  {contest.createdBy?._id === user?.id && " — You can also start it manually"}
                </span>
              </div>
            )}
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
              <button className={`panel-tab ${leftTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setLeftTab('leaderboard')}>
                <Medal size={16} /> Standings
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
              ) : leftTab === 'leaderboard' ? (
                <LeaderboardTab contestId={contestId} currentUserId={user?.id || user?._id} questions={contest.questions} contestStatus={contest.status} />
              ) : (
                <div className="submissions-view">
                  <h3 className="section-title">My Submissions</h3>
                  {isSubmissionsLoading ? (
                    <div className="loading-sub"><Loader2 size={18} className="anim-spin" /> Loading...</div>
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

