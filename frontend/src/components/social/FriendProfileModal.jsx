import { useEffect, useState } from "react";
import { X, Code, Award, Calendar, TrendingUp, MessageSquare, UserX, Flame } from "lucide-react";
import PropTypes from "prop-types";
import { loadFriendProfile } from "../../services/authService";
import { openDirectChat } from "../../services/chatService";
import { unfriend } from "../../services/friendService";
import { toast } from "../common/Toast";

// ─── Avatar helper ────────────────────────────────────────────────────────────
function FriendAvatar({ name, size = 80 }) {
  const colors = [
    "#ffa116","#8b5cf6","#06b6d4","#10b981","#f59e0b","#ef4444","#ec4899"
  ];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div
      className="fp-avatar"
      style={{
        width: size, height: size, borderRadius: "50%",
        background: `linear-gradient(135deg, ${color}cc, ${color}66)`,
        border: `3px solid ${color}55`,
        color: "#fff", fontSize: size * 0.38, fontWeight: 800,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, boxShadow: `0 0 24px ${color}33`,
      }}
    >
      {name?.[0]?.toUpperCase() || "?"}
    </div>
  );
}

FriendAvatar.propTypes = { name: PropTypes.string, size: PropTypes.number };

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="fp-stat-card" style={{ borderColor: `${color}33` }}>
      <div className="fp-stat-icon" style={{ background: `${color}18`, color }}>
        <Icon size={18} />
      </div>
      <div>
        <div className="fp-stat-value">{value}</div>
        <div className="fp-stat-label">{label}</div>
      </div>
    </div>
  );
}

StatCard.propTypes = {
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  icon: PropTypes.elementType,
  color: PropTypes.string,
};

// ─── Main Modal ───────────────────────────────────────────────────────────────
function FriendProfileModal({ friend, onClose, onMessage, onUnfriend }) {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await loadFriendProfile(friend._id);
        setProfile(data);
      } catch {
        toast.error("Could not load profile.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [friend._id]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleMessage = async () => {
    setActionLoading("message");
    try {
      const { conversation } = await openDirectChat(friend._id);
      onMessage(conversation._id);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not open chat.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnfriend = async () => {
    const name = friend.name || profile?.user?.name || "this user";
    if (!window.confirm(`Remove ${name} from friends?`)) return;
    setActionLoading("unfriend");
    try {
      await unfriend(friend._id);
      toast.success(`${friend.name} removed from friends.`);
      onUnfriend?.(friend._id);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to unfriend.");
    } finally {
      setActionLoading(null);
    }
  };

  const displayName = friend.name || profile?.user?.name || "Loading...";
  const displayEmail = friend.email || profile?.user?.email || "";

  const memberSince = profile?.user?.createdAt
    ? new Date(profile.user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" })
    : "—";

  const recentSubmissions = profile?.recentSubmissions || [];

  return (
    <div className="fp-modal-overlay" onClick={onClose}>
      <div className="fp-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close */}
        <button className="fp-close-btn" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        {isLoading ? (
          <div className="fp-loading">
            <div className="fp-loading-spinner" />
            <span>Loading profile…</span>
          </div>
        ) : (
          <>
            {/* ── Header ── */}
            <div className="fp-header">
              <FriendAvatar name={displayName} size={80} />
              <div className="fp-header-info">
                <h2 className="fp-name">{displayName}</h2>
                <p className="fp-email">{displayEmail}</p>
                <p className="fp-member-since">
                  <Calendar size={13} />
                  Member since {memberSince}
                </p>
              </div>
              <div className="fp-header-actions">
                <button
                  className="friend-btn friend-btn-primary"
                  onClick={handleMessage}
                  disabled={!!actionLoading}
                >
                  <MessageSquare size={15} />
                  {actionLoading === "message" ? "Opening…" : "Message"}
                </button>
                <button
                  className="friend-btn friend-btn-danger"
                  onClick={handleUnfriend}
                  disabled={!!actionLoading}
                >
                  <UserX size={15} />
                  {actionLoading === "unfriend" ? "Removing…" : "Unfriend"}
                </button>
              </div>
            </div>

            {/* ── Stats Row ── */}
            <div className="fp-stats-row">
              <StatCard
                label="Problems Solved"
                value={profile?.totalSolved ?? 0}
                icon={Code}
                color="#ffa116"
              />
              <StatCard
                label="Submissions"
                value={recentSubmissions.length > 0 ? `${recentSubmissions.length}+ tracked` : "0"}
                icon={TrendingUp}
                color="#10b981"
              />
              <StatCard
                label="Best Streak"
                value="—"
                icon={Flame}
                color="#ef4444"
              />
              <StatCard
                label="Rank"
                icon={Award}
                value={
                  (profile?.totalSolved || 0) >= 10
                    ? "Elite"
                    : (profile?.totalSolved || 0) >= 5
                    ? "Advanced"
                    : "Beginner"
                }
                color="#f59e0b"
              />
            </div>

            {/* ── Recent Submissions ── */}
            <div className="fp-submissions-section">
              <h3 className="fp-section-title">
                <TrendingUp size={16} />
                Recent Activity
              </h3>
              {recentSubmissions.length === 0 ? (
                <div className="fp-empty-subs">No recent submissions recorded.</div>
              ) : (
                <div className="fp-sub-list">
                  {recentSubmissions.map((sub) => (
                    <div key={sub._id} className="fp-sub-row">
                      <span
                        className={`fp-verdict-badge ${sub.verdict === "Accepted" ? "accepted" : "failed"}`}
                      >
                        {sub.verdict === "Accepted" ? "✓" : "✗"}
                      </span>
                      <span className="fp-sub-title">{sub.questionTitle}</span>
                      <span className={`fp-diff-tag ${sub.difficulty}`}>{sub.difficulty}</span>
                      <span className="fp-sub-lang">{sub.language?.toUpperCase()}</span>
                      <span className="fp-sub-date">
                        {new Date(sub.submittedAt).toLocaleDateString("en-US", {
                          month: "short", day: "numeric"
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

FriendProfileModal.propTypes = {
  friend: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string,
    email: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onMessage: PropTypes.func.isRequired,
  onUnfriend: PropTypes.func,
};

export default FriendProfileModal;
