import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../App";
import { joinContest, loadContests, startVirtualContest } from "../services/contestService";
import { getErrorMessage } from "../services/api";
import { toast } from "../components/common/Toast";
import ContestLeaderboardModal from "../components/common/ContestLeaderboardModal";
import {
  Lock, Clock, FileQuestion, ChevronRight, Search, Trophy, Sparkles, Globe,
  Play, Users, Calendar, CheckCircle2, Zap, Timer, Medal, ArrowRight,
  BarChart3, Monitor
} from "lucide-react";

// ─── Default seeded completed contests (shown when no real ended contests exist) ─
const DEFAULT_COMPLETED_CONTESTS = [
  {
    _id: "default-1",
    title: "CodeStorm Round #1",
    description: "Classic algorithmic challenge covering arrays, strings, and dynamic programming. Test your fundamentals!",
    status: "ended",
    visibility: "public",
    durationMinutes: 90,
    isDefault: true,
    endedAt: "2026-08-15T18:00:00.000Z",
    participantCount: 47,
    createdBy: { name: "ApexJudge" },
    questions: [
      { title: "Two Sum Variant", difficulty: "easy", tags: ["arrays", "hash-map"] },
      { title: "Longest Palindromic Substring", difficulty: "medium", tags: ["strings", "dp"] },
      { title: "Edit Distance", difficulty: "hard", tags: ["dp", "strings"] },
    ],
  },
  {
    _id: "default-2",
    title: "ApexJudge Weekly #1",
    description: "Weekly competitive programming contest. Sharpen your problem-solving skills with mixed-difficulty problems.",
    status: "ended",
    visibility: "public",
    durationMinutes: 60,
    isDefault: true,
    endedAt: "2026-08-20T20:00:00.000Z",
    participantCount: 31,
    createdBy: { name: "ApexJudge" },
    questions: [
      { title: "Fibonacci Sequence", difficulty: "easy", tags: ["math", "recursion"] },
      { title: "Binary Search on Answer", difficulty: "medium", tags: ["binary-search"] },
    ],
  },
];

// ─── Utilities ────────────────────────────────────────────────────────────────
const formatCountdown = (targetDate) => {
  const ms = new Date(targetDate).getTime() - Date.now();
  if (ms <= 0) return "Ended";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 48) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const DIFF_COLORS = { easy: "#2cbb5d", medium: "#ffa116", hard: "#ef4743" };

function DifficultyDots({ questions = [] }) {
  const counts = { easy: 0, medium: 0, hard: 0 };
  questions.forEach((q) => { if (q.difficulty) counts[q.difficulty]++; });
  return (
    <div className="diff-dots-row">
      {Object.entries(counts).map(([diff, count]) =>
        count > 0 ? (
          <span key={diff} className="diff-dot-badge" style={{ background: `${DIFF_COLORS[diff]}20`, color: DIFF_COLORS[diff], border: `1px solid ${DIFF_COLORS[diff]}40` }}>
            {count} {diff}
          </span>
        ) : null
      )}
    </div>
  );
}

// ─── Skeleton Loading ─────────────────────────────────────────────────────────
function ContestSkeleton() {
  return (
    <div className="contests-skeleton-grid">
      {[1, 2, 3].map((i) => (
        <div key={i} className="contest-skeleton-card">
          <div className="sk-line sk-title" />
          <div className="sk-line sk-body" />
          <div className="sk-line sk-body short" />
          <div className="sk-line sk-tag" />
          <div className="sk-line sk-btn" />
        </div>
      ))}
    </div>
  );
}

// ─── Upcoming Contest Card ────────────────────────────────────────────────────
function UpcomingCard({ contest, onJoin, isJoining }) {
  const [tick, setTick] = useState(Date.now());
  useEffect(() => {
    const iv = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  const scheduledAt = contest.scheduledAt || contest.startAt;

  return (
    <article className="contest-pro-card upcoming-card">
      <div className="pro-card-header">
        <div className="pro-card-badge upcoming-badge">
          <Calendar size={11} /> UPCOMING
        </div>
        <span className="pro-card-visibility">
          {contest.visibility === "public" ? <Globe size={12} /> : <Lock size={12} />}
          {contest.visibility}
        </span>
      </div>

      <h3 className="pro-card-title">{contest.title}</h3>
      <p className="pro-card-desc">{contest.description || "No description provided."}</p>

      <div className="countdown-block">
        <span className="countdown-label"><Calendar size={12} /> Starts in</span>
        <span className="countdown-value">
          {scheduledAt ? formatCountdown(scheduledAt) : "TBD"}
        </span>
        {scheduledAt && (
          <span className="countdown-date">{formatDate(scheduledAt)}</span>
        )}
      </div>

      <div className="pro-card-stats">
        <div className="pro-stat"><FileQuestion size={13} /><span>{contest.questions?.length || 0} Problems</span></div>
        <div className="pro-stat"><Clock size={13} /><span>{contest.durationMinutes} min</span></div>
        {contest.participants?.length > 0 && (
          <div className="pro-stat"><Users size={13} /><span>{contest.participants.length} registered</span></div>
        )}
      </div>

      <DifficultyDots questions={contest.questions || []} />

      <div className="pro-card-footer">
        <div className="creator-chip">
          <div className="creator-avatar">{(contest.createdBy?.name || "O")[0]}</div>
          <span>{contest.createdBy?.name || "Organizer"}</span>
        </div>
        <button
          className="pro-card-btn register-btn"
          onClick={() => onJoin(contest._id)}
          disabled={isJoining}
        >
          Register <ChevronRight size={14} />
        </button>
      </div>
    </article>
  );
}

// ─── Live Contest Card ────────────────────────────────────────────────────────
function LiveCard({ contest, onJoin, isJoining }) {
  const [tick, setTick] = useState(Date.now());
  useEffect(() => {
    const iv = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  const endAt = contest.actualEndAt || contest.endAt;

  return (
    <article className="contest-pro-card live-card">
      <div className="pro-card-header">
        <div className="pro-card-badge live-badge">
          <span className="live-pulse-dot" /> LIVE
        </div>
        <span className="time-remaining">
          <Timer size={12} />
          {endAt ? formatCountdown(endAt) : "∞"}
        </span>
      </div>

      <h3 className="pro-card-title">{contest.title}</h3>
      <p className="pro-card-desc">{contest.description || "No description provided."}</p>

      <div className="pro-card-stats">
        <div className="pro-stat"><FileQuestion size={13} /><span>{contest.questions?.length || 0} Problems</span></div>
        <div className="pro-stat"><Clock size={13} /><span>{contest.durationMinutes} min</span></div>
        <div className="pro-stat"><Users size={13} /><span>{contest.participants?.length || 0} competing</span></div>
      </div>

      <DifficultyDots questions={contest.questions || []} />

      <div className="pro-card-footer">
        <div className="creator-chip">
          <div className="creator-avatar">{(contest.createdBy?.name || "O")[0]}</div>
          <span>{contest.createdBy?.name || "Organizer"}</span>
        </div>
        <button
          className="pro-card-btn join-live-btn"
          onClick={() => onJoin(contest._id)}
          disabled={isJoining}
        >
          <Play size={13} /> Enter <ChevronRight size={14} />
        </button>
      </div>
    </article>
  );
}

// ─── Completed Contest Card ───────────────────────────────────────────────────
function CompletedCard({ contest, onVirtual, onLeaderboard, isVirtualLoading }) {
  const isDefault = contest.isDefault;

  return (
    <article className="contest-pro-card completed-card">
      <div className="pro-card-header">
        <div className="pro-card-badge completed-badge">
          <CheckCircle2 size={11} /> COMPLETED
        </div>
        {contest.endedAt && (
          <span className="ended-date">{formatDate(contest.endedAt || contest.actualEndAt)}</span>
        )}
      </div>

      <h3 className="pro-card-title">{contest.title}</h3>
      <p className="pro-card-desc">{contest.description || "No description provided."}</p>

      <div className="pro-card-stats">
        <div className="pro-stat"><FileQuestion size={13} /><span>{contest.questions?.length || 0} Problems</span></div>
        <div className="pro-stat"><Clock size={13} /><span>{contest.durationMinutes} min</span></div>
        {contest.participantCount != null && (
          <div className="pro-stat"><Users size={13} /><span>{contest.participantCount} participated</span></div>
        )}
      </div>

      <DifficultyDots questions={contest.questions || []} />

      {/* Problem list for upsolving */}
      <div className="problem-upsolve-list">
        {(contest.questions || []).map((q, idx) => (
          <div key={idx} className="upsolve-problem-row">
            <span className="upsolve-idx">{idx + 1}</span>
            <span className="upsolve-title">{q.title}</span>
            <span className="upsolve-diff" style={{ color: DIFF_COLORS[q.difficulty] || "#ffa116" }}>
              {q.difficulty}
            </span>
            {!isDefault && (
              <button className="upsolve-btn">Solve</button>
            )}
          </div>
        ))}
      </div>

      <div className="pro-card-footer completed-footer">
        <div className="creator-chip">
          <div className="creator-avatar">{(contest.createdBy?.name || "O")[0]}</div>
          <span>{contest.createdBy?.name || "Organizer"}</span>
        </div>
        <div className="completed-actions">
          {!isDefault && (
            <button className="pro-card-btn leaderboard-btn" onClick={() => onLeaderboard(contest)}>
              <Medal size={13} /> Standings
            </button>
          )}
          <button
            className="pro-card-btn virtual-btn"
            onClick={() => onVirtual(contest)}
            disabled={isVirtualLoading || isDefault}
            title={isDefault ? "Virtual contests only available for real contests" : "Start a virtual contest"}
          >
            <Monitor size={13} /> Virtual
          </button>
        </div>
      </div>
    </article>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function ContestsPage() {
  const { user } = useAppContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("live");
  const [visibility, setVisibility] = useState("public");
  const [grouped, setGrouped] = useState({ upcoming: [], live: [], ended: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isVirtualLoading, setIsVirtualLoading] = useState(false);
  const [showJoiner, setShowJoiner] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [selectedLeaderboard, setSelectedLeaderboard] = useState(null);
  const joinRef = useRef(null);

  const fetchContests = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await loadContests(visibility);
      setGrouped(data.grouped || { upcoming: [], live: [], ended: [] });
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to load contests."));
    } finally {
      setIsLoading(false);
    }
  }, [visibility]);

  useEffect(() => {
    fetchContests();
  }, [fetchContests]);

  const handleJoin = async (contestId) => {
    setIsJoining(true);
    try {
      await joinContest({ contestId });
      navigate(`/contests/${contestId}`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to join contest."));
    } finally {
      setIsJoining(false);
    }
  };

  const handleVirtual = async (contest) => {
    setIsVirtualLoading(true);
    try {
      const data = await startVirtualContest(contest._id);
      navigate(`/contests/${data.contest._id}`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to start virtual contest."));
    } finally {
      setIsVirtualLoading(false);
    }
  };

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setIsJoining(true);
    setJoinError("");
    try {
      const data = await joinContest({ code: joinCode.trim().toUpperCase() });
      navigate(`/contests/${data.contest._id}`);
    } catch (err) {
      setJoinError(getErrorMessage(err, "Invalid code or contest not found."));
    } finally {
      setIsJoining(false);
    }
  };

  // Determine which contests to show
  const endedContests = grouped.ended || [];
  const showDefaultCompleted = activeTab === "ended" && endedContests.length === 0;
  const displayEnded = showDefaultCompleted ? DEFAULT_COMPLETED_CONTESTS : endedContests;

  const tabCounts = {
    upcoming: grouped.upcoming?.length || 0,
    live: grouped.live?.length || 0,
    ended: displayEnded.length,
  };

  return (
    <section className="contests-pro-page page-stack">
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="panel contests-pro-header">
        <div className="contests-pro-title-row">
          <div className="contests-title-group">
            <div className="contests-eyebrow">
              <Trophy size={16} style={{ color: "var(--accent)" }} />
              <span>Competitive Arena</span>
            </div>
            <h1 className="contests-main-title">Contests</h1>
          </div>
          <div className="contests-header-actions">
            <div className="segmented-control compact-toggle">
              <button type="button" className={visibility === "public" ? "segment active" : "segment"} onClick={() => setVisibility("public")}>
                <Globe size={13} /> Public
              </button>
              <button type="button" className={visibility === "private" ? "segment active" : "segment"} onClick={() => setVisibility("private")}>
                <Lock size={13} /> Private
              </button>
            </div>
            <button className="join-code-btn" onClick={() => { setShowJoiner(v => !v); setTimeout(() => joinRef.current?.focus(), 50); }}>
              <Search size={14} /> Join by Code
            </button>
            <Link to="/contests/create" className="primary-action">
              <Sparkles size={14} /> Create Contest
            </Link>
          </div>
        </div>

        {/* Join by code panel */}
        {showJoiner && (
          <form className="join-code-panel" onSubmit={handleJoinByCode}>
            <input
              ref={joinRef}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter room code  e.g. CJ-1A2B3C"
              className="join-code-input"
              autoComplete="off"
            />
            <button type="submit" className="join-code-submit" disabled={isJoining || !joinCode.trim()}>
              {isJoining ? "Joining..." : "Join"}
            </button>
            {joinError && <p className="join-code-error">{joinError}</p>}
          </form>
        )}
      </header>

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <div className="contests-tab-bar panel">
        {[
          { key: "live", label: "Live", icon: <Zap size={15} /> },
          { key: "upcoming", label: "Upcoming", icon: <Calendar size={15} /> },
          { key: "ended", label: "Completed", icon: <CheckCircle2 size={15} /> },
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            className={`contest-tab ${activeTab === key ? "active" : ""}`}
            onClick={() => setActiveTab(key)}
          >
            {icon}
            {label}
            {tabCounts[key] > 0 && <span className="tab-count">{tabCounts[key]}</span>}
            {key === "live" && grouped.live?.length > 0 && <span className="live-indicator" />}
          </button>
        ))}
      </div>

      {/* ── Content ──────────────────────────────────────────── */}
      <section className="panel contests-content-panel">
        {isLoading ? (
          <ContestSkeleton />
        ) : activeTab === "live" ? (
          grouped.live?.length === 0 ? (
            <div className="contests-empty-state">
              <Zap size={48} style={{ opacity: 0.15, marginBottom: 16 }} />
              <h3>No Live Contests</h3>
              <p>No contests are running right now. Check back soon or create one!</p>
              <Link to="/contests/create" className="primary-action" style={{ marginTop: 16 }}>
                <Sparkles size={14} /> Create Contest
              </Link>
            </div>
          ) : (
            <div className="contest-pro-grid">
              {grouped.live.map((contest) => (
                <LiveCard key={contest._id} contest={contest} onJoin={handleJoin} isJoining={isJoining} />
              ))}
            </div>
          )
        ) : activeTab === "upcoming" ? (
          grouped.upcoming?.length === 0 ? (
            <div className="contests-empty-state">
              <Calendar size={48} style={{ opacity: 0.15, marginBottom: 16 }} />
              <h3>No Upcoming Contests</h3>
              <p>No contests are scheduled. Create one with a future start time!</p>
            </div>
          ) : (
            <div className="contest-pro-grid">
              {grouped.upcoming.map((contest) => (
                <UpcomingCard key={contest._id} contest={contest} onJoin={handleJoin} isJoining={isJoining} />
              ))}
            </div>
          )
        ) : activeTab === "ended" ? (
          <div className="contest-pro-grid">
            {displayEnded.map((contest) => (
              <CompletedCard
                key={contest._id}
                contest={contest}
                onVirtual={handleVirtual}
                onLeaderboard={setSelectedLeaderboard}
                isVirtualLoading={isVirtualLoading}
              />
            ))}
          </div>
        ) : null}
      </section>

      {/* ── Leaderboard Modal ────────────────────────────────── */}
      {selectedLeaderboard && (
        <ContestLeaderboardModal
          contestId={selectedLeaderboard._id}
          contestTitle={selectedLeaderboard.title}
          onClose={() => setSelectedLeaderboard(null)}
        />
      )}
    </section>
  );
}

export default ContestsPage;