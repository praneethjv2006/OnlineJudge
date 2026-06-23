import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, MessageSquare, UserPlus, Search, ExternalLink, X } from "lucide-react";
import PropTypes from "prop-types";
import { getMyFriends } from "../../services/friendService";
import { openDirectChat } from "../../services/chatService";
import { toast } from "../common/Toast";
import FriendProfileModal from "./FriendProfileModal";

function FriendsPanel({ onClose }) {
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileFriend, setProfileFriend] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getMyFriends(1, 30);
        setFriends((data.friends || []).map((f) => f.user));
      } catch { /* silent */ }
      setIsLoading(false);
    };
    load();
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };
    const keyHandler = (e) => { if (e.key === "Escape") onClose(); };
    // Delay to avoid immediate close from the triggering click
    const t = setTimeout(() => {
      document.addEventListener("pointerdown", handler);
      document.addEventListener("keydown", keyHandler);
    }, 50);
    return () => {
      clearTimeout(t);
      document.removeEventListener("pointerdown", handler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, [onClose]);

  const handleMessage = async (friendId) => {
    try {
      const { conversation } = await openDirectChat(friendId);
      onClose();
      navigate("/messages", { state: { conversationId: conversation._id } });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not open chat.");
    }
  };

  const filtered = friends.filter((f) =>
    f.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const colors = ["#ffa116","#8b5cf6","#06b6d4","#10b981","#f59e0b","#ef4444","#ec4899"];
  const getColor = (name) => colors[(name?.charCodeAt(0) || 0) % colors.length];

  return (
    <>
      <div className="friends-panel" ref={panelRef}>
        {/* Header */}
        <div className="fp-panel-header">
          <div className="fp-panel-title">
            <Users size={16} />
            Friends
            <span className="fp-panel-count">{friends.length}</span>
          </div>
          <button className="fp-panel-close" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        {/* Search */}
        <div className="fp-panel-search">
          <Search size={13} className="fp-panel-search-icon" />
          <input
            className="fp-panel-search-input"
            placeholder="Search friends…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>

        {/* Friend List */}
        <div className="fp-panel-list">
          {isLoading ? (
            <div className="fp-panel-empty">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="fp-panel-empty">
              {searchQuery ? `No results for "${searchQuery}"` : "No friends yet."}
            </div>
          ) : (
            filtered.map((f) => (
              <div key={f._id} className="fp-panel-friend-row">
                <div
                  className="fp-panel-avatar"
                  style={{
                    background: `${getColor(f.name)}22`,
                    color: getColor(f.name),
                    border: `1.5px solid ${getColor(f.name)}44`,
                  }}
                >
                  {f.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="fp-panel-friend-info">
                  <span className="fp-panel-friend-name">{f.name}</span>
                  <span className="fp-panel-friend-email">{f.email}</span>
                </div>
                <div className="fp-panel-friend-actions">
                  <button
                    className="fp-panel-action-btn"
                    title="Message"
                    onClick={() => handleMessage(f._id)}
                  >
                    <MessageSquare size={14} />
                  </button>
                  <button
                    className="fp-panel-action-btn"
                    title="View Profile"
                    onClick={() => setProfileFriend(f)}
                  >
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="fp-panel-footer">
          <button
            className="fp-panel-manage-btn"
            onClick={() => { onClose(); navigate("/friends"); }}
          >
            <UserPlus size={14} />
            Manage Friends
          </button>
        </div>
      </div>

      {/* Friend Profile Modal */}
      {profileFriend && (
        <FriendProfileModal
          friend={profileFriend}
          onClose={() => setProfileFriend(null)}
          onMessage={(convId) => {
            setProfileFriend(null);
            onClose();
            navigate("/messages", { state: { conversationId: convId } });
          }}
          onUnfriend={(friendId) => {
            setFriends((prev) => prev.filter((f) => f._id !== friendId));
          }}
        />
      )}
    </>
  );
}

FriendsPanel.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default FriendsPanel;
