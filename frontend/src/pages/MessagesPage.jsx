import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Send, X, Hash, Users, MessageSquare, Plus, Clock, Code2,
  ChevronDown, AlertCircle, Trash2, Search, Smile, CornerUpLeft,
  Info, LogOut, ChevronRight
} from "lucide-react";
import { useAppContext } from "../App";
import { toast } from "../components/common/Toast";
import {
  getConversations, getMessages, sendMessage, deleteMessage, createGroupChat,
  toggleReaction, leaveGroup,
} from "../services/chatService";
import { getMyFriends } from "../services/friendService";

// ─── Quick emoji set ──────────────────────────────────────────────────────────
const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🎉", "👏"];

const EMOJI_GRID = [
  ["😀","😂","😍","🤔","😎","😢","😡","🥳","🤩","😴"],
  ["👍","👎","❤️","🔥","🎉","✅","❌","⭐","💯","🚀"],
  ["🙏","👋","💪","🤝","✌️","👏","🤜","🤛","🫶","💫"],
  ["😮","😱","🤯","🥺","😅","😬","🙃","🤗","🫠","😇"],
  ["👀","💭","💬","🗣️","📢","🔔","📌","🏆","🎯","💡"],
  ["🐱","🐶","🦊","🐼","🦁","🐸","🦋","🌸","🌈","⚡"],
];

// ─── 48-hour countdown hook ───────────────────────────────────────────────────
function useCountdown(expiresAt) {
  const [remaining, setRemaining] = useState(() => {
    const diff = new Date(expiresAt) - Date.now();
    return Math.max(0, diff);
  });
  useEffect(() => {
    if (remaining <= 0) return;
    const interval = setInterval(() => {
      const diff = new Date(expiresAt) - Date.now();
      setRemaining(Math.max(0, diff));
    }, 60_000);
    return () => clearInterval(interval);
  }, [expiresAt]);
  if (remaining <= 0) return "Expired";
  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

// ─── Date separator helper ────────────────────────────────────────────────────
function formatDateSeparator(date) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({ message, isMe, onDelete, onReply, onReact, currentUserId }) {
  const countdown = useCountdown(message.expiresAt);
  const isAlmostExpired = new Date(message.expiresAt) - Date.now() < 3 * 3_600_000;
  const isExpiringSoon = new Date(message.expiresAt) - Date.now() < 1 * 3_600_000;
  const [showReactPicker, setShowReactPicker] = useState(false);

  // Build reactions display from Map or Object
  const reactionsMap = useMemo(() => {
    if (!message.reactions) return {};
    if (message.reactions instanceof Map) {
      const obj = {};
      for (const [k, v] of message.reactions.entries()) obj[k] = v;
      return obj;
    }
    return message.reactions;
  }, [message.reactions]);

  const myReaction = useMemo(() => {
    for (const [emoji, users] of Object.entries(reactionsMap)) {
      if (users.includes(String(currentUserId))) return emoji;
    }
    return null;
  }, [reactionsMap, currentUserId]);

  return (
    <div className={`msg-bubble-wrapper ${isMe ? "msg-mine" : "msg-theirs"}`}>
      {!isMe && (
        <div className="msg-avatar" title={message.sender?.name}>
          {message.sender?.name?.[0]?.toUpperCase() || "?"}
        </div>
      )}
      <div className="msg-bubble-col">
        {!isMe && (
          <span className="msg-sender-name">{message.sender?.name}</span>
        )}

        {/* Reply quote */}
        {message.replyTo?.messageId && (
          <div className="msg-reply-quote">
            <div className="msg-reply-bar" />
            <div className="msg-reply-content">
              <span className="msg-reply-sender">{message.replyTo.senderName}</span>
              <span className="msg-reply-preview">
                {message.replyTo.type === "code" ? "📋 Code snippet" : message.replyTo.preview}
              </span>
            </div>
          </div>
        )}

        <div className={`msg-bubble ${message.type === "code" ? "msg-bubble-code" : ""}`}>
          {message.type === "code" ? (
            <pre className="msg-code-block">
              <code>{message.content}</code>
            </pre>
          ) : (
            <p className="msg-text">{message.content}</p>
          )}
        </div>

        {/* Reactions display */}
        {Object.keys(reactionsMap).length > 0 && (
          <div className="msg-reactions-row">
            {Object.entries(reactionsMap).map(([emoji, users]) => (
              users.length > 0 && (
                <button
                  key={emoji}
                  className={`msg-reaction-chip ${users.includes(String(currentUserId)) ? "msg-reaction-mine" : ""}`}
                  onClick={() => onReact(message._id, emoji)}
                  title={`${users.length} reaction${users.length !== 1 ? "s" : ""}`}
                >
                  {emoji} {users.length > 1 ? <span>{users.length}</span> : null}
                </button>
              )
            ))}
          </div>
        )}

        <div className="msg-meta">
          <span className="msg-time">
            {new Date(message.createdAt).toLocaleTimeString("en-US", {
              hour: "2-digit", minute: "2-digit", hour12: false
            })}
          </span>
          <span
            className={`msg-ttl ${isExpiringSoon ? "msg-ttl-urgent" : isAlmostExpired ? "msg-ttl-warn" : ""}`}
            title="This message expires automatically"
          >
            <Clock size={10} />
            {countdown}
          </span>
        </div>

        {/* Hover actions */}
        <div className={`msg-hover-actions ${isMe ? "msg-hover-mine" : "msg-hover-theirs"}`}>
          <button
            className="msg-action-btn"
            title="Reply"
            onClick={() => onReply(message)}
          >
            <CornerUpLeft size={13} />
          </button>

          {/* Quick reactions */}
          <div className="msg-quick-react-wrapper">
            <button
              className={`msg-action-btn ${myReaction ? "msg-action-reacted" : ""}`}
              title="React"
              onClick={() => setShowReactPicker((c) => !c)}
            >
              <Smile size={13} />
            </button>
            {showReactPicker && (
              <div className={`msg-quick-react-strip ${isMe ? "strip-left" : "strip-right"}`}>
                {QUICK_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    className="msg-quick-react-btn"
                    onClick={() => {
                      onReact(message._id, emoji);
                      setShowReactPicker(false);
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {isMe && (
            <button className="msg-action-btn msg-action-delete" onClick={() => onDelete(message._id)} title="Delete">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Conversation List Item ───────────────────────────────────────────────────
function ConvItem({ conv, isActive, onClick, currentUserId, unread }) {
  const other = conv.type === "direct"
    ? conv.participants?.find((p) => p._id !== currentUserId && p._id?.toString() !== currentUserId)
    : null;
  const displayName = conv.type === "group" ? conv.groupName : other?.name || "Unknown";
  const initial = displayName?.[0]?.toUpperCase() || "?";
  const preview = conv.lastMessage?.content || "No messages yet";
  const previewDate = conv.lastMessage?.at
    ? new Date(conv.lastMessage.at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "";

  return (
    <button
      className={`conv-item ${isActive ? "conv-item-active" : ""}`}
      onClick={onClick}
    >
      <div className="conv-avatar">
        {conv.type === "group" ? <Users size={18} /> : initial}
      </div>
      <div className="conv-item-body">
        <div className="conv-item-top">
          <span className="conv-item-name">{displayName}</span>
          <span className="conv-item-date">{previewDate}</span>
        </div>
        <p className="conv-item-preview">{preview.slice(0, 60)}{preview.length > 60 ? "…" : ""}</p>
      </div>
      {unread > 0 && (
        <span className="conv-unread-badge">{unread > 9 ? "9+" : unread}</span>
      )}
    </button>
  );
}

// ─── Create Group Modal ───────────────────────────────────────────────────────
function CreateGroupModal({ friends, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const toggle = (id) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleCreate = async () => {
    if (!name.trim()) { toast.error("Group name required."); return; }
    if (selected.length < 1) { toast.error("Select at least 1 friend."); return; }
    setLoading(true);
    try {
      await onCreate(name.trim(), selected);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create group.");
    } finally { setLoading(false); }
  };

  const filteredFriends = friends.filter((f) =>
    f.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="msg-modal" onClick={(e) => e.stopPropagation()}>
        <div className="msg-modal-header">
          <h3>Create Group Chat</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <input
          className="msg-modal-input"
          placeholder="Group name…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <div className="msg-modal-search">
          <Search size={14} />
          <input
            className="msg-modal-search-input"
            placeholder="Search friends…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {selected.length > 0 && (
          <div className="msg-selected-chips">
            {selected.map((id) => {
              const f = friends.find((x) => x._id === id);
              return (
                <div key={id} className="msg-friend-chip selected">
                  <span>{f?.name?.[0]?.toUpperCase()}</span>
                  {f?.name}
                  <X size={12} onClick={() => toggle(id)} />
                </div>
              );
            })}
          </div>
        )}
        <div className="msg-modal-friends">
          {filteredFriends.map((f) => (
            <button
              key={f._id}
              className={`msg-friend-chip ${selected.includes(f._id) ? "selected" : ""}`}
              onClick={() => toggle(f._id)}
            >
              <span>{f.name?.[0]?.toUpperCase()}</span>
              {f.name}
              {selected.includes(f._id) && <X size={12} />}
            </button>
          ))}
        </div>
        <button className="friend-btn friend-btn-primary" style={{ width: "100%" }} onClick={handleCreate} disabled={loading}>
          {loading ? "Creating…" : `Create Group${selected.length > 0 ? ` (${selected.length + 1} members)` : ""}`}
        </button>
      </div>
    </div>
  );
}

// ─── Emoji Picker ─────────────────────────────────────────────────────────────
function EmojiPicker({ onSelect, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    setTimeout(() => document.addEventListener("pointerdown", handler), 50);
    return () => document.removeEventListener("pointerdown", handler);
  }, [onClose]);

  return (
    <div className="emoji-picker" ref={ref}>
      <div className="emoji-picker-grid">
        {EMOJI_GRID.map((row, ri) =>
          row.map((emoji, ci) => (
            <button
              key={`${ri}-${ci}`}
              className="emoji-picker-btn"
              onClick={() => onSelect(emoji)}
            >
              {emoji}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Group Info Panel ─────────────────────────────────────────────────────────
function GroupInfoPanel({ conv, currentUserId, onLeave, onClose }) {
  const [leaving, setLeaving] = useState(false);

  const handleLeave = async () => {
    if (!window.confirm("Leave this group?")) return;
    setLeaving(true);
    try {
      await leaveGroup(conv._id);
      toast.success("You left the group.");
      onLeave(conv._id);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to leave group.");
    } finally { setLeaving(false); }
  };

  return (
    <div className="group-info-panel">
      <div className="group-info-header">
        <h3 className="group-info-title">{conv.groupName}</h3>
        <button className="group-info-close" onClick={onClose}><X size={16} /></button>
      </div>
      <p className="group-info-subtitle">{conv.participants?.length} members</p>
      <div className="group-info-members">
        {conv.participants?.map((p) => {
          const isAdmin = conv.groupAdmin?.toString() === p._id?.toString() ||
                          conv.groupAdmin?._id?.toString() === p._id?.toString();
          const isYou = p._id?.toString() === String(currentUserId);
          return (
            <div key={p._id} className="group-member-row">
              <div className="group-member-avatar">
                {p.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="group-member-info">
                <span className="group-member-name">
                  {p.name}{isYou ? " (you)" : ""}
                </span>
                <span className="group-member-email">{p.email}</span>
              </div>
              {isAdmin && <span className="group-admin-badge">Admin</span>}
            </div>
          );
        })}
      </div>
      <div className="group-info-actions">
        <button
          className="friend-btn friend-btn-danger"
          style={{ width: "100%" }}
          onClick={handleLeave}
          disabled={leaving}
        >
          <LogOut size={15} />
          {leaving ? "Leaving…" : "Leave Group"}
        </button>
      </div>
    </div>
  );
}

// ─── Date Separator ────────────────────────────────────────────────────────────
function DateSeparator({ date }) {
  return (
    <div className="msg-date-separator">
      <div className="msg-date-line" />
      <span className="msg-date-label">{formatDateSeparator(date)}</span>
      <div className="msg-date-line" />
    </div>
  );
}

// ─── Reply Bar ─────────────────────────────────────────────────────────────────
function ReplyBar({ replyTo, onCancel }) {
  return (
    <div className="msg-reply-bar-container">
      <div className="msg-reply-bar-accent" />
      <div className="msg-reply-bar-content">
        <CornerUpLeft size={14} className="msg-reply-icon" />
        <div>
          <span className="msg-reply-to-name">{replyTo.sender?.name || "Unknown"}</span>
          <p className="msg-reply-to-preview">
            {replyTo.type === "code" ? "📋 Code snippet" : replyTo.content?.slice(0, 80)}
          </p>
        </div>
      </div>
      <button className="msg-reply-cancel" onClick={onCancel}><X size={14} /></button>
    </div>
  );
}

// ─── Main Messages Page ───────────────────────────────────────────────────────
function MessagesPage() {
  const { user } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(location.state?.conversationId || null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [inputType, setInputType] = useState("text");
  const [codeLanguage, setCodeLanguage] = useState("cpp");
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [friends, setFriends] = useState([]);
  const [msgPage, setMsgPage] = useState(1);
  const [msgHasMore, setMsgHasMore] = useState(false);
  const [convSearch, setConvSearch] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyTo, setReplyTo] = useState(null); // message being replied to
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);
  const inputRef = useRef(null);
  const prevMessagesRef = useRef([]);

  const currentUserId = user?.id || user?._id;

  const activeConv = useMemo(
    () => conversations.find((c) => c._id === activeConvId),
    [conversations, activeConvId]
  );

  // Load conversations list
  useEffect(() => {
    if (!user) return;
    loadConversations();
    loadFriends();
  }, [user]);

  // Set active conversation from navigation state
  useEffect(() => {
    if (location.state?.conversationId) {
      setActiveConvId(location.state.conversationId);
    }
  }, [location.state]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConvId) return;
    loadMessages(activeConvId, 1);
    startPolling(activeConvId);
    // Mark as read
    setUnreadCounts((prev) => ({ ...prev, [activeConvId]: 0 }));
    return () => stopPolling();
  }, [activeConvId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const data = await getConversations();
      setConversations(data.conversations || []);
    } catch { /* silent */ }
  };

  const loadFriends = async () => {
    try {
      const data = await getMyFriends(1, 50);
      setFriends((data.friends || []).map((f) => f.user));
    } catch { /* silent */ }
  };

  const loadMessages = async (convId, page = 1) => {
    setIsLoadingMsgs(true);
    try {
      const data = await getMessages(convId, page, 50);
      if (page === 1) setMessages(data.messages || []);
      else setMessages((prev) => [...(data.messages || []), ...prev]);
      setMsgPage(page);
      setMsgHasMore(data.hasMore || false);
    } catch { /* silent */ }
    setIsLoadingMsgs(false);
  };

  // 5-second polling for new messages
  const startPolling = useCallback((convId) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const data = await getMessages(convId, 1, 50);
        const newMsgs = data.messages || [];
        setMessages((prev) => {
          // Track unread (messages newer than previous last message that are not from me)
          if (convId !== activeConvId && prev.length > 0) {
            const lastPrev = prev[prev.length - 1];
            const newer = newMsgs.filter(
              (m) => m.createdAt > lastPrev?.createdAt && String(m.sender?._id || m.sender) !== String(currentUserId)
            );
            if (newer.length > 0) {
              setUnreadCounts((u) => ({ ...u, [convId]: (u[convId] || 0) + newer.length }));
            }
          }
          return newMsgs;
        });
      } catch { /* silent */ }
    }, 5000);
  }, [activeConvId, currentUserId]);

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
  };

  const handleSelectConv = (convId) => {
    setActiveConvId(convId);
    setMessages([]);
    setMsgPage(1);
    setReplyTo(null);
    setShowGroupInfo(false);
    setUnreadCounts((prev) => ({ ...prev, [convId]: 0 }));
  };

  const handleSend = async () => {
    if (!inputText.trim() || !activeConvId || isSending) return;
    setIsSending(true);
    try {
      const replyToPayload = replyTo
        ? { messageId: replyTo._id }
        : null;
      const { message } = await sendMessage(
        activeConvId,
        inputText.trim(),
        inputType,
        inputType === "code" ? codeLanguage : null,
        replyToPayload
      );
      setMessages((prev) => [...prev, message]);
      setInputText("");
      setReplyTo(null);
      setConversations((prev) =>
        prev.map((c) =>
          c._id === activeConvId
            ? { ...c, lastMessage: { content: inputText.trim(), at: new Date(), sender: { _id: currentUserId } } }
            : c
        )
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send message.");
    }
    setIsSending(false);
  };

  const handleDeleteMessage = async (msgId) => {
    try {
      await deleteMessage(activeConvId, msgId);
      setMessages((prev) => prev.filter((m) => m._id !== msgId));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete message.");
    }
  };

  const handleReact = async (msgId, emoji) => {
    try {
      const { reactions } = await toggleReaction(activeConvId, msgId, emoji);
      setMessages((prev) =>
        prev.map((m) => m._id === msgId ? { ...m, reactions } : m)
      );
    } catch (err) {
      toast.error("Failed to react.");
    }
  };

  const handleReply = (message) => {
    setReplyTo(message);
    inputRef.current?.focus();
  };

  const handleCreateGroup = async (name, participantIds) => {
    const { conversation } = await createGroupChat(name, participantIds);
    setConversations((prev) => [conversation, ...prev]);
    setActiveConvId(conversation._id);
    toast.success(`Group "${name}" created!`);
  };

  const handleLeaveGroup = (convId) => {
    setConversations((prev) => prev.filter((c) => c._id !== convId));
    setActiveConvId(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && inputType === "text") {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji) => {
    setInputText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const convDisplayName = (conv) => {
    if (!conv) return "";
    if (conv.type === "group") return conv.groupName;
    const other = conv.participants?.find(
      (p) => String(p._id) !== String(currentUserId)
    );
    return other?.name || "Unknown";
  };

  // Inject date separators into messages
  const messagesWithSeparators = useMemo(() => {
    const result = [];
    let lastDate = null;
    for (const msg of messages) {
      const dateStr = new Date(msg.createdAt).toDateString();
      if (dateStr !== lastDate) {
        result.push({ type: "separator", date: msg.createdAt, key: `sep-${dateStr}` });
        lastDate = dateStr;
      }
      result.push({ type: "message", data: msg, key: msg._id });
    }
    return result;
  }, [messages]);

  // Filter conversations by search
  const filteredConversations = useMemo(() => {
    if (!convSearch.trim()) return conversations;
    const q = convSearch.toLowerCase();
    return conversations.filter((conv) => {
      const name = convDisplayName(conv);
      return name.toLowerCase().includes(q);
    });
  }, [conversations, convSearch, currentUserId]);

  return (
    <div className="messages-layout">
      {/* ── Left Sidebar: Conversation List ── */}
      <aside className="conv-sidebar">
        <div className="conv-sidebar-header">
          <h2 className="conv-sidebar-title">
            <MessageSquare size={20} />
            Messages
          </h2>
          <button
            className="conv-new-group-btn"
            onClick={() => setShowGroupModal(true)}
            title="Create group chat"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Conversation search */}
        <div className="conv-search-bar">
          <Search size={14} className="conv-search-icon" />
          <input
            className="conv-search-input"
            placeholder="Search conversations…"
            value={convSearch}
            onChange={(e) => setConvSearch(e.target.value)}
          />
        </div>

        <div className="conv-sidebar-hint">
          <AlertCircle size={13} />
          Messages expire in 48 hours
        </div>

        <div className="conv-list">
          {filteredConversations.length === 0 ? (
            <div className="conv-empty">
              <MessageSquare size={32} />
              {convSearch ? (
                <p>No conversations found.</p>
              ) : (
                <>
                  <p>No conversations yet.</p>
                  <p>Go to <button onClick={() => navigate("/friends")} className="conv-link">Friends</button> to start chatting.</p>
                </>
              )}
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <ConvItem
                key={conv._id}
                conv={conv}
                isActive={conv._id === activeConvId}
                onClick={() => handleSelectConv(conv._id)}
                currentUserId={currentUserId}
                unread={unreadCounts[conv._id] || 0}
              />
            ))
          )}
        </div>
      </aside>

      {/* ── Right: Message Thread ── */}
      <main className="msg-thread-area">
        {!activeConvId ? (
          <div className="msg-empty-state">
            <MessageSquare size={60} />
            <h3>Select a conversation</h3>
            <p>Choose a chat from the left, or start messaging a friend.</p>
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <div className="msg-thread-header">
              <div className="msg-thread-identity">
                <div className="msg-thread-avatar">
                  {activeConv?.type === "group"
                    ? <Users size={20} />
                    : convDisplayName(activeConv)?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <button
                    className={`msg-thread-name-btn ${activeConv?.type === "group" ? "msg-thread-name-clickable" : ""}`}
                    onClick={() => activeConv?.type === "group" && setShowGroupInfo((c) => !c)}
                    style={{ background: "none", border: "none", cursor: activeConv?.type === "group" ? "pointer" : "default", padding: 0 }}
                  >
                    <h3 className="msg-thread-name">{convDisplayName(activeConv)}</h3>
                  </button>
                  {activeConv?.type === "group" && (
                    <p className="msg-thread-sub">
                      {activeConv?.participants?.length} members
                      <button
                        className="msg-group-info-btn"
                        onClick={() => setShowGroupInfo((c) => !c)}
                        title="Group info"
                      >
                        <Info size={13} />
                      </button>
                    </p>
                  )}
                </div>
              </div>
              <div className="msg-thread-ttl-hint">
                <Clock size={14} />
                Auto-delete in 48h
              </div>
            </div>

            <div className="msg-thread-body">
              {/* Messages Scroll */}
              <div className="msg-thread-scroll">
                {msgHasMore && (
                  <div className="msg-load-more">
                    <button
                      className="friend-btn friend-btn-ghost"
                      onClick={() => loadMessages(activeConvId, msgPage + 1)}
                      disabled={isLoadingMsgs}
                    >
                      <ChevronDown size={16} />
                      Load older messages
                    </button>
                  </div>
                )}
                {isLoadingMsgs && messages.length === 0 ? (
                  <div className="msg-loading">Loading messages…</div>
                ) : messages.length === 0 ? (
                  <div className="msg-thread-no-msgs">
                    <MessageSquare size={40} />
                    <p>No messages yet. Say hello! 👋</p>
                  </div>
                ) : (
                  messagesWithSeparators.map((item) =>
                    item.type === "separator" ? (
                      <DateSeparator key={item.key} date={item.date} />
                    ) : (
                      <MessageBubble
                        key={item.key}
                        message={item.data}
                        isMe={String(item.data.sender?._id || item.data.sender) === String(currentUserId)}
                        onDelete={handleDeleteMessage}
                        onReply={handleReply}
                        onReact={handleReact}
                        currentUserId={currentUserId}
                      />
                    )
                  )
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="msg-input-area">
                {/* Reply bar */}
                {replyTo && (
                  <ReplyBar replyTo={replyTo} onCancel={() => setReplyTo(null)} />
                )}

                <div className="msg-input-toolbar">
                  <button
                    className={`msg-type-btn ${inputType === "text" ? "active" : ""}`}
                    onClick={() => setInputType("text")}
                    title="Text message"
                  >
                    <Hash size={15} /> Text
                  </button>
                  <button
                    className={`msg-type-btn ${inputType === "code" ? "active" : ""}`}
                    onClick={() => setInputType("code")}
                    title="Code snippet"
                  >
                    <Code2 size={15} /> Code
                  </button>
                  {inputType === "code" && (
                    <select
                      className="msg-lang-select"
                      value={codeLanguage}
                      onChange={(e) => setCodeLanguage(e.target.value)}
                    >
                      <option value="cpp">C++</option>
                      <option value="c">C</option>
                      <option value="python">Python</option>
                      <option value="javascript">JavaScript</option>
                      <option value="java">Java</option>
                    </select>
                  )}
                </div>

                <div className="msg-input-row">
                  {/* Emoji picker button */}
                  {inputType === "text" && (
                    <div className="msg-emoji-wrapper">
                      <button
                        className="msg-emoji-btn"
                        onClick={() => setShowEmojiPicker((c) => !c)}
                        title="Insert emoji"
                        type="button"
                      >
                        <Smile size={18} />
                      </button>
                      {showEmojiPicker && (
                        <EmojiPicker
                          onSelect={handleEmojiSelect}
                          onClose={() => setShowEmojiPicker(false)}
                        />
                      )}
                    </div>
                  )}

                  <textarea
                    ref={inputRef}
                    className={`msg-textarea ${inputType === "code" ? "msg-textarea-code" : ""}`}
                    placeholder={inputType === "code" ? "Paste your code snippet…" : "Type a message…"}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={inputType === "text" ? handleKeyDown : undefined}
                    rows={inputType === "code" ? 4 : 2}
                  />
                  <button
                    className="msg-send-btn"
                    onClick={handleSend}
                    disabled={!inputText.trim() || isSending}
                    title="Send (Enter)"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Group Info Panel (slide-in) */}
            {showGroupInfo && activeConv?.type === "group" && (
              <GroupInfoPanel
                conv={activeConv}
                currentUserId={currentUserId}
                onLeave={handleLeaveGroup}
                onClose={() => setShowGroupInfo(false)}
              />
            )}
          </>
        )}
      </main>

      {/* Group creation modal */}
      {showGroupModal && (
        <CreateGroupModal
          friends={friends}
          onClose={() => setShowGroupModal(false)}
          onCreate={handleCreateGroup}
        />
      )}
    </div>
  );
}

export default MessagesPage;
