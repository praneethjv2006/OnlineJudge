import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MessageSquare,
  UserX,
  Code,
  Award,
  Calendar,
  TrendingUp,
  Flame,
  Check,
  X,
  Shield,
  Clock,
  Sparkles,
  Zap,
} from "lucide-react";
import { loadFriendProfile } from "../services/authService";
import { openDirectChat } from "../services/chatService";
import { unfriend } from "../services/friendService";
import { toast } from "../components/common/Toast";

// ─── Avatar helper ────────────────────────────────────────────────────────────
function FriendAvatar({ name, size = 96 }) {
  const colors = [
    "#ffa116", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899"
  ];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div
      className="fp-avatar"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${color}cc, ${color}55)`,
        border: `3px solid ${color}88`,
        color: "#fff",
        fontSize: size * 0.38,
        fontWeight: 800,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: `0 0 32px ${color}33`,
      }}
    >
      {name?.[0]?.toUpperCase() || "?"}
    </div>
  );
}

export default function FriendProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchProfile = async () => {
      try {
        const data = await loadFriendProfile(userId);
        if (active) setProfile(data);
      } catch (err) {
        toast.error("Could not load friend profile.");
      } finally {
        if (active) setIsLoading(false);
      }
    };
    fetchProfile();
    return () => {
      active = false;
    };
  }, [userId]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/friends");
    }
  };

  const handleMessage = async () => {
    setActionLoading("message");
    try {
      const { conversation } = await openDirectChat(userId);
      navigate("/messages", { state: { conversationId: conversation._id } });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not open chat.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnfriend = async () => {
    const name = profile?.user?.name || "this user";
    if (!window.confirm(`Remove ${name} from your friends?`)) return;
    setActionLoading("unfriend");
    try {
      await unfriend(userId);
      toast.success(`${name} has been removed from friends.`);
      navigate("/friends");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to remove friend.");
    } finally {
      setActionLoading(null);
    }
  };

  const user = profile?.user;
  const displayName = user?.name || "Coder";
  const displayEmail = user?.email || "";
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" })
    : "Recently";
  const recentSubmissions = profile?.recentSubmissions || [];
  const totalSolved = profile?.totalSolved ?? 0;

  return (
    <div className="fp-full-page">
      {/* ── Top Bar with Full Window Back Button ── */}
      <header className="fp-full-topbar">
        <div className="fp-full-topbar-left">
          <button
            id="friend-profile-back-btn"
            className="fp-back-btn"
            onClick={handleBack}
            title="Go back"
          >
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
          <div className="fp-full-topbar-title">
            <span className="fp-topbar-badge">CODER PROFILE</span>
            <span className="fp-topbar-sep">/</span>
            <span className="fp-topbar-name">{displayName}</span>
          </div>
        </div>

        <div className="fp-full-topbar-right">
          <button
            className="friend-btn friend-btn-primary"
            onClick={handleMessage}
            disabled={!!actionLoading}
          >
            <MessageSquare size={16} />
            <span>Message</span>
          </button>
        </div>
      </header>

      {/* ── Main Profile Body ── */}
      <main className="fp-full-content">
        {isLoading ? (
          <div className="fp-loading" style={{ minHeight: "50vh" }}>
            <div className="fp-loading-spinner" />
            <span>Loading full coder profile…</span>
          </div>
        ) : (
          <>
            {/* Hero Profile Banner */}
            <div className="fp-full-hero panel">
              <div className="fp-hero-left">
                <FriendAvatar name={displayName} size={90} />
                <div className="fp-hero-info">
                  <div className="fp-hero-name-row">
                    <h1 className="fp-hero-name">{displayName}</h1>
                    <span className="fp-status-pill online">
                      <span className="fp-status-dot" /> Online
                    </span>
                  </div>
                  <p className="fp-hero-email">{displayEmail}</p>
                  <div className="fp-hero-meta">
                    <span className="fp-meta-item">
                      <Calendar size={14} />
                      Member since {memberSince}
                    </span>
                    <span className="fp-meta-item">
                      <Shield size={14} />
                      Verified Contestant
                    </span>
                  </div>
                </div>
              </div>

              <div className="fp-hero-actions">
                <button
                  className="friend-btn friend-btn-primary"
                  onClick={handleMessage}
                  disabled={!!actionLoading}
                >
                  <MessageSquare size={15} />
                  <span>{actionLoading === "message" ? "Opening…" : "Direct Message"}</span>
                </button>
                <button
                  className="friend-btn friend-btn-danger"
                  onClick={handleUnfriend}
                  disabled={!!actionLoading}
                >
                  <UserX size={15} />
                  <span>{actionLoading === "unfriend" ? "Removing…" : "Unfriend"}</span>
                </button>
              </div>
            </div>

            {/* Stats Cards Row */}
            <div className="fp-full-stats-grid">
              <div className="fp-full-stat-card panel">
                <div className="fp-stat-icon-box" style={{ background: "rgba(255, 161, 22, 0.12)", color: "var(--accent)" }}>
                  <Code size={22} />
                </div>
                <div className="fp-stat-body">
                  <div className="fp-stat-big-val">{totalSolved}</div>
                  <div className="fp-stat-big-label">Problems Solved</div>
                  <div className="fp-stat-sub">Across All Practice Rooms</div>
                </div>
              </div>

              <div className="fp-full-stat-card panel">
                <div className="fp-stat-icon-box" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
                  <TrendingUp size={22} />
                </div>
                <div className="fp-stat-body">
                  <div className="fp-stat-big-val">{recentSubmissions.length}</div>
                  <div className="fp-stat-big-label">Tracked Submissions</div>
                  <div className="fp-stat-sub">Recent Activity Recorded</div>
                </div>
              </div>

              <div className="fp-full-stat-card panel">
                <div className="fp-stat-icon-box" style={{ background: "rgba(239, 68, 68, 0.12)", color: "#ef4444" }}>
                  <Flame size={22} />
                </div>
                <div className="fp-stat-body">
                  <div className="fp-stat-big-val">Active</div>
                  <div className="fp-stat-big-label">Coder Momentum</div>
                  <div className="fp-stat-sub">Consistent Problem Solver</div>
                </div>
              </div>

              <div className="fp-full-stat-card panel">
                <div className="fp-stat-icon-box" style={{ background: "rgba(155, 93, 229, 0.12)", color: "#9b5de5" }}>
                  <Award size={22} />
                </div>
                <div className="fp-stat-body">
                  <div className="fp-stat-big-val">
                    {totalSolved >= 15 ? "Grandmaster" : totalSolved >= 8 ? "Expert" : totalSolved >= 3 ? "Specialist" : "Novice"}
                  </div>
                  <div className="fp-stat-big-label">Ranking Division</div>
                  <div className="fp-stat-sub">Performance Tier</div>
                </div>
              </div>
            </div>

            {/* Recent Submissions Section */}
            <div className="fp-full-submissions panel">
              <div className="fp-subs-header">
                <div className="fp-subs-title-group">
                  <TrendingUp size={18} style={{ color: "var(--accent)" }} />
                  <h3>Recent Submissions Activity</h3>
                </div>
                <span className="fp-subs-count-tag">{recentSubmissions.length} events</span>
              </div>

              {recentSubmissions.length === 0 ? (
                <div className="fp-empty-submissions">
                  <Clock size={36} />
                  <h4>No submissions yet</h4>
                  <p>When this coder solves challenges, their latest verdicts will appear here.</p>
                </div>
              ) : (
                <div className="fp-submissions-table">
                  <div className="fp-table-head">
                    <span>STATUS</span>
                    <span>PROBLEM</span>
                    <span>DIFFICULTY</span>
                    <span>LANGUAGE</span>
                    <span style={{ textAlign: "right" }}>DATE</span>
                  </div>
                  {recentSubmissions.map((sub) => {
                    const isPassed = sub.verdict === "Accepted";
                    return (
                      <div key={sub._id} className="fp-table-row">
                        <div className="fp-row-status">
                          <span className={`fp-verdict-pill ${isPassed ? "accepted" : "failed"}`}>
                            {isPassed ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
                            {sub.verdict}
                          </span>
                        </div>
                        <div className="fp-row-title">{sub.questionTitle}</div>
                        <div className="fp-row-diff">
                          <span className={`fp-diff-tag ${sub.difficulty?.toLowerCase()}`}>
                            {sub.difficulty || "Medium"}
                          </span>
                        </div>
                        <div className="fp-row-lang">
                          <code>{sub.language?.toUpperCase() || "CPP"}</code>
                        </div>
                        <div className="fp-row-date">
                          {new Date(sub.submittedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
