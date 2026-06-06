import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import PropTypes from "prop-types";

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 12.75a4.25 4.25 0 1 0 0-8.5 4.25 4.25 0 0 0 0 8.5Zm0 2.25c-4.42 0-8 2.49-8 5.56V22h16v-1.44c0-3.07-3.58-5.56-8-5.56Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm0 2v.25l8 5.25 8-5.25V8H4Zm16 8V10.6l-7.45 4.9a1 1 0 0 1-1.1 0L4 10.6V16h16Z" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M10 4.5A1.5 1.5 0 0 0 8.5 3h-4A1.5 1.5 0 0 0 3 4.5v15A1.5 1.5 0 0 0 4.5 21h4A1.5 1.5 0 0 0 10 19.5v-2H8v2h-4v-15h4v2h2v-2Zm8.44 6.5-2.72-2.72 1.42-1.42L22 12l-4.86 4.86-1.42-1.42 2.72-2.72H9v-2h9.44Z" />
    </svg>
  );
}

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
    <header className="topbar">
      <div className="brand-mark">
        <span className="brand-badge">AJ</span>
        <div>
          <strong>Apex Judge</strong>
          <span>Online contest workspace</span>
        </div>
      </div>

      <nav className="topnav">
        <NavLink to="/home" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link") }>
          Home
        </NavLink>
        <NavLink to="/contests" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link") }>
          Contests
        </NavLink>
      </nav>

      <div className="topbar-meta profile-shell" ref={menuRef}>
        <button
          type="button"
          className="profile-button"
          aria-label="Open account menu"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          <span className="profile-avatar">{user?.name?.[0]?.toUpperCase() || "U"}</span>
          <ProfileIcon />
        </button>

        {isMenuOpen && (
          <div className="profile-menu panel">
            <div className="profile-menu-head">
              <span className="profile-menu-title">Signed in as</span>
              <strong>{user?.name || "User"}</strong>
              <div className="profile-menu-row">
                <MailIcon />
                <span>{user?.email || "Active session"}</span>
              </div>
            </div>

            <button type="button" className="profile-menu-action" onClick={handleSignOut}>
              <SignOutIcon />
              <span>Sign out</span>
            </button>
          </div>
        )}
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