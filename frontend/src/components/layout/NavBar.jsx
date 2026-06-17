import { useEffect, useRef, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import PropTypes from "prop-types";
import { 
  Home, 
  Trophy, 
  Activity, 
  LogOut, 
  ChevronDown,
  Terminal,
  Code
} from "lucide-react";

function NavBar({ user, onSignOut }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleSignOut = () => {
    setIsMenuOpen(false);
    onSignOut();
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
          <NavLink to="/home" className={({ isActive }) => (isActive ? "nav-item active" : "nav-item") }>
            <Home size={18} />
            <span>Home</span>
          </NavLink>
          <NavLink to="/problems" className={({ isActive }) => (isActive ? "nav-item active" : "nav-item") }>
            <Code size={18} />
            <span>Problems</span>
          </NavLink>
          <NavLink to="/contests" className={({ isActive }) => (isActive ? "nav-item active" : "nav-item") }>
            <Trophy size={18} />
            <span>Contests</span>
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "nav-item active" : "nav-item") }>
            <Activity size={18} />
            <span>Dashboard</span>
          </NavLink>
        </nav>

        <div className="nav-profile-section" ref={menuRef}>
          {user ? (
            <>
              <button
                type="button"
                className={`profile-trigger ${isMenuOpen ? 'active' : ''}`}
                onClick={() => setIsMenuOpen((current) => !current)}
              >
                <div className="user-avatar">
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="user-info-mini">
                  <span className="user-name-short">{user?.name?.split(' ')[0] || "User"}</span>
                  <ChevronDown size={14} className={`chevron ${isMenuOpen ? 'rotated' : ''}`} />
                </div>
              </button>

              {isMenuOpen && (
                <div className="profile-dropdown-menu">
                  <div className="dropdown-header">
                    <div className="header-avatar">
                       {user?.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div className="header-meta">
                      <span className="full-name">{user?.name || "User"}</span>
                      <span className="user-email">{user?.email || "active session"}</span>
                    </div>
                  </div>
                  
                  <div className="dropdown-divider"></div>
                  
                  <button type="button" className="dropdown-item danger" onClick={handleSignOut}>
                    <LogOut size={16} />
                    <span>Sign Out</span>
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