import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserPlus, UserCheck, UserX, Users, Search, Sparkles,
  ChevronRight, Clock, MessageSquare, RefreshCw, X, Check,
  ExternalLink, Shield, Hash,
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

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "discover",  label: "Discover",     icon: Sparkles    },
  { id: "friends",   label: "My Friends",   icon: Users       },
  { id: "requests",  label: "Requests",     icon: UserPlus    },
];

// ─── Online status (deterministic simulation) ─────────────────────────────────
const getOnlineStatus = (userId = "") => {
  const sum = userId.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const isOnline = sum % 3 === 0;
  if (isOnline) return { isOnline: true, label: "Online" };
  const ago   = (sum % 119) + 2;
  const label = ago < 60 ? `${ago}m ago` : `${Math.floor(ago / 60)}h ago`;
  return { isOnline: false, label: `Active ${label}` };
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
const PALETTE = ["#ffa116","#8b5cf6","#06b6d4","#10b981","#f59e0b","#ef4444","#ec4899"];
const avatarColor = (name = "") => PALETTE[name.charCodeAt(0) % PALETTE.length];

function Avatar({ name = "", size = 44, showDot = false, isOnline = false }) {
  const color = avatarColor(name);
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <div
        className="friend-avatar"
        style={{
          width: size, height: size, borderRadius: "50%",
          background: `linear-gradient(135deg, ${color}33, ${color}11)`,
          border: `2px solid ${color}55`, color, boxSizing: "border-box",
          fontSize: size * 0.38, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {name[0]?.toUpperCase() || "?"}
      </div>
      {showDot && (
        <span
          style={{
            position: "absolute", bottom: 1, right: 1,
            width: 11, height: 11, borderRadius: "50%",
            background: isOnline ? "#10b981" : "#555",
            border: "2px solid var(--color-surface-1)",
          }}
        />
      )}
    </div>
  );
}

// ─── Friend Card ──────────────────────────────────────────────────────────────
function FriendCard({ user, onMessage, onViewProfile, onUnfriend }) {
  const [loading, setLoading] = useState(null);
  const { isOnline, label } = getOnlineStatus(user._id);

  const wrap = async (key, fn) => {
    setLoading(key);
    try { await fn(); } catch (e) { toast.error(e?.response?.data?.message || "Error."); }
    finally { setLoading(null); }
  };

  return (
    <div className="friend-card">
      <Avatar name={user.name} size={48} showDot isOnline={isOnline} />
      <div className="friend-card-info" style={{ flex: 1, minWidth: 0 }}>
        <h4 className="friend-card-name">{user.name}</h4>
        <p className="friend-card-email">{user.email}</p>
        <span
          style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: "0.7rem", fontWeight: 600,
            color: isOnline ? "#10b981" : "var(--color-text-muted)",
            marginTop: 3,
          }}
        >
          <span
            style={{
              width: 6, height: 6, borderRadius: "50%",
              background: isOnline ? "#10b981" : "#555", flexShrink: 0,
            }}
          />
          {label}
        </span>
      </div>
      <div className="friend-card-actions-row" style={{ gap: 6 }}>
        {onViewProfile && (
          <button
            className="friend-btn friend-btn-ghost"
            onClick={() => onViewProfile(user)}
            title="View Profile"
          >
            <ExternalLink size={14} /> Profile
          </button>
        )}
        <button
          className="friend-btn friend-btn-primary"
          onClick={() => wrap("msg", () => onMessage(user._id))}
          disabled={loading === "msg"}
          title="Message"
        >
          <MessageSquare size={14} />
          {loading === "msg" ? "Opening…" : "Message"}
        </button>
        <button
          className="friend-btn friend-btn-danger"
          onClick={() => wrap("unf", () => onUnfriend(user._id))}
          disabled={loading === "unf"}
          title="Unfriend"
        >
          <UserX size={14} />
          {loading === "unf" ? "…" : ""}
        </button>
      </div>
    </div>
  );
}

// ─── Discover User Card ───────────────────────────────────────────────────────
function DiscoverCard({ user, onAction }) {
  const { friendship } = user;
  const [loading, setLoading] = useState(null);

  const wrap = async (key, fn) => {
    setLoading(key);
    try { await fn(); } catch (e) { toast.error(e?.response?.data?.message || "Error."); }
    finally { setLoading(null); }
  };

  const renderCTA = () => {
    if (!friendship)
      return (
        <button className="friend-btn friend-btn-primary" onClick={() => wrap("send", () => onAction("send", user))} disabled={loading === "send"}>
          <UserPlus size={14} /> {loading === "send" ? "Sending…" : "Add Friend"}
        </button>
      );
    if (friendship.status === "accepted")
      return <span className="friend-btn friend-btn-ghost" style={{ cursor: "default" }}><UserCheck size={14} /> Friends</span>;
    if (friendship.status === "pending" && friendship.iAmRequester)
      return (
        <button className="friend-btn friend-btn-muted" onClick={() => wrap("cancel", () => onAction("cancel", user))} disabled={loading === "cancel"}>
          <X size={14} /> {loading === "cancel" ? "Cancelling…" : "Requested"}
        </button>
      );
    if (friendship.status === "pending" && !friendship.iAmRequester)
      return (
        <div style={{ display: "flex", gap: 6 }}>
          <button className="friend-btn friend-btn-primary" onClick={() => wrap("accept", () => onAction("accept", user))} disabled={!!loading}>
            <Check size={14} /> Accept
          </button>
          <button className="friend-btn friend-btn-danger" onClick={() => wrap("reject", () => onAction("reject", user))} disabled={!!loading}>
            <X size={14} />
          </button>
        </div>
      );
    return null;
  };

  return (
    <div className="friend-card">
      <Avatar name={user.name} size={48} />
      <div className="friend-card-info" style={{ flex: 1, minWidth: 0 }}>
        <h4 className="friend-card-name">{user.name}</h4>
        <p className="friend-card-email">{user.email}</p>
        {user.mutualCount > 0 && (
          <span className="friend-mutual-badge">
            <Hash size={11} /> {user.mutualCount} mutual
          </span>
        )}
      </div>
      <div className="friend-card-cta">{renderCTA()}</div>
    </div>
  );
}

// ─── Request Card ─────────────────────────────────────────────────────────────
function RequestCard({ request, type, onAccept, onReject, onCancel }) {
  const [loading, setLoading] = useState(null);
  const user = type === "incoming" ? request.requester : request.recipient;

  const wrap = async (key, fn) => {
    setLoading(key);
    try { await fn(); } finally { setLoading(null); }
  };

  return (
    <div className="friend-request-card">
      <Avatar name={user?.name} size={46} />
      <div className="friend-card-info" style={{ flex: 1, minWidth: 0 }}>
        <h4 className="friend-card-name">{user?.name}</h4>
        <p className="friend-card-email">{user?.email}</p>
        <span className="friend-request-time">
          <Clock size={11} />
          {new Date(request.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </div>
      <div>
        {type === "incoming" ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button className="friend-btn friend-btn-primary" onClick={() => wrap("a", () => onAccept(request._id))} disabled={!!loading}>
              <Check size={14} /> {loading === "a" ? "…" : "Accept"}
            </button>
            <button className="friend-btn friend-btn-danger" onClick={() => wrap("r", () => onReject(request._id))} disabled={!!loading}>
              <X size={14} /> {loading === "r" ? "…" : "Decline"}
            </button>
          </div>
        ) : (
          <button className="friend-btn friend-btn-muted" onClick={() => wrap("c", () => onCancel(request._id))} disabled={!!loading}>
            <X size={14} /> {loading === "c" ? "…" : "Cancel"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
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
  const [friendsSearch, setFriendsSearch] = useState("");
  const searchTimeout = useRef(null);

  // ─── Load by tab ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    if (activeTab === "discover")  loadSuggestions();
    if (activeTab === "friends")   loadFriends(1);
    if (activeTab === "requests")  loadRequests();
  }, [activeTab]);

  const loadSuggestions = async () => {
    setIsLoading(true);
    try {
      const data = await getFriendSuggestions();
      setSuggestions((data.suggestions || []).map((s) => ({ ...s.user, mutualCount: s.mutualCount, friendship: null })));
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
      else setFriends((p) => [...p, ...mapped]);
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

  // ─── Search ──────────────────────────────────────────────────────────────────
  const handleSearch = useCallback((q) => {
    setSearchQuery(q);
    clearTimeout(searchTimeout.current);
    if (q.trim().length < 2) { setSearchResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      try {
        const data = await searchUsers(q.trim());
        setSearchResults(data.users || []);
      } catch { /* silent */ }
    }, 350);
  }, []);

  // ─── Discover actions ────────────────────────────────────────────────────────
  const handleDiscoverAction = async (action, u) => {
    try {
      const updateFriend = (fn) => {
        setSearchResults((p) => fn(p));
        setSuggestions((p) => fn(p));
      };
      if (action === "send") {
        await sendFriendRequest(u._id);
        toast.success(`Request sent to ${u.name}!`);
        updateFriend((list) => list.map((x) => x._id === u._id ? { ...x, friendship: { status: "pending", iAmRequester: true } } : x));
      } else if (action === "cancel") {
        await cancelFriendRequest(u.friendship.friendshipId);
        toast.success("Request cancelled.");
        updateFriend((list) => list.map((x) => x._id === u._id ? { ...x, friendship: null } : x));
      } else if (action === "accept") {
        await acceptFriendRequest(u.friendship.friendshipId);
        toast.success(`Now friends with ${u.name}!`);
        updateFriend((list) => list.map((x) => x._id === u._id ? { ...x, friendship: { status: "accepted" } } : x));
      } else if (action === "reject") {
        await rejectFriendRequest(u.friendship.friendshipId);
        updateFriend((list) => list.map((x) => x._id === u._id ? { ...x, friendship: null } : x));
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Action failed.");
    }
  };

  // ─── Friends tab actions ─────────────────────────────────────────────────────
  const handleOpenMessage = async (friendId) => {
    try {
      const { conversation } = await openDirectChat(friendId);
      navigate("/messages", { state: { conversationId: conversation._id } });
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not open chat.");
    }
  };

  const handleUnfriend = async (friendId) => {
    if (!window.confirm("Remove this person from your friends?")) return;
    try {
      await unfriend(friendId);
      toast.success("Removed from friends.");
      setFriends((p) => p.filter((f) => f._id !== friendId));
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to unfriend.");
    }
  };

  // ─── Request tab actions ─────────────────────────────────────────────────────
  const handleAccept = async (id) => {
    await acceptFriendRequest(id);
    toast.success("Friend request accepted!");
    setIncomingRequests((p) => p.filter((r) => r._id !== id));
  };
  const handleReject = async (id) => {
    await rejectFriendRequest(id);
    setIncomingRequests((p) => p.filter((r) => r._id !== id));
  };
  const handleCancel = async (id) => {
    await cancelFriendRequest(id);
    setSentRequests((p) => p.filter((r) => r._id !== id));
  };

  const displayUsers = searchQuery.trim().length >= 2 ? searchResults : suggestions;
  const filteredFriends = friendsSearch.trim()
    ? friends.filter((f) => f.name?.toLowerCase().includes(friendsSearch.toLowerCase()))
    : friends;

  return (
    <>
      <div className="friends-page-layout">
<<<<<<< HEAD
        {/* ── Header ── */}
        <div className="friends-page-header">
=======
      {/* Header */}
      <div className="friends-page-header">
        <div>
>>>>>>> b9e71800b737d0d4ce8a778549f9a596a4164c5c
          <span className="friends-eyebrow">Social Hub</span>
          <h1 className="friends-title">Friends</h1>
          <p className="friends-subtitle">Connect with coders, share solutions, and compete together.</p>
        </div>

        {/* ── Stats Row ── */}
        <div className="friends-stats-row">
          <div className="friends-stat-chip">
            <Users size={15} />
            <span><strong>{friendsTotal}</strong> Friends</span>
          </div>
          <div className="friends-stat-chip">
            <UserPlus size={15} />
            <span><strong>{incomingRequests.length}</strong> Pending</span>
          </div>
        </div>

        {/* ── Tabs ── */}
        <nav className="friends-tabs">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`friends-tab ${activeTab === id ? "active" : ""}`}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={15} />
              {label}
              {id === "requests" && incomingRequests.length > 0 && (
                <span className="friends-tab-badge">{incomingRequests.length}</span>
              )}
            </button>
          ))}
        </nav>

        {/* ── Tab Content ── */}
        <div className="friends-content">

          {/* Discover Tab */}
          {activeTab === "discover" && (
            <div className="friends-discover">
              <div className="friends-search-bar">
                <Search size={17} className="friends-search-icon" />
                <input
                  type="search"
                  className="friends-search-input"
                  placeholder="Search users by name…"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(""); setSearchResults([]); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: 4 }}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {searchQuery.trim().length >= 2 && (
                <div className="friends-section">
                  <h3 className="friends-section-title">
                    Search Results
                    <span className="friends-count">{searchResults.length} user{searchResults.length !== 1 ? "s" : ""}</span>
                  </h3>
                  {searchResults.length === 0 ? (
                    <div className="friends-empty">
                      <Search size={36} />
                      <h3>No users found</h3>
                      <p>Try a different name or check spelling.</p>
                    </div>
                  ) : (
                    <div className="friends-grid">
                      {searchResults.map((u) => (
                        <DiscoverCard key={u._id} user={u} onAction={handleDiscoverAction} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!searchQuery && (
                <div className="friends-section">
                  <div className="friends-section-header">
                    <h3 className="friends-section-title">
                      <Sparkles size={16} />
                      People You May Know
                    </h3>
                    <button className="friends-refresh-btn" onClick={loadSuggestions} title="Refresh">
                      <RefreshCw size={14} />
                    </button>
                  </div>
                  {isLoading ? (
                    <div className="friends-loading">Finding suggestions…</div>
                  ) : suggestions.length === 0 ? (
                    <div className="friends-empty">
                      <Sparkles size={40} />
                      <h3>No suggestions yet</h3>
                      <p>Search for users above to connect with coders.</p>
                    </div>
                  ) : (
                    <div className="friends-grid">
                      {suggestions.map((u) => (
                        <DiscoverCard key={u._id} user={u} onAction={handleDiscoverAction} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* My Friends Tab */}
          {activeTab === "friends" && (
            <div>
              {/* Friends search */}
              <div className="friends-search-bar" style={{ marginBottom: 20 }}>
                <Search size={16} className="friends-search-icon" />
                <input
                  className="friends-search-input"
                  placeholder="Search your friends…"
                  value={friendsSearch}
                  onChange={(e) => setFriendsSearch(e.target.value)}
                />
                {friendsSearch && (
                  <button
                    onClick={() => setFriendsSearch("")}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: 4 }}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <div className="friends-section">
                <h3 className="friends-section-title">
                  <Users size={16} />
                  My Friends
                  <span className="friends-count">{friendsTotal} total</span>
                </h3>
                {isLoading && filteredFriends.length === 0 ? (
                  <div className="friends-loading">Loading friends…</div>
                ) : filteredFriends.length === 0 ? (
                  <div className="friends-empty">
                    {friendsSearch ? (
                      <>
                        <Search size={36} />
                        <h3>No friends match "{friendsSearch}"</h3>
                      </>
                    ) : (
                      <>
                        <UserPlus size={40} />
                        <h3>No friends yet</h3>
                        <p>Go to Discover to find and connect with coders.</p>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="friends-grid">
                      {filteredFriends.map((u) => (
                        <FriendCard
                          key={u._id}
                          user={u}
                          onMessage={handleOpenMessage}
                          onViewProfile={setProfileFriend}
                          onUnfriend={handleUnfriend}
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
                          {isLoading ? "Loading…" : "Load More"}
                          <ChevronRight size={15} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Requests Tab */}
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
                  <div className="friend-request-list">
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
              <div className="friends-section" style={{ marginTop: 32 }}>
                <h3 className="friends-section-title">
                  <Shield size={15} />
                  Sent Requests
                  <span className="friends-count">{sentRequests.length}</span>
                </h3>
                {sentRequests.length === 0 ? (
                  <div className="friends-empty-small">No pending outgoing requests.</div>
                ) : (
                  <div className="friend-request-list">
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

<<<<<<< HEAD
      {/* ── Friend Profile Modal ── */}
      {profileFriend && (
        <FriendProfileModal
          friend={profileFriend}
          onClose={() => setProfileFriend(null)}
          onMessage={(convId) => {
            setProfileFriend(null);
            navigate("/messages", { state: { conversationId: convId } });
          }}
          onUnfriend={(friendId) => {
            setFriends((p) => p.filter((f) => f._id !== friendId));
            setProfileFriend(null);
          }}
        />
      )}
    </>
  );
=======
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
  </>);
>>>>>>> b9e71800b737d0d4ce8a778549f9a596a4164c5c
}

export default FriendsPage;
