import { useEffect, useState } from "react";
import { useAppContext } from "../../App";
import { loadContestLeaderboard } from "../../services/contestService";
import { getErrorMessage } from "../../services/api";
import { X, Trophy, Medal, Clock, CheckCircle2, Loader2 } from "lucide-react";

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

function ContestLeaderboardModal({ contestId, contestTitle, onClose }) {
  const { user } = useAppContext();
  const [leaderboard, setLeaderboard] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        const data = await loadContestLeaderboard(contestId);
        setLeaderboard(data.leaderboard || []);
        setQuestions(data.questions || []);
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load leaderboard."));
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboard();
  }, [contestId]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const myUserId = user?.id || user?._id;

  return (
    <div className="lb-overlay" onClick={onClose}>
      <div className="lb-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="lb-header">
          <div className="lb-header-left">
            <Trophy size={20} style={{ color: "var(--accent)" }} />
            <div>
              <h2 className="lb-title">Leaderboard</h2>
              <p className="lb-subtitle">{contestTitle}</p>
            </div>
          </div>
          <button className="lb-close" onClick={onClose}><X size={18} /></button>
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
                        <span className="q-header-pts">{q.points}pt</span>
                      </th>
                    ))}
                    <th className="th-score">Score</th>
                    <th className="th-penalty">Penalty</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, idx) => {
                    const isMe = entry.user?.toString() === myUserId?.toString() ||
                                 entry.user?._id?.toString() === myUserId?.toString();
                    const rankStyle = RANK_STYLES[idx] || null;

                    return (
                      <tr key={entry.user || idx} className={`lb-row ${isMe ? "lb-row-me" : ""}`}>
                        <td className="td-rank">
                          {rankStyle ? (
                            <span className="rank-medal" style={{ background: rankStyle.bg, color: rankStyle.color }}>
                              {rankStyle.label}
                            </span>
                          ) : (
                            <span className="rank-num">{entry.rank || idx + 1}</span>
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
