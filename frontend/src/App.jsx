import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useNavigate,
  useLocation,
  useOutletContext,
} from "react-router-dom";
import PropTypes from "prop-types";

import AuthPage from "./components/auth/AuthPage";
import NavBar from "./components/layout/NavBar";
import CreateContestPage from "./pages/CreateContestPage";
import ContestsPage from "./pages/ContestsPage";
import ProblemsPage from "./pages/ProblemsPage";
import ProblemSolvingPage from "./pages/ProblemSolvingPage";
import ContestRoomPage from "./pages/ContestRoomPage";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import ShadowCodePage from "./pages/ShadowCodePage";
import ShadowDojoPage from "./pages/ShadowDojoPage";
import { loadSession, signOut } from "./services/authService";
import ToastContainer from "./components/common/Toast";

// ─── Shared outlet context hook (use this in all child pages) ────────────────
// Returns { user } — user may be null if not authenticated.
export function useAppContext() {
  return useOutletContext() ?? { user: null };
}

// ─── Auth guard that forwards outlet context from AppShell ───────────────────
// Using <Outlet context={...}> ensures useOutletContext() works in all nested pages.
function ProtectedRoute({ user }) {
  const ctx = useOutletContext();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Forward the parent context so pages inside still receive { user }
  return <Outlet context={ctx} />;
}

ProtectedRoute.propTypes = {
  user: PropTypes.shape({
    email: PropTypes.string,
    name: PropTypes.string,
  }),
};

// ─── App shell: NavBar + Outlet with shared context ─────────────────────────
function AppShell({ user, onSignOut }) {
  const location = useLocation();

  const isFullScreen =
    (location.pathname.startsWith("/contests/") &&
      !location.pathname.endsWith("/create")) ||
    location.pathname.startsWith("/problems/") ||
    location.pathname === "/shadow-code/dojo";

  return (
    <div className="app-shell">
      {!isFullScreen && <NavBar user={user} onSignOut={onSignOut} />}
      <main className={isFullScreen ? "" : "app-main"}>
        {/* All child routes consume { user } via useAppContext() */}
        <Outlet context={{ user }} />
      </main>
    </div>
  );
}

AppShell.propTypes = {
  user: PropTypes.shape({
    email: PropTypes.string,
    name: PropTypes.string,
  }),
  onSignOut: PropTypes.func.isRequired,
};

// ─── Route definitions ───────────────────────────────────────────────────────
function AppRoutes() {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    try {
      const cached = window.localStorage.getItem("user");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  // Validate the cached session against the server on mount
  useEffect(() => {
    if (!window.localStorage.getItem("user")) return;

    let active = true;

    (async () => {
      try {
        const { user: validated } = await loadSession();
        if (active) setUser(validated);
      } catch {
        if (active) {
          setUser(null);
          window.localStorage.removeItem("user");
          window.localStorage.removeItem("accessToken");
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const handleAuthenticated = (sessionUser) => {
    setUser(sessionUser);
    navigate("/home", { replace: true });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      setUser(null);
      navigate("/auth", { replace: true });
    }
  };

  return (
    <Routes>
      {/* Public auth route */}
      <Route
        path="/auth"
        element={
          user ? (
            <Navigate to="/home" replace />
          ) : (
            <AuthPage onAuthenticated={handleAuthenticated} />
          )
        }
      />

      {/* Shell wrapping all app pages — provides { user } context */}
      <Route element={<AppShell user={user} onSignOut={handleSignOut} />}>
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/problems" element={<ProblemsPage />} />
        <Route path="/problems/:problemId" element={<ProblemSolvingPage />} />
        <Route path="/shadow-code" element={<ShadowCodePage />} />
        <Route path="/shadow-code/dojo" element={<ShadowDojoPage />} />

        {/* Auth-guarded routes — context is forwarded through ProtectedRoute */}
        <Route element={<ProtectedRoute user={user} />}>
          <Route path="/contests" element={<ContestsPage />} />
          <Route path="/contests/create" element={<CreateContestPage />} />
          <Route path="/contests/:contestId" element={<ContestRoomPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────
function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;