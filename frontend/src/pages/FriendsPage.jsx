import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserPlus, UserCheck, UserX, Users, Search, Sparkles,
  ChevronRight, Clock, MessageSquare, RefreshCw, X, Check, ExternalLink
} from "lucide-react";
import { useAppContext } from "../App";
import { toast } from "../components/common/Toast";
import {
  searchUsers, sendFriendRequest, acceptFriendRequest, rejectFriendRequest,
  cancelFriendRequest, unfriend, getMyFriends, getIncomingRequests,
  getSentRequests, getFriendSuggestions,
} from "../services/friendService";
import { openDirectChat } from "../services/chatService";
import FriendProfileModal from "../components/social/FriendProfileModal";

// ─── Tabs ────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "discover", label: "Discover", icon: Sparkles },
  { id: "friends", label: "My Friends", icon: Users },
  { id: "requests", label: "Requests", icon: UserPlus },
];

// ─── Avatar helper ───────────────────────────────────────────────────────────
function Avatar({ name, size = 40 }) {
  const colors = [
    "#6366f1","#8b5cf6","#06b6d4","#10b981","#f59e0b","#ef4444","#ec4899"
  ];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div
      className="friend-avatar"
      style={{
        width: size, height: size, borderRadius: "50%",
        backgroundColor: `${color}22`, border: `2px solid ${color}44`,
        color, fontSize: size * 0.4, fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {name?.[0]?.toUpperCase() || "?"}
    </div>
  );
}

// ─── User Card ───────────────────────────────────────────────────────────────
function UserCard({ user, currentUserId, onAction, onMessage, onViewProfile }) {
  const { friendship } = user;
  const [loading, setLoading] = useState(false);

  const handleAction = async (action) => {
    setLoading(true);
    try {
      await onAction(action, user);
    } finally {
      setLoading(false);
    }
  };

  const renderButton = () => {
    if (!friendship) {
      return (
        <button
          className="friend-btn friend-btn-primary"
          onClick={() => handleAction("send")}
          disabled={loading}
        >
          <UserPlus size={15} />
          {loading ? "Sending..." : "Add Friend"}
        </button>
      );
    }
    if (friendship.status === "accepted") {
      return (
        <div className="friend-card-actions-row">
          {onViewProfile && (
            <button className="friend-btn friend-btn-ghost" onClick={() => onViewProfile(user)}>
              <ExternalLink size={15} />
              Profile
            </button>
          )}
          {onMessage && (
            <button className="friend-btn friend-btn-ghost" onClick={() => onMessage(user._id)}>
              <MessageSquare size={15} />
              Message
            </button>
          )}
          <button className="friend-btn friend-btn-danger" onClick={() => handleAction("unfriend")} disabled={loading}>
            <UserX size={15} />
            Unfriend
          </button>
        </div>
      );
    }
    if (friendship.status === "pending" && friendship.iAmRequester) {
      return (
        <button className="friend-btn friend-btn-muted" onClick={() => handleAction("cancel")} disabled={loading}>
          <X size={15} />
          {loading ? "Cancelling..." : "Cancel Request"}
        </button>
      );
    }
    if (friendship.status === "pending" && !friendship.iAmRequester) {
      return (
        <div className="friend-card-actions-row">
          <button className="friend-btn friend-btn-primary" onClick={() => handleAction("accept")} disabled={loading}>
            <Check size={15} />
            Accept
          </button>
          <button className="friend-btn friend-btn-danger" onClick={() => handleAction("reject")} disabled={loading}>
            <X size={15} />
            Decline
          </button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="friend-card">
      <Avatar name={user.name} size={48} />
      <div className="friend-card-info">
        <h4 className="friend-card-name">{user.name}</h4>
        <p className="friend-card-email">{user.email}</p>
        {user.mutualCount > 0 && (
          <span className="friend-mutual-badge">
            <Users size={12} />
            {user.mutualCount} mutual friend{user.mutualCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div className="friend-card-cta">{renderButton()}</div>
    </div>
  );
}

// ─── Request Card ─────────────────────────────────────────────────────────────
function RequestCard({ request, type, onAccept, onReject, onCancel }) {
  const [loading, setLoading] = useState(false);
  const user = type === "incoming" ? request.requester : request.recipient;

  const wrap = async (fn) => {
    setLoading(true);
    try { await fn(); } finally { setLoading(false); }
  };

  return (
    <div className="friend-request-card">
      <Avatar name={user?.name} size={44} />
      <div className="friend-card-info">
        <h4 className="friend-card-name">{user?.name}</h4>
        <p className="friend-card-email">{user?.email}</p>
        <span className="friend-request-time">
          <Clock size={11} />
          {new Date(request.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </div>
      <div className="friend-card-cta">
        {type === "incoming" ? (
          <div className="friend-card-actions-row">
            <button
              className="friend-btn friend-btn-primary"
              onClick={() => wrap(() => onAccept(request._id))}
              disabled={loading}
            >
              <Check size={15} /> Accept
            </button>
            <button
              className="friend-btn friend-btn-danger"
              onClick={() => wrap(() => onReject(request._id))}
              disabled={loading}
            >
              <X size={15} /> Decline
            </button>
          </div>
        ) : (
          <button
            className="friend-btn friend-btn-muted"
            onClick={() => wrap(() => onCancel(request._id))}
            disabled={loading}
          >
            <X size={15} /> Cancel
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Friends Page ────────────────────────────────────────────────────────
function FriendsPage() {
  const { user } = useAppContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("discover");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendsPage, setFriendsPage] = useState(1);
  const [friendsHasMore, setFriendsHasMore] = useState(false);
  const [friendsTotal, setFriendsTotal] = useState(0);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [profileFriend, setProfileFriend] = useState(null);
  const searchTimeout = useRef(null);

  const currentUserId = user?.id || user?._id;

  // ─── Fetch data by tab ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    if (activeTab === "discover") {
      loadSuggestions();
    } else if (activeTab === "friends") {
      loadFriends(1);
    } else if (activeTab === "requests") {
      loadRequests();
    }
  }, [activeTab]);

  const loadSuggestions = async () => {
    setIsLoading(true);
    try {
      const data = await getFriendSuggestions();
      setSuggestions(
        (data.suggestions || []).map((s) => ({
          ...s.user,
          mutualCount: s.mutualCount,
          friendship: null,
        }))
      );
    } catch { /* silent */ }
    setIsLoading(false);
  };

  const loadFriends = async (page = 1) => {
    setIsLoading(true);
    try {
      const data = await getMyFriends(page, 20);
      const mapped = (data.friends || []).map((f) => ({
        ...f.user,
        friendship: { status: "accepted", friendshipId: f.friendshipId, since: f.since },
      }));
      if (page === 1) setFriends(mapped);
      else setFriends((prev) => [...prev, ...mapped]);
      setFriendsPage(page);
      setFriendsHasMore(data.hasMore);
      setFriendsTotal(data.total);
    } catch { /* silent */ }
    setIsLoading(false);
  };

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const [inc, sent] = await Promise.all([getIncomingRequests(), getSentRequests()]);
      setIncomingRequests(inc.requests || []);
      setSentRequests(sent.requests || []);
    } catch { /* silent */ }
    setIsLoading(false);
  };

  // ─── Search ─────────────────────────────────────────────────────────────────
  const handleSearch = useCallback((q) => {
    setSearchQuery(q);
    clearTimeout(searchTimeout.current);
    if (q.trim().length < 2) { setSearchResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      try {
        const data = await searchUsers(q.trim());
        setSearchResults(data.users || []);
      } catch { /* silent */ }
    }, 400);
  }, []);

  // ─── Actions ─────────────────────────────────────────────────────────────────
  const handleUserAction = async (action, user) => {
    try {
      if (action === "send") {
        await sendFriendRequest(user._id);
        toast.success(`Friend request sent to ${user.name}!`);
        // Update local state
        const updateFriendship = (list) =>
          list.map((u) =>
            u._id === user._id
              ? { ...u, friendship: { status: "pending", iAmRequester: true } }
              : u
          );
        setSearchResults((p) => updateFriendship(p));
        setSuggestions((p) => updateFriendship(p));
      } else if (action === "cancel") {
        await cancelFriendRequest(user.friendship.friendshipId);
        toast.success("Request cancelled.");
        const remove = (list) => list.map((u) =>
          u._id === user._id ? { ...u, friendship: null } : u
        );
        setSearchResults((p) => remove(p));
        setSuggestions((p) => remove(p));
      } else if (action === "unfriend") {
        await unfriend(user._id);
        toast.success(`Removed ${user.name} from friends.`);
        setFriends((p) => p.filter((f) => f._id !== user._id));
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Action failed.");
    }
  };

  const handleOpenMessage = async (friendId) => {
    try {
      const { conversation } = await openDirectChat(friendId);
      navigate("/messages", { state: { conversationId: conversation._id } });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not open chat.");
    }
  };

  const handleAccept = async (requestId) => {
    await acceptFriendRequest(requestId);
    toast.success("Friend request accepted!");
    setIncomingRequests((p) => p.filter((r) => r._id !== requestId));
  };

  const handleReject = async (requestId) => {
    await rejectFriendRequest(requestId);
    setIncomingRequests((p) => p.filter((r) => r._id !== requestId));
  };

  const handleCancel = async (requestId) => {
    await cancelFriendRequest(requestId);
    setSentRequests((p) => p.filter((r) => r._id !== requestId));
  };

  const displayUsers = searchQuery.trim().length >= 2 ? searchResults : suggestions;

  return (
    <div className="friends-page-layout">
      {/* Header */}
      <div className="friends-page-header">
        <div>
          <span className="friends-eyebrow">Social Hub</span>
          <h1 className="friends-title">Friends</h1>
          <p className="friends-subtitle">Connect with coders, share solutions, build together.</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <nav className="friends-tabs">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`friends-tab ${activeTab === id ? "active" : ""}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={16} />
            {label}
            {id === "requests" && incomingRequests.length > 0 && (
              <span className="friends-tab-badge">{incomingRequests.length}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <div className="friends-content">

        {/* ── Discover Tab ── */}
        {activeTab === "discover" && (
          <div className="friends-discover">
            {/* Search bar */}
            <div className="friends-search-bar">
              <Search size={18} className="friends-search-icon" />
              <input
                type="search"
                className="friends-search-input"
                placeholder="Search users by name…"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                autoFocus
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); setSearchResults([]); }}>
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Results section */}
            {searchQuery.trim().length >= 2 && (
              <div className="friends-section">
                <h3 className="friends-section-title">
                  Search Results
                  <span className="friends-count">{searchResults.length} user{searchResults.length !== 1 ? "s" : ""}</span>
                </h3>
                {searchResults.length === 0 ? (
                  <div className="friends-empty">No users found for "{searchQuery}"</div>
                ) : (
                  <div className="friends-grid">
                    {searchResults.map((u) => (
                      <UserCard
                        key={u._id}
                        user={u}
                        currentUserId={currentUserId}
                        onAction={handleUserAction}
                        onMessage={handleOpenMessage}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Suggestions */}
            {!searchQuery && (
              <div className="friends-section">
                <div className="friends-section-header">
                  <h3 className="friends-section-title">
                    <Sparkles size={16} />
                    People You May Know
                  </h3>
                  <button className="friends-refresh-btn" onClick={loadSuggestions}>
                    <RefreshCw size={14} />
                  </button>
                </div>
                {isLoading ? (
                  <div className="friends-loading">Finding suggestions…</div>
                ) : suggestions.length === 0 ? (
                  <div className="friends-empty">
                    <Users size={40} />
                    <h3>No suggestions yet</h3>
                    <p>Search for users to connect with coders on this platform.</p>
                  </div>
                ) : (
                  <div className="friends-grid">
                    {suggestions.map((u) => (
                      <UserCard
                        key={u._id}
                        user={u}
                        currentUserId={currentUserId}
                        onAction={handleUserAction}
                        onMessage={handleOpenMessage}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── My Friends Tab ── */}
        {activeTab === "friends" && (
          <div>
            <div className="friends-section">
              <h3 className="friends-section-title">
                <Users size={16} />
                My Friends
                <span className="friends-count">{friendsTotal} total</span>
              </h3>
              {isLoading && friends.length === 0 ? (
                <div className="friends-loading">Loading friends…</div>
              ) : friends.length === 0 ? (
                <div className="friends-empty">
                  <UserPlus size={40} />
                  <h3>No friends yet</h3>
                  <p>Go to Discover to find and connect with coders.</p>
                </div>
              ) : (
                <>
                  <div className="friends-grid">
                    {friends.map((u) => (
                      <UserCard
                        key={u._id}
                        user={u}
                        currentUserId={currentUserId}
                        onAction={handleUserAction}
                        onMessage={handleOpenMessage}
                        onViewProfile={setProfileFriend}
                      />
                    ))}
                  </div>
                  {friendsHasMore && (
                    <div className="friends-load-more">
                      <button
                        className="friend-btn friend-btn-ghost"
                        onClick={() => loadFriends(friendsPage + 1)}
                        disabled={isLoading}
                      >
                        {isLoading ? "Loading…" : "Load More"} <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Requests Tab ── */}
        {activeTab === "requests" && (
          <div>
            {/* Incoming */}
            <div className="friends-section">
              <h3 className="friends-section-title">
                <UserCheck size={16} />
                Incoming Requests
                <span className="friends-count">{incomingRequests.length}</span>
              </h3>
              {isLoading ? (
                <div className="friends-loading">Loading…</div>
              ) : incomingRequests.length === 0 ? (
                <div className="friends-empty-small">No pending incoming requests.</div>
              ) : (
                <div className="friends-request-list">
                  {incomingRequests.map((r) => (
                    <RequestCard
                      key={r._id}
                      request={r}
                      type="incoming"
                      onAccept={handleAccept}
                      onReject={handleReject}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Sent */}
            <div className="friends-section" style={{ marginTop: "32px" }}>
              <h3 className="friends-section-title">
                Sent Requests
                <span className="friends-count">{sentRequests.length}</span>
              </h3>
              {sentRequests.length === 0 ? (
                <div className="friends-empty-small">No pending outgoing requests.</div>
              ) : (
                <div className="friends-request-list">
                  {sentRequests.map((r) => (
                    <RequestCard
                      key={r._id}
                      request={r}
                      type="sent"
                      onCancel={handleCancel}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Friend Profile Modal */}
    {profileFriend && (
      <FriendProfileModal
        friend={profileFriend}
        onClose={() => setProfileFriend(null)}
        onMessage={(convId) => {
          setProfileFriend(null);
          navigate("/messages", { state: { conversationId: convId } });
        }}
        onUnfriend={(friendId) => {
          setFriends((prev) => prev.filter((f) => f._id !== friendId));
          setProfileFriend(null);
        }}
      />
    )}
  </>;
}

export default FriendsPage;
