import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import PropTypes from "prop-types";
import AuthPage from "./components/auth/AuthPage";
import NavBar from "./components/layout/NavBar";
import CreateContestPage from "./pages/CreateContestPage";
import ContestsPage from "./pages/ContestsPage";
import HomePage from "./pages/HomePage";
import { loadSession, signOut } from "./services/authService";

function AppShell({ user, onSignOut }) {
  return (
    <div className="app-shell">
      <NavBar user={user} onSignOut={onSignOut} />
      <main className="app-main">
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
  const [user, setUser] = useState(null);
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
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
        }
      } finally {
        if (isMounted) {
          setIsBooting(false);
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

  if (isBooting) {
    return (
      <div className="boot-screen">
        <div className="boot-card">
          <span className="eyebrow">Loading session</span>
          <h1>Preparing your judge workspace</h1>
          <p>Restoring your secure session and syncing the current contest data.</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/auth"
        element={user ? <Navigate to="/home" replace /> : <AuthPage onAuthenticated={handleAuthenticated} />}
      />
      <Route element={user ? <AppShell user={user} onSignOut={handleSignOut} /> : <Navigate to="/auth" replace />}>
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/contests" element={<ContestsPage />} />
        <Route path="/contests/create" element={<CreateContestPage />} />
      </Route>
      <Route path="*" element={<Navigate to={user ? "/home" : "/auth"} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;