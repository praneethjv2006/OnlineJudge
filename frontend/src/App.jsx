import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useNavigate,
  useLocation,
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
import { loadSession, signOut } from "./services/authService";
import ToastContainer from "./components/common/Toast";

function AppShell({ user, onSignOut }) {
  const location = useLocation();
  const isContestRoom = (location.pathname.startsWith("/contests/") && !location.pathname.endsWith("/create")) ||
                       location.pathname.startsWith("/problems/");

  return (
    <div className="app-shell">
      {!isContestRoom && <NavBar user={user} onSignOut={onSignOut} />}
      <main className={isContestRoom ? "" : "app-main"}>
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

function AppRoutes() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    // Optimistic loading: try to get user from localStorage immediately
    const cachedUser = window.localStorage.getItem("user");
    try {
      return cachedUser ? JSON.parse(cachedUser) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const cachedUser = window.localStorage.getItem("user");
    if (!cachedUser) {
      return;
    }

    let isMounted = true;

    const bootstrapSession = async () => {
      try {
        const data = await loadSession();

        if (isMounted) {
          setUser(data.user);
        }
      } catch {
        if (isMounted) {
          setUser(null);
          window.localStorage.removeItem("user");
          window.localStorage.removeItem("accessToken");
        }
      }
    };

    bootstrapSession();

    return () => {
      isMounted = false;
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
      <Route
        path="/auth"
        element={user ? <Navigate to="/home" replace /> : <AuthPage onAuthenticated={handleAuthenticated} />}
      />
      <Route element={<AppShell user={user} onSignOut={handleSignOut} />}>
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/problems" element={<ProblemsPage />} />
        <Route path="/problems/:problemId" element={<ProblemSolvingPage />} />
        
        {/* Protected Routes */}
        <Route element={user ? <Outlet /> : <Navigate to="/auth" replace />}>
          <Route path="/contests" element={<ContestsPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/contests/create" element={<CreateContestPage />} />
          <Route path="/contests/:contestId" element={<ContestRoomPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;