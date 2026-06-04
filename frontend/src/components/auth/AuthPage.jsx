import { useEffect, useState } from "react";
import SignInForm from "./SignInForm";
import SignUpForm from "./SignUpForm";
import { loadSession, signIn, signOut, signUp } from "../../services/authService";
import "./AuthPage.css";

const initialForm = {
  name: "",
  email: "",
  password: "",
};

function AuthPage() {
  const [mode, setMode] = useState("sign-in");
  const [form, setForm] = useState(initialForm);
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const clearSession = (nextMessage) => {
    setUser(null);
    setAccessToken("");
    setForm(initialForm);
    setMode("sign-in");
    setMessage(nextMessage || "");
  };

  const syncSession = async (isActive = true) => {
    try {
      const data = await loadSession();

      if (!isActive) {
        return;
      }

      setUser(data.user);
    } catch (requestError) {
      if (!isActive) {
        return;
      }

      clearSession(requestError.response?.data?.message || "Session expired. Please sign in again.");
    }
  };

  useEffect(() => {
    let isActive = true;

    syncSession(isActive);

    const sessionTimer = window.setInterval(() => {
      if (isActive) {
        syncSession(isActive);
      }
    }, 60000);

    return () => {
      isActive = false;
      window.clearInterval(sessionTimer);
    };
  }, []);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const resetStatus = () => {
    setError("");
    setMessage("");
  };

  const handleSignIn = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    resetStatus();

    try {
      const data = await signIn({
        email: form.email,
        password: form.password,
      });

      setUser(data.user);
      setAccessToken(data.accessToken || "");
      setMessage(data.message || "Signed in.");
      setForm(initialForm);
    } catch (requestError) {
      clearSession();
      setError(requestError.response?.data?.message || "Sign in failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    resetStatus();

    try {
      const data = await signUp({
        name: form.name,
        email: form.email,
        password: form.password,
      });

      setUser(data.user);
      setAccessToken(data.accessToken || "");
      setMessage(data.message || "Account created.");
      setForm(initialForm);
      setMode("sign-in");
    } catch (requestError) {
      clearSession();
      setError(requestError.response?.data?.message || "Sign up failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    resetStatus();

    try {
      await signOut();
    } finally {
      clearSession("Signed out.");
    }
  };

  const activeForm =
    mode === "sign-in" ? (
      <SignInForm
        form={form}
        onChange={updateField}
        onSubmit={handleSignIn}
        isLoading={isLoading}
        error={error}
        onSwitchToSignUp={() => {
          setMode("sign-up");
          resetStatus();
        }}
      />
    ) : (
      <SignUpForm
        form={form}
        onChange={updateField}
        onSubmit={handleSignUp}
        isLoading={isLoading}
        error={error}
        onSwitchToSignIn={() => {
          setMode("sign-in");
          resetStatus();
        }}
      />
    );

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-header">
          <p className="eyebrow">Account access</p>
          <h1>{mode === "sign-in" ? "Sign in" : "Sign up"}</h1>
        </div>

        {activeForm}

        {message && <p className="status success">{message}</p>}

        {user && (
          <div className="session-card">
            <div>
              <span className="session-label">Signed in as</span>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>

            <button type="button" className="secondary-button" onClick={handleLogout}>
              Log out
            </button>
          </div>
        )}

        {accessToken && <p className="token-note">Access token is kept in memory.</p>}
      </section>
    </main>
  );
}

export default AuthPage;