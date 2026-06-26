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
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import Modal from "../components/common/Modal";

// ─── Quick emoji set ──────────────────────────────────────────────────────────
const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🎉", "👏"];

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
          {isMe && (
            <span
              className={`msg-status ${message.isOptimistic ? "msg-status-sending" : "msg-status-delivered"}`}
              title={message.isOptimistic ? "Sending..." : "Delivered"}
            >
              {message.isOptimistic ? "✓" : "✓✓"}
            </span>
          )}
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

// EmojiPicker component removed - replaced with emoji-mart Picker

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
  const [deleteMsgConfirmId, setDeleteMsgConfirmId] = useState(null);
  const [friends, setFriends] = useState([]);
  const [msgPage, setMsgPage] = useState(1);
  const [msgHasMore, setMsgHasMore] = useState(false);
  const [convSearch, setConvSearch] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyTo, setReplyTo] = useState(null); // message being replied to
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [msgSearchQuery, setMsgSearchQuery] = useState("");
  const [showMsgSearch, setShowMsgSearch] = useState(false);

  const [lastReadTimes, setLastReadTimes] = useState(() => {
    try {
      const stored = window.localStorage.getItem("chat_last_read_times");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);
  const inputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const prevMessagesRef = useRef([]);

  const currentUserId = user?.id || user?._id;

  const activeConv = useMemo(
    () => conversations.find((c) => c._id === activeConvId),
    [conversations, activeConvId]
  );

  const updateLastReadTime = useCallback((convId) => {
    if (!convId) return;
    setLastReadTimes((prev) => {
      const updated = { ...prev, [convId]: new Date().toISOString() };
      try {
        window.localStorage.setItem("chat_last_read_times", JSON.stringify(updated));
      } catch { /* ignore */ }
      return updated;
    });
  }, []);

  // Load conversations list and poll periodically
  useEffect(() => {
    if (!user) return;
    loadConversations();
    loadFriends();

    const interval = setInterval(loadConversations, 8000);
    return () => clearInterval(interval);
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
    updateLastReadTime(activeConvId);
    return () => stopPolling();
  }, [activeConvId, updateLastReadTime]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close emoji picker on outside click
  useEffect(() => {
    if (!showEmojiPicker) return;
    const handler = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [showEmojiPicker]);

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
        setMessages(newMsgs);
        if (newMsgs.length > 0 && convId === activeConvId) {
          updateLastReadTime(convId);
        }
      } catch { /* silent */ }
    }, 5000);
  }, [activeConvId, updateLastReadTime]);

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
  };

  const handleSelectConv = (convId) => {
    setActiveConvId(convId);
    setMessages([]);
    setMsgPage(1);
    setReplyTo(null);
    setShowGroupInfo(false);
    setMsgSearchQuery("");
    setShowMsgSearch(false);
    updateLastReadTime(convId);
  };

  const handleSend = async () => {
    const textToSend = inputText.trim();
    if (!textToSend || !activeConvId) return;

    const tempId = `optimistic-${Date.now()}`;
    const optimisticMsg = {
      _id: tempId,
      conversationId: activeConvId,
      sender: {
        _id: currentUserId,
        name: user?.name || "Me",
        email: user?.email,
      },
      content: textToSend,
      type: "text",
      language: null,
      replyTo: replyTo
        ? {
            messageId: replyTo._id,
            senderName: replyTo.sender?.name || "Unknown",
            preview: replyTo.content?.slice(0, 100) || "",
            type: replyTo.type || "text",
          }
        : null,
      reactions: {},
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      createdAt: new Date(),
      isOptimistic: true,
    };

    // Optimistically update local message thread
    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText("");
    setReplyTo(null);

    // Optimistically update lastMessage preview in conversations sidebar
    setConversations((prev) =>
      prev.map((c) =>
        c._id === activeConvId
          ? {
              ...c,
              lastMessage: {
                content: textToSend,
                at: new Date(),
                sender: { _id: currentUserId },
              },
            }
          : c
      )
    );
    updateLastReadTime(activeConvId);

    try {
      const replyToPayload = replyTo ? { messageId: replyTo._id } : null;
      const { message } = await sendMessage(
        activeConvId,
        textToSend,
        "text",
        null,
        replyToPayload
      );

      // Replace optimistic message with actual backend response
      setMessages((prev) =>
        prev.map((m) => (m._id === tempId ? message : m))
      );

      // Update conversations list with actual created date
      setConversations((prev) =>
        prev.map((c) =>
          c._id === activeConvId
            ? {
                ...c,
                lastMessage: {
                  content: textToSend,
                  at: message.createdAt,
                  sender: { _id: currentUserId },
                },
              }
            : c
        )
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send message.");
      // Remove optimistic message if sending failed
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
    }
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

  const handleEmojiSelect = (emojiChar) => {
    const textarea = inputRef.current;
    if (!textarea) {
      setInputText((prev) => prev + emojiChar);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    setInputText(before + emojiChar + after);
    setShowEmojiPicker(false);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emojiChar.length, start + emojiChar.length);
    }, 0);
  };

  const convDisplayName = (conv) => {
    if (!conv) return "";
    if (conv.type === "group") return conv.groupName;
    const other = conv.participants?.find(
      (p) => String(p._id) !== String(currentUserId)
    );
    return other?.name || "Unknown";
  };

  // Filter messages based on within-chat search
  const filteredMessages = useMemo(() => {
    if (!msgSearchQuery.trim()) return messages;
    const q = msgSearchQuery.toLowerCase();
    return messages.filter((m) => m.content?.toLowerCase().includes(q));
  }, [messages, msgSearchQuery]);

  // Inject date separators into messages
  const messagesWithSeparators = useMemo(() => {
    const result = [];
    let lastDate = null;
    for (const msg of filteredMessages) {
      const dateStr = new Date(msg.createdAt).toDateString();
      if (dateStr !== lastDate) {
        result.push({ type: "separator", date: msg.createdAt, key: `sep-${dateStr}` });
        lastDate = dateStr;
      }
      result.push({ type: "message", data: msg, key: msg._id });
    }
    return result;
  }, [filteredMessages]);

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
            filteredConversations.map((conv) => {
              const lastRead = lastReadTimes[conv._id];
              const isUnread =
                conv.lastMessage?.at &&
                String(conv.lastMessage.sender?._id || conv.lastMessage.sender) !== String(currentUserId) &&
                (!lastRead || new Date(conv.lastMessage.at) > new Date(lastRead));

              return (
                <ConvItem
                  key={conv._id}
                  conv={conv}
                  isActive={conv._id === activeConvId}
                  onClick={() => handleSelectConv(conv._id)}
                  currentUserId={currentUserId}
                  unread={isUnread ? 1 : 0}
                />
              );
            })
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
              <div className="msg-header-actions" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <button
                  className={`msg-header-action-btn ${showMsgSearch ? "active" : ""}`}
                  onClick={() => {
                    setShowMsgSearch(!showMsgSearch);
                    if (showMsgSearch) setMsgSearchQuery("");
                  }}
                  title="Search messages"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: showMsgSearch ? "var(--color-accent)" : "var(--color-text-muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "4px"
                  }}
                >
                  <Search size={18} />
                </button>

                <div className="msg-thread-ttl-hint">
                  <Clock size={14} />
                  Auto-delete in 48h
                </div>
              </div>
            </div>

            {showMsgSearch && (
              <div className="msg-thread-search-bar" style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 20px",
                background: "var(--color-surface-1)",
                borderBottom: "1px solid var(--color-border)",
              }}>
                <Search size={14} style={{ color: "var(--color-text-muted)" }} />
                <input
                  type="text"
                  className="msg-thread-search-input"
                  placeholder="Search in this conversation..."
                  value={msgSearchQuery}
                  onChange={(e) => setMsgSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    background: "none",
                    border: "none",
                    outline: "none",
                    color: "var(--color-text-primary)",
                    fontSize: "0.85rem",
                  }}
                  autoFocus
                />
                {msgSearchQuery && (
                  <button
                    onClick={() => setMsgSearchQuery("")}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}

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
                        onDelete={(msgId) => setDeleteMsgConfirmId(msgId)}
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

                <div className="msg-input-row">
                  {/* Emoji picker button */}
                  <div className="msg-emoji-wrapper" style={{ position: "relative" }}>
                    <button
                      className="msg-emoji-btn"
                      onClick={() => setShowEmojiPicker((c) => !c)}
                      title="Insert emoji"
                      type="button"
                    >
                      <Smile size={18} />
                    </button>
                    {showEmojiPicker && (
                      <div className="emoji-picker-container" ref={emojiPickerRef} style={{ position: "absolute", bottom: "50px", left: "0px", zIndex: 1000 }}>
                        <Picker
                          data={data}
                          onEmojiSelect={(emoji) => handleEmojiSelect(emoji.native)}
                          theme="dark"
                        />
                      </div>
                    )}
                  </div>

                  <textarea
                    ref={inputRef}
                    className="msg-textarea"
                    placeholder="Type a message…"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={2}
                  />
                  <button
                    className="msg-send-btn"
                    onClick={handleSend}
                    disabled={!inputText.trim()}
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

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteMsgConfirmId}
        onClose={() => setDeleteMsgConfirmId(null)}
        title="Delete Message"
        footer={
          <>
            <button
              className="modal-btn modal-btn-cancel"
              onClick={() => setDeleteMsgConfirmId(null)}
            >
              Cancel
            </button>
            <button
              className="modal-btn modal-btn-danger"
              onClick={async () => {
                if (deleteMsgConfirmId) {
                  await handleDeleteMessage(deleteMsgConfirmId);
                  setDeleteMsgConfirmId(null);
                }
              }}
            >
              Delete
            </button>
          </>
        }
      >
        <p>Are you sure you want to delete this message? This action cannot be undone.</p>
      </Modal>
    </div>
  );
}

export default MessagesPage;
