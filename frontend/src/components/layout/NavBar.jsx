import { useEffect, useRef, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import {
  Home,
  Trophy,
  Activity,
  LogOut,
  ChevronDown,
  Terminal,
  Code,
  Swords,
  Users,
  MessageSquare,
  LayoutDashboard,
} from "lucide-react";
import { getRequestCount } from "../../services/friendService";
import FriendsPanel from "../social/FriendsPanel";

function NavBar({ user, onSignOut }) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFriendsPanelOpen, setIsFriendsPanelOpen] = useState(false);
  const [requestCount, setRequestCount] = useState(0);
  const menuRef = useRef(null);
  const friendsBtnRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        setIsFriendsPanelOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Poll for friend request count when logged in
  useEffect(() => {
    if (!user) { setRequestCount(0); return; }
    const fetchCount = async () => {
      const count = await getRequestCount();
      setRequestCount(count);
    };
    fetchCount();
    pollRef.current = setInterval(fetchCount, 30_000); // every 30s
    return () => clearInterval(pollRef.current);
  }, [user]);

  const handleSignOut = () => {
    setIsMenuOpen(false);
    onSignOut();
  };

  const navTo = (path) => {
    setIsMenuOpen(false);
    navigate(path);
  };

  return (
    <header className="main-nav-wrapper">
      <div className="main-nav-container">
        <Link to="/home" className="nav-brand">
          <div className="brand-icon">
            <Terminal size={20} strokeWidth={2.5} />
          </div>
          <div className="brand-text">
            <strong>Apex<span>Judge</span></strong>
          </div>
        </Link>

        <nav className="nav-links">
          <NavLink to="/home" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <Home size={18} /><span>Home</span>
          </NavLink>
          <NavLink to="/problems" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <Code size={18} /><span>Problems</span>
          </NavLink>
          <NavLink to="/contests" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <Trophy size={18} /><span>Contests</span>
          </NavLink>
          <NavLink to="/shadow-code" className={({ isActive }) => isActive ? "nav-item nav-item-shadow active" : "nav-item nav-item-shadow"}>
            <Swords size={18} /><span>Shadow Code</span>
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <Activity size={18} /><span>Dashboard</span>
          </NavLink>
        </nav>

        <div className="nav-right-section">
          {/* ── Friends Icon Button ── */}
          {user && (
            <div className="nav-friends-wrapper">
              <button
                ref={friendsBtnRef}
                type="button"
                className={`nav-friends-btn ${isFriendsPanelOpen ? "active" : ""}`}
                onClick={() => setIsFriendsPanelOpen((c) => !c)}
                title="Friends"
                aria-label="Friends"
              >
                <Users size={20} />
                {requestCount > 0 && (
                  <span className="nav-badge nav-badge-friends">
                    {requestCount > 9 ? "9+" : requestCount}
                  </span>
                )}
              </button>

              {isFriendsPanelOpen && (
                <FriendsPanel onClose={() => setIsFriendsPanelOpen(false)} />
              )}
            </div>
          )}

          {/* ── Profile Section ── */}
          <div className="nav-profile-section" ref={menuRef}>
            {user ? (
              <>
                <button
                  type="button"
                  className={`profile-trigger ${isMenuOpen ? "active" : ""}`}
                  onClick={() => setIsMenuOpen((c) => !c)}
                >
                  <div className="user-avatar">
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="user-info-mini">
                    <span className="user-name-short">{user?.name?.split(" ")[0] || "User"}</span>
                    <ChevronDown size={14} className={`chevron ${isMenuOpen ? "rotated" : ""}`} />
                  </div>
                </button>

                {isMenuOpen && (
                  <div className="profile-dropdown-menu">
                    {/* Header */}
                    <div className="dropdown-header">
                      <div className="header-avatar">{user?.name?.[0]?.toUpperCase() || "U"}</div>
                      <div className="header-meta">
                        <span className="full-name">{user?.name || "User"}</span>
                        <span className="user-email">{user?.email || "active session"}</span>
                      </div>
                    </div>
                    <div className="dropdown-divider" />

                    {/* Navigation Items */}
                    <div className="dropdown-section-label">Navigate</div>
                    <button type="button" className="dropdown-item" onClick={() => navTo("/dashboard")}>
                      <LayoutDashboard size={16} /><span>Dashboard</span>
                    </button>
                    <button type="button" className="dropdown-item" onClick={() => navTo("/friends")}>
                      <Users size={16} />
                      <span>Friends</span>
                      {requestCount > 0 && (
                        <span className="dropdown-badge">{requestCount > 9 ? "9+" : requestCount}</span>
                      )}
                    </button>
                    <button type="button" className="dropdown-item" onClick={() => navTo("/messages")}>
                      <MessageSquare size={16} /><span>Messages</span>
                    </button>
                    <button type="button" className="dropdown-item" onClick={() => navTo("/contests")}>
                      <Trophy size={16} /><span>Contests</span>
                    </button>
                    <button type="button" className="dropdown-item" onClick={() => navTo("/shadow-code")}>
                      <Swords size={16} /><span>Shadow Code</span>
                    </button>

                    <div className="dropdown-divider" />

                    {/* Sign Out */}
                    <button type="button" className="dropdown-item danger" onClick={handleSignOut}>
                      <LogOut size={16} /><span>Sign Out</span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link to="/auth" className="primary-action" style={{ padding: "8px 24px", minHeight: "40px", fontSize: "0.9rem" }}>
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

NavBar.propTypes = {
  user: PropTypes.shape({
    email: PropTypes.string,
    name: PropTypes.string,
  }),
  onSignOut: PropTypes.func.isRequired,
};

export default NavBar;