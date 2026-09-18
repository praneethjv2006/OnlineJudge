import { useCallback, useEffect, useState } from "react";
import { useAppContext } from "../../App";
import { loadContestLeaderboard } from "../../services/contestService";
import { getErrorMessage } from "../../services/api";
import { X, Trophy, Medal, Clock, CheckCircle2, Loader2, RotateCcw, Search, Zap } from "lucide-react";

const RANK_STYLES = [
  { bg: "linear-gradient(135deg, #FFD700, #FFA500)", color: "#000", label: "🥇" },
  { bg: "linear-gradient(135deg, #C0C0C0, #A8A8A8)", color: "#000", label: "🥈" },
  { bg: "linear-gradient(135deg, #CD7F32, #B87333)", color: "#fff", label: "🥉" },
];

function formatPenalty(minutes) {
  if (!minutes) return "-";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function ContestLeaderboardModal({ contestId, contestTitle, contestStatus = "ended", onClose }) {
  const { user } = useAppContext();
  const [leaderboard, setLeaderboard] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [refreshIn, setRefreshIn] = useState(20);

  const fetchLeaderboard = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    try {
      const data = await loadContestLeaderboard(contestId);
      setLeaderboard(data.leaderboard || []);
      setQuestions(data.questions || []);
      setError("");
      setRefreshIn(20);
    } catch (err) {
      if (!quiet) {
        setError(getErrorMessage(err, "Failed to load leaderboard."));
      }
    } finally {
      if (!quiet) setIsLoading(false);
    }
  }, [contestId]);

  useEffect(() => {
    fetchLeaderboard();
    if (contestStatus === "live") {
      const iv = setInterval(() => fetchLeaderboard(true), 20000);
      const countdown = setInterval(() => setRefreshIn((n) => (n > 0 ? n - 1 : 20)), 1000);
      return () => {
        clearInterval(iv);
        clearInterval(countdown);
      };
    }
  }, [fetchLeaderboard, contestStatus]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const myUserId = user?.id || user?._id;

  const filtered = leaderboard.filter((entry) =>
    !search.trim() || (entry.userName || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="lb-overlay" onClick={onClose}>
      <div className="lb-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="lb-header">
          <div className="lb-header-left">
            <Trophy size={22} style={{ color: "var(--accent)" }} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h2 className="lb-title">Leaderboard</h2>
                {contestStatus === "live" ? (
                  <span className="lb-live-badge-inline">
                    <span className="live-pulse-dot" /> LIVE
                  </span>
                ) : (
                  <span className="lb-final-badge">Final</span>
                )}
              </div>
              <p className="lb-subtitle">{contestTitle}</p>
            </div>
          </div>
          <div className="lb-header-right-actions">
            {contestStatus === "live" && (
              <span className="lb-refresh-badge">Refreshes in {refreshIn}s</span>
            )}
            <button
              className="lb-refresh-icon-btn"
              onClick={() => fetchLeaderboard(false)}
              title="Refresh standings"
            >
              <RotateCcw size={14} />
            </button>
            <div className="lb-modal-search-wrap">
              <Search size={13} className="lb-search-icon" />
              <input
                className="lb-modal-search"
                placeholder="Search user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="lb-close" onClick={onClose} aria-label="Close modal">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="lb-body">
          {isLoading ? (
            <div className="lb-loading">
              <Loader2 size={32} className="anim-spin" />
              <p>Loading standings...</p>
            </div>
          ) : error ? (
            <div className="lb-error">{error}</div>
          ) : leaderboard.length === 0 ? (
            <div className="lb-empty">
              <Trophy size={48} style={{ opacity: 0.15, marginBottom: 16 }} />
              <p>No submissions yet. Be the first to score!</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="lb-empty">
              <Search size={36} style={{ opacity: 0.2, marginBottom: 12 }} />
              <p>No participants matching &quot;{search}&quot;</p>
            </div>
          ) : (
            <div className="lb-table-wrap">
              <table className="lb-table">
                <thead>
                  <tr>
                    <th className="th-rank">Rank</th>
                    <th className="th-user">Participant</th>
                    {questions.map((q, i) => (
                      <th key={i} className="th-question" title={q.title}>
                        <span className="q-header-label">P{i + 1}</span>
                        <span className="q-header-pts">{q.points || 100}pt</span>
                      </th>
                    ))}
                    <th className="th-score">Score</th>
                    <th className="th-penalty">Penalty</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((entry, idx) => {
                    const isMe = entry.user?.toString() === myUserId?.toString() ||
                                 entry.user?._id?.toString() === myUserId?.toString();
                    const rank = entry.rank || idx + 1;
                    const rankStyle = rank <= 3 ? RANK_STYLES[rank - 1] : null;

                    return (
                      <tr key={entry.user || idx} className={`lb-row ${isMe ? "lb-row-me" : ""}`}>
                        <td className="td-rank">
                          {rankStyle ? (
                            <span className="rank-medal" style={{ background: rankStyle.bg, color: rankStyle.color }}>
                              {rankStyle.label}
                            </span>
                          ) : (
                            <span className="rank-num">{rank}</span>
                          )}
                        </td>
                        <td className="td-user">
                          <div className="lb-user">
                            <div className="lb-avatar">{(entry.userName || "U")[0].toUpperCase()}</div>
                            <div className="lb-user-info">
                              <span className="lb-username">{entry.userName || "Anonymous"}</span>
                              {isMe && <span className="lb-you-tag">You</span>}
                            </div>
                          </div>
                        </td>
                        {questions.map((q, qi) => {
                          const qResult = entry.questionResults?.[String(qi)];
                          return (
                            <td key={qi} className="td-question">
                              {qResult?.solved ? (
                                <div className="q-solved">
                                  <CheckCircle2 size={13} color="var(--success)" />
                                  <span className="q-penalty-min">+{qResult.penaltyMinutes || 0}m</span>
                                </div>
                              ) : qResult?.attempts > 0 ? (
                                <div className="q-failed">
                                  <span className="q-attempts">-{qResult.attempts}</span>
                                </div>
                              ) : (
                                <span className="q-none">—</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="td-score">
                          <span className="score-val">{entry.score}</span>
                        </td>
                        <td className="td-penalty">
                          <span className="penalty-val">
                            <Clock size={11} /> {formatPenalty(entry.penalty)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ContestLeaderboardModal;
