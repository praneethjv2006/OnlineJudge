import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../App";
import { loadDashboardStats } from "../services/authService";
import { getErrorMessage } from "../services/api";
import { toast } from "../components/common/Toast";
import Editor from "@monaco-editor/react";
import { 
  Calendar, 
  Flame, 
  Activity, 
  Code, 
  X, 
  Info,
  Zap,
  Target,
  Cpu,
  Layers,
  Award,
  Star,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  LogIn
} from "lucide-react";

const getMonthName = (monthIndex) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months[monthIndex];
};



function RankLadderModal({ isOpen, onClose, overallRating = 0, currentTier = {} }) {
  if (!isOpen) return null;

  const RANKS = [
    { name: "Novice", range: "< 1200", threshold: 0, color: "#0ea5e9", glow: "rgba(14, 165, 233, 0.35)" },
    { name: "Apprentice", range: "1200–1399", threshold: 1200, color: "#10b981", glow: "rgba(16, 185, 129, 0.35)" },
    { name: "Adept", range: "1400–1599", threshold: 1400, color: "#06b6d4", glow: "rgba(6, 182, 212, 0.35)" },
    { name: "Virtuoso", range: "1600–1899", threshold: 1600, color: "#6366f1", glow: "rgba(99, 102, 241, 0.35)" },
    { name: "Elite", range: "1900–2199", threshold: 1900, color: "#a855f7", glow: "rgba(168, 85, 247, 0.35)" },
    { name: "Legend", range: "2200–2499", threshold: 2200, color: "#f59e0b", glow: "rgba(245, 158, 11, 0.35)" },
    { name: "Apex", range: "2500+", threshold: 2500, color: "#ef4444", glow: "rgba(239, 68, 68, 0.35)" },
  ];

  return (
    <div className="cf-ladder-modal-overlay" onClick={onClose}>
      <div className="cf-ladder-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cf-ladder-modal-header">
          <div className="cf-ladder-modal-title-group">
            <div className="cf-ladder-modal-icon" style={{ background: `${currentTier.color || "#0ea5e9"}22`, color: currentTier.color || "#38bdf8", borderColor: `${currentTier.color || "#0ea5e9"}44` }}>
              <Award size={20} />
            </div>
            <div>
              <h3 className="cf-ladder-modal-title">Rank Progression Ladder</h3>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "#94a3b8" }}>
                Official rating milestones and rank progression tiers
              </p>
            </div>
          </div>
          <button className="cf-ladder-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="cf-ladder-modal-body">
          {/* Current Status Banner */}
          <div className="cf-ladder-current-banner" style={{ borderColor: `${currentTier.color || "#0ea5e9"}66`, background: `linear-gradient(135deg, ${currentTier.color || "#0ea5e9"}18 0%, rgba(255, 255, 255, 0.02) 100%)` }}>
            <div>
              <span style={{ fontSize: "0.72rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", display: "block" }}>
                Your Current Standing
              </span>
              <strong style={{ fontSize: "1.35rem", color: currentTier.color || "#fff", letterSpacing: "-0.02em" }}>
                {overallRating} <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>({currentTier.name || "Novice"})</span>
              </strong>
            </div>
            <div className="cf-status-badge current" style={{ background: `${currentTier.color || "#0ea5e9"}25`, color: currentTier.color || "#38bdf8", borderColor: `${currentTier.color || "#0ea5e9"}55` }}>
              Active Rank
            </div>
          </div>

          {/* Ranks List */}
          <div className="cf-ladder-ranks-list">
            {RANKS.map((rank, idx) => {
              const isCurrent = currentTier.name === rank.name;
              const isPassed = overallRating >= rank.threshold;
              const ptsNeeded = rank.threshold - overallRating;

              return (
                <div
                  key={rank.name}
                  className={`cf-ladder-row ${isCurrent ? "is-current" : isPassed ? "is-passed" : ""}`}
                  style={{
                    "--tier-color": rank.color,
                    "--tier-glow": rank.glow,
                  }}
                >
                  <div className="cf-ladder-row-left">
                    <div className="cf-ladder-step-num" style={{ color: isCurrent ? rank.color : isPassed ? "#10b981" : "#64748b" }}>
                      #{idx + 1}
                    </div>
                    <div className="cf-tier-dot" style={{ background: rank.color, boxShadow: `0 0 10px ${rank.color}` }} />
                    <div className="cf-tier-details">
                      <span className="cf-tier-name-label" style={{ color: rank.color }}>
                        {rank.name}
                      </span>
                      <span className="cf-tier-range-label">
                        Rating {rank.range}
                      </span>
                    </div>
                  </div>

                  <div className="cf-ladder-row-right">
                    {isCurrent ? (
                      <span className="cf-status-badge current" style={{ background: `${rank.color}25`, color: rank.color, borderColor: `${rank.color}55` }}>
                        Current Rank
                      </span>
                    ) : isPassed ? (
                      <span className="cf-status-badge achieved">Unlocked ✓</span>
                    ) : (
                      <span className="cf-status-badge locked">
                        +{ptsNeeded} pts
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const GUEST_STATS = {
  user: {
    name: "Guest User",
    email: "Sign in to track progress",
    createdAt: null,
  },
  totalSolved: 0,
  submissions: [],
  skillMetadata: {
    overallRating: 0,
    tier: "Novice",
  },
  performanceRatings: {
    solvingSpeed: { percentage: 0, rating: 0, score: 0, tier: "Unranked" },
    codeQuality: { percentage: 0, rating: 0, score: 0, tier: "Unranked" },
    optimizationAbility: { percentage: 0, rating: 0, score: 0, tier: "Unranked" },
    memoryEfficiency: { percentage: 0, rating: 0, score: 0, tier: "Unranked" },
  },
};

function DashboardPage() {
  const { user: sessionUser } = useAppContext();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubCode, setSelectedSubCode] = useState(null);
  const [selectedSubTitle, setSelectedSubTitle] = useState("");
  const [selectedSubLanguage, setSelectedSubLanguage] = useState("");
  const [showLadderModal, setShowLadderModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!sessionUser) {
      setStats(GUEST_STATS);
      setIsLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        const data = await loadDashboardStats();
        if (isMounted) {
          setStats(data);
        }
      } catch (err) {
        toast.error(getErrorMessage(err, "Unable to load dashboard stats. Please try again."));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    fetchStats();
    return () => {
      isMounted = false;
    };
  }, [sessionUser]);

  if (isLoading) {
    return (
      <section className="page-stack dashboard-page">
        <div className="dashboard-skeleton">
          <div className="dashboard-grid-main">
            <div className="panel" style={{ padding: "28px", display: "flex", gap: "16px", alignItems: "center" }}>
              <div className="sk-line" style={{ width: "72px", height: "72px", borderRadius: "50%", flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                <div className="sk-line" style={{ height: "22px", width: "60%" }} />
                <div className="sk-line" style={{ height: "14px", width: "40%" }} />
              </div>
            </div>
            <div className="panel" style={{ padding: "28px", display: "flex", gap: "20px", alignItems: "center" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                <div className="sk-line" style={{ height: "18px", width: "50%" }} />
                <div className="sk-line" style={{ height: "32px", width: "80%" }} />
              </div>
              <div className="sk-line" style={{ width: "80px", height: "80px", borderRadius: "50%", flexShrink: 0 }} />
            </div>
          </div>
          <div className="panel" style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="sk-line" style={{ height: "22px", width: "200px" }} />
            {[1, 2, 3].map(i => (
              <div key={i} style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <div className="sk-line" style={{ width: "44px", height: "44px", borderRadius: "10px", flexShrink: 0 }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div className="sk-line" style={{ height: "14px", width: "70%" }} />
                  <div className="sk-line" style={{ height: "8px", width: "100%", borderRadius: "4px" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const { totalSolved = 0, submissions = [], skillMetadata = null, performanceRatings = null } = stats || {};

  // Calculate submission map and streaks
  const submissionsMap = {};
  const submissionDates = new Set();
  let pastYearCount = 0;
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  oneYearAgo.setHours(0, 0, 0, 0);

  submissions.forEach((sub) => {
    const date = new Date(sub.submittedAt);
    const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
    submissionsMap[dateStr] = (submissionsMap[dateStr] || 0) + 1;
    submissionDates.add(dateStr);

    if (date >= oneYearAgo) {
      pastYearCount++;
    }
  });

  // Calculate Max Streak
  const sortedDates = Array.from(submissionDates).sort();
  let maxStreak = 0;
  let currentStreak = 0;
  let prevDateStr = null;

  sortedDates.forEach((dateStr) => {
    const currentDate = new Date(dateStr);
    currentDate.setHours(0, 0, 0, 0);

    if (!prevDateStr) {
      currentStreak = 1;
    } else {
      const prevDate = new Date(prevDateStr);
      prevDate.setHours(0, 0, 0, 0);
      
      const diffTime = Math.abs(currentDate - prevDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak++;
      } else if (diffDays > 1) {
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
        }
        currentStreak = 1;
      }
    }
    prevDateStr = dateStr;
  });

  if (currentStreak > maxStreak) {
    maxStreak = currentStreak;
  }

  // Generate the last 12 months grids
  const getMonthsGrids = () => {
    const monthsData = [];
    const today = new Date();
    let currentYear = today.getFullYear();
    let currentMonthIdx = today.getMonth();

    // Generate month details backwards for 12 months, then reverse
    for (let i = 0; i < 12; i++) {
      monthsData.push({ year: currentYear, month: currentMonthIdx });
      currentMonthIdx--;
      if (currentMonthIdx < 0) {
        currentMonthIdx = 11;
        currentYear--;
      }
    }
    monthsData.reverse();

    return monthsData.map(({ year, month }) => {
      const firstDay = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
      const totalDays = new Date(year, month + 1, 0).getDate();

      const slots = [];
      // Pad first week
      for (let d = 0; d < firstDay; d++) {
        slots.push(null);
      }
      // Add days
      for (let day = 1; day <= totalDays; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const count = submissionsMap[dateStr] || 0;
        let level = 0;
        if (count > 0) {
          if (count <= 2) level = 1;
          else if (count <= 5) level = 2;
          else if (count <= 9) level = 3;
          else level = 4;
        }
        slots.push({ day, dateStr, count, level });
      }

      // Group slots into weeks (columns)
      const weeks = [];
      for (let j = 0; j < slots.length; j += 7) {
        const week = slots.slice(j, j + 7);
        // Pad the last week if it is incomplete
        while (week.length < 7) {
          week.push(null);
        }
        weeks.push(week);
      }

      return {
        name: getMonthName(month),
        year,
        weeks,
      };
    });
  };

  const monthsGrids = getMonthsGrids();

  const overallRating = Number(skillMetadata?.overallRating) || 0;

  const RANKS_LADDER = [
    { name: "Novice", threshold: 0, min: 0, max: 1199, color: "#0ea5e9", glow: "rgba(14, 165, 233, 0.45)" },
    { name: "Apprentice", threshold: 1200, min: 1200, max: 1399, color: "#10b981", glow: "rgba(16, 185, 129, 0.45)" },
    { name: "Adept", threshold: 1400, min: 1400, max: 1599, color: "#06b6d4", glow: "rgba(6, 182, 212, 0.45)" },
    { name: "Virtuoso", threshold: 1600, min: 1600, max: 1899, color: "#6366f1", glow: "rgba(99, 102, 241, 0.45)" },
    { name: "Elite", threshold: 1900, min: 1900, max: 2199, color: "#a855f7", glow: "rgba(168, 85, 247, 0.45)" },
    { name: "Legend", threshold: 2200, min: 2200, max: 2499, color: "#f59e0b", glow: "rgba(245, 158, 11, 0.45)" },
    { name: "Apex", threshold: 2500, min: 2500, max: 3500, color: "#ef4444", glow: "rgba(239, 68, 68, 0.45)" },
  ];

  let currentTierIdx = 0;
  for (let i = RANKS_LADDER.length - 1; i >= 0; i--) {
    if (overallRating >= RANKS_LADDER[i].threshold) {
      currentTierIdx = i;
      break;
    }
  }
  const currentTier = RANKS_LADDER[currentTierIdx];
  const nextTier = currentTierIdx < RANKS_LADDER.length - 1 ? RANKS_LADDER[currentTierIdx + 1] : null;
  const pointsToNext = nextTier ? Math.max(0, nextTier.threshold - overallRating) : 0;
  const tierSpan = nextTier ? (nextTier.threshold - currentTier.threshold) : 1000;
  const tierProgress = nextTier
    ? Math.min(100, Math.max(0, Math.round(((overallRating - currentTier.threshold) / tierSpan) * 100)))
    : 100;

  return (
    <section className="page-stack dashboard-page">
      {/* Guest Mode Callout Banner */}
      {!sessionUser && (
        <div className="guest-dashboard-banner">
          <div className="guest-dashboard-banner-content">
            <div className="guest-dashboard-icon-wrap">
              <Sparkles size={22} />
            </div>
            <div className="guest-dashboard-text">
              <h4>Viewing Dashboard as Guest</h4>
              <p>
                All statistics, ratings, streaks, and submissions are set to zero. 
                <strong> Log in</strong> or create an account to track your problem-solving progress, climb the ranks, and unlock AI performance insights.
              </p>
            </div>
          </div>
          <div className="guest-dashboard-actions">
            <Link to="/auth" className="guest-dashboard-login-btn">
              <LogIn size={16} />
              <span>Login to Track Progress</span>
            </Link>
          </div>
        </div>
      )}

      {/* 1. TOP CARDS ROW (Profile | Overall Rating (Center) | Problems Solved (Right)) */}
      <div className="dashboard-grid-main">
        {/* Profile Details Card (Left) */}
        <div className="profile-card-premium">
          <div className="profile-avatar-large">
            {sessionUser?.name?.[0]?.toUpperCase() || stats?.user?.name?.[0]?.toUpperCase() || "G"}
          </div>
          <div className="profile-info-details">
            <h2>{sessionUser?.name || stats?.user?.name || "Guest User"}</h2>
            <p style={{ color: "#fff", opacity: 0.9 }}>
              {sessionUser?.email || stats?.user?.email || "guest@apexjudge.io"}
            </p>
            <p style={{ fontSize: "0.8rem" }}>
              {sessionUser?.createdAt || stats?.user?.createdAt
                ? `Member since ${new Date(sessionUser?.createdAt || stats?.user?.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" })}`
                : "Guest Mode (Not Logged In)"}
            </p>
          </div>
        </div>

        {/* Overall Rating & Rank Card (Center Highlighted with Yellow Boundary) */}
        <div
          className="rating-card-premium"
          style={{
            borderColor: "rgba(255, 161, 22, 0.65)",
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 161, 22, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
          }}
        >
          <div className="rating-card-content">
            <div className="rating-card-top">
              <div className="rating-header-left">
                <div className="rating-kicker-row">
                  <span className="rating-card-kicker">Overall Rating</span>
                </div>
                <div className="rating-num-wrap">
                  <span className="rating-hero-score" style={{ color: "#ffa116" }}>
                    {overallRating}
                  </span>
                  <span
                    className="rating-tier-pill"
                    style={{
                      color: "#ffa116",
                      background: "rgba(255, 161, 22, 0.1)",
                      borderColor: "rgba(255, 161, 22, 0.35)",
                    }}
                  >
                    {currentTier.name}
                  </span>
                </div>
              </div>

              {/* Rank Ladder Info Box / Button */}
              <button
                type="button"
                className="cf-ladder-info-btn"
                onClick={() => setShowLadderModal(true)}
                title="View Rank Progression Ladder"
                style={{
                  color: "#e2e8f0",
                  background: "rgba(255, 255, 255, 0.05)",
                  borderColor: "rgba(255, 255, 255, 0.15)",
                }}
              >
                <Info size={14} style={{ color: "#ffa116" }} />
                <span>Rank Ladder</span>
              </button>
            </div>

            {/* Progress to next rank */}
            <div className="rating-card-bottom">
              <div className="rating-progress-meta-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.74rem" }}>
                <span className="rating-progress-label" style={{ color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {nextTier ? `Progress to ${nextTier.name}` : "Maximum Rank Achieved"}
                </span>
                <span className="rating-progress-pct" style={{ color: "#ffa116", fontWeight: 700 }}>
                  {tierProgress}%
                </span>
              </div>
              <div className="rating-progress-bar-wrap">
                <div
                  className="rating-progress-bar-fill"
                  style={{
                    width: `${tierProgress}%`,
                    background: "#ffa116",
                  }}
                />
              </div>
              <span className="rating-next-tier-hint">
                {nextTier ? (
                  <>
                    <strong style={{ color: "#fff" }}>+{pointsToNext} pts</strong> to{" "}
                    <span style={{ color: "#ffa116", fontWeight: 700 }}>{nextTier.name}</span> ({nextTier.threshold})
                  </>
                ) : (
                  <span style={{ color: "#ffa116", fontWeight: 700 }}>Top Tier Rating Reached</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Total Problems Solved Statistics Card (Right End) */}
        <div className="stats-card-premium">
          <div className="stats-details-list">
            <span>Practice & Contests</span>
            <strong>{totalSolved} Problems Solved</strong>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "var(--muted)" }}>
              Total challenges completed
            </p>
          </div>
          <div className="stats-circle-container">
            <div className="stats-circle-number">{totalSolved}</div>
          </div>
        </div>
      </div>

      {/* PERFORMANCE RATINGS (AI-Analyzed Percentage & Average System) */}
      <div className="cognitive-profile-card panel">
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
          <Award size={18} style={{ color: "#38bdf8" }} />
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "#fff" }}>Performance Ratings</h3>
          <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "var(--muted)", fontStyle: "italic" }}>
            Average Performance Across Solved Problems
          </span>
        </div>

        {(() => {
          const dims = [
            {
              key: "solvingSpeed",
              label: "Solving Speed",
              icon: Zap,
              desc: "First-solve attempt efficiency",
              color: "#06b6d4",
              lightColor: "#22d3ee",
              bgGradient: "linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(6, 182, 212, 0.02))",
              borderColor: "rgba(6, 182, 212, 0.28)",
              barGradient: "linear-gradient(90deg, #0891b2, #06b6d4, #22d3ee)",
            },
            {
              key: "codeQuality",
              label: "Code Quality",
              icon: Star,
              desc: "Readability & clean structure",
              color: "#a855f7",
              lightColor: "#c084fc",
              bgGradient: "linear-gradient(135deg, rgba(168, 85, 247, 0.12), rgba(168, 85, 247, 0.02))",
              borderColor: "rgba(168, 85, 247, 0.28)",
              barGradient: "linear-gradient(90deg, #7e22ce, #a855f7, #c084fc)",
            },
            {
              key: "optimizationAbility",
              label: "Optimization",
              icon: Activity,
              desc: "Time complexity & efficiency",
              color: "#f59e0b",
              lightColor: "#fbbf24",
              bgGradient: "linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(245, 158, 11, 0.02))",
              borderColor: "rgba(245, 158, 11, 0.28)",
              barGradient: "linear-gradient(90deg, #d97706, #f59e0b, #fbbf24)",
            },
            {
              key: "memoryEfficiency",
              label: "Memory Efficiency",
              icon: Cpu,
              desc: "Space usage & lightweight footprint",
              color: "#10b981",
              lightColor: "#34d399",
              bgGradient: "linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(16, 185, 129, 0.02))",
              borderColor: "rgba(16, 185, 129, 0.28)",
              barGradient: "linear-gradient(90deg, #059669, #10b981, #34d399)",
            },
          ];
          const perf = performanceRatings || {};

          return (
            <div className="perf-cards-row">
              {dims.map(({ key, label, icon: Icon, desc, color, lightColor, bgGradient, borderColor, barGradient }) => {
                const dim = perf[key] || { percentage: 0, rating: 0, score: 0, tier: "Unranked" };
                const pct = dim.percentage !== undefined && dim.percentage !== null
                  ? dim.percentage
                  : dim.rating > 0 && dim.rating <= 100
                  ? dim.rating
                  : dim.score > 0
                  ? Math.round(dim.score * 10)
                  : Math.min(100, Math.round(((dim.rating || 0) / 3000) * 100));

                const avgScore = dim.score !== undefined && dim.score > 0
                  ? Number(dim.score).toFixed(1)
                  : (pct / 10).toFixed(1);

                return (
                  <div
                    key={key}
                    className="perf-stat-card"
                    style={{
                      '--card-accent': color,
                      '--card-light': lightColor,
                      background: bgGradient,
                      borderColor: borderColor,
                    }}
                  >
                    <div className="perf-stat-header">
                      <div
                        className="perf-stat-icon-wrap"
                        style={{
                          color: lightColor,
                          background: `${color}22`,
                          borderColor: `${color}44`,
                        }}
                      >
                        <Icon size={18} />
                      </div>
                      <div className="perf-stat-title-group">
                        <h4 className="perf-stat-title">{label}</h4>
                        <p className="perf-stat-desc">{desc}</p>
                      </div>
                    </div>

                    <div className="perf-stat-body">
                      <div className="perf-stat-rating-wrap">
                        <span className="perf-stat-rating-val" style={{ color: lightColor }}>
                          {pct}
                          <span className="perf-stat-pct-sign">%</span>
                        </span>
                        <span
                          className="perf-stat-score-pill"
                          style={{
                            color: lightColor,
                            background: `${color}18`,
                            borderColor: `${color}33`,
                          }}
                        >
                          {avgScore} / 10
                        </span>
                      </div>
                    </div>

                    <div className="perf-stat-footer">
                      <div className="perf-stat-bar-track">
                        <div
                          className="perf-stat-bar-fill"
                          style={{
                            width: `${pct}%`,
                            background: barGradient,
                            boxShadow: `0 0 10px ${color}66`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Rank Ladder Modal */}
      <RankLadderModal
        isOpen={showLadderModal}
        onClose={() => setShowLadderModal(false)}
        overallRating={overallRating}
        currentTier={currentTier}
      />

      {/* 2. ACTIVITY HEATMAP CARD (Leetcode-Style) */}
      <div className="heatmap-card-container">
        <div className="heatmap-header-row">
          <div className="heatmap-header-left">
            <Calendar size={18} className="muted" />
            <h3>{pastYearCount} submissions in the past one year</h3>
            <Info size={14} className="muted" style={{ cursor: "pointer" }} title="Code answers submitted in contest rooms" />
          </div>
          <div className="heatmap-header-meta-row">
            <span>Total active days: <strong>{submissionDates.size}</strong></span>
            <span>•</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Flame size={15} style={{ color: "var(--accent)" }} />
              Max streak: <strong>{maxStreak} days</strong>
            </span>
          </div>
        </div>

        <div className="heatmap-grid-scroll-wrapper">
          <div className="heatmap-months-flex">
            {monthsGrids.map((month, mIdx) => (
              <div className="heatmap-month-column" key={`${month.name}-${mIdx}`}>
                <div className="heatmap-week-cols-container">
                  {month.weeks.map((week, wIdx) => (
                    <div className="heatmap-week-col" key={wIdx}>
                      {week.map((day, dIdx) => {
                        if (!day) {
                          return (
                            <div 
                              className="heatmap-day-square" 
                              style={{ backgroundColor: "transparent", pointerEvents: "none" }} 
                              key={dIdx} 
                            />
                          );
                        }
                        return (
                          <div 
                            className={`heatmap-day-square level-${day.level}`} 
                            key={dIdx}
                            title={`${day.dateStr}: ${day.count} submissions`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
                <span className="heatmap-month-label">{month.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. MY SUBMISSIONS LIST (Leetcode-Style) */}
      <div className="submissions-table-card">
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
          <Activity size={18} className="muted" />
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "#fff" }}>Recent Submissions</h3>
        </div>

        {submissions.length === 0 ? (
          <div className="empty-state" style={{ padding: "40px 0" }}>
            <h3>No submissions recorded yet.</h3>
            <p>
              {!sessionUser
                ? "Sign in and submit solutions in practice or contests to record your history."
                : "Enter a contest room or solve practice problems to view your submission records."}
            </p>
            {!sessionUser && (
              <div style={{ marginTop: "16px" }}>
                <Link
                  to="/auth"
                  className="ghost-button"
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 18px", borderRadius: "10px" }}
                >
                  <LogIn size={15} /> Sign In to start solving
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="submissions-table">
              <thead>
                <tr>
                  <th>Verdict</th>
                  <th>Problem / Challenge</th>
                  <th>Difficulty</th>
                  <th>Language</th>
                  <th>Date & Time</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => {
                  const isAccepted = sub.verdict === "Accepted";
                  const cleanVerdict = sub.verdict || "Wrong Answer";

                  return (
                    <tr key={sub._id}>
                      <td>
                        <span className={`verdict-badge-leetcode ${isAccepted ? 'Accepted' : cleanVerdict === 'Wrong Answer' ? 'Wrong-Answer' : 'other'}`}>
                          {cleanVerdict}
                        </span>
                      </td>
                      <td style={{ fontWeight: "600", color: "#fff" }}>
                        {sub.questionTitle}
                      </td>
                      <td>
                        <span className={`difficulty-tag-v2 ${sub.difficulty || 'medium'}`}>
                          {sub.difficulty || 'medium'}
                        </span>
                      </td>
                      <td style={{ textTransform: "uppercase", fontSize: "0.85rem", fontWeight: "600" }}>
                        {sub.language}
                      </td>
                      <td style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                        {new Date(sub.submittedAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button 
                          type="button" 
                          className="ghost-button" 
                          style={{ minHeight: "30px", padding: "0 12px", borderRadius: "8px", fontSize: "0.8rem" }}
                          onClick={() => {
                            setSelectedSubCode(sub.code);
                            setSelectedSubTitle(`${sub.questionTitle} (${sub.language.toUpperCase()})`);
                            setSelectedSubLanguage(sub.language);
                          }}
                        >
                          <Code size={14} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                          View Code
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. CODE VIEW MODAL OVERLAY */}
      {selectedSubCode !== null && (
        <div className="code-modal-backdrop" onClick={() => setSelectedSubCode(null)}>
          <div className="code-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="code-modal-header">
              <h3>Source Code: {selectedSubTitle}</h3>
              <button className="code-modal-close-btn" onClick={() => setSelectedSubCode(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="code-modal-body" style={{ padding: 0 }}>
              <Editor
                height="450px"
                language={selectedSubLanguage === 'cpp' ? 'cpp' : selectedSubLanguage === 'javascript' ? 'javascript' : selectedSubLanguage === 'python' ? 'python' : 'c'}
                theme="vs-dark"
                value={selectedSubCode}
                options={{
                  readOnly: true,
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  lineNumbers: "on",
                  folding: true,
                  wordWrap: "on"
                }}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default DashboardPage;
