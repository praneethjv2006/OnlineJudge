import { useState } from "react";
import PropTypes from "prop-types";
import LottieComponent from "lottie-react";
const Lottie = LottieComponent?.default || LottieComponent;
import animationData from "../../assets/animations/gif5.json";
import { signIn, signUp } from "../../services/authService";
import { getErrorMessage } from "../../services/api";

const initialForm = {
  name: "",
  email: "",
  password: "",
};

function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState("sign-in");
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const resetFeedback = () => {
    setError("");
    setMessage("");
  };

  const resetForm = () => {
    setForm(initialForm);
    setMode("sign-in");
  };

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSignIn = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    resetFeedback();

    if (!form.email.trim() || !form.password) {
      setError("Please enter your email and password.");
      setIsLoading(false);
      return;
    }

    try {
      const data = await signIn({
        email: form.email,
        password: form.password,
      });

      onAuthenticated?.(data.user);
      setMessage(data.message || "Signed in.");
      resetForm();
    } catch (requestError) {
      resetForm();
      setError(getErrorMessage(requestError, "Sign in failed. Please check your credentials."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    resetFeedback();

    if (!form.name.trim()) {
      setError("Please enter your full name.");
      setIsLoading(false);
      return;
    }
    if (form.name.trim().length < 2) {
      setError("Name must be at least 2 characters long.");
      setIsLoading(false);
      return;
    }
    if (!form.email.trim()) {
      setError("Please enter your email address.");
      setIsLoading(false);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setIsLoading(false);
      return;
    }

    try {
      const data = await signUp({
        name: form.name,
        email: form.email,
        password: form.password,
      });

      onAuthenticated?.(data.user);
      setMessage(data.message || "Account created.");
      resetForm();
    } catch (requestError) {
      resetForm();
      setError(getErrorMessage(requestError, "Account creation failed. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-grid">
        <div 
          className="auth-copy panel panel-accent" 
          style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            padding: 0, 
            overflow: "hidden",
            background: "transparent",
            border: "none"
          }}
        >
          <Lottie 
            animationData={animationData} 
            loop={true} 
            style={{ width: "100%", height: "100%" }} 
          />
        </div>

        <section className="panel auth-panel">
          <div key={mode} className="auth-surface">
            <header className="auth-header">
              <span className="eyebrow">Account access</span>
              <h2>{mode === "sign-in" ? "Welcome back" : "Create your account"}</h2>
              <p>
                {mode === "sign-in"
                  ? "Sign in to access the dashboard, manage contests, and track your active sessions."
                  : "Create an organizer account to publish and manage coding contests."}
              </p>
            </header>

            <form className="auth-form" onSubmit={mode === "sign-in" ? handleSignIn : handleSignUp}>
              {mode === "sign-up" && (
                <label>
                  Full name
                  <input
                    value={form.name}
                    onChange={updateField("name")}
                    autoComplete="name"
                    placeholder="Ada Lovelace"
                  />
                </label>
              )}

              <label>
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={updateField("email")}
                  autoComplete="email"
                  placeholder="ada@example.com"
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  value={form.password}
                  onChange={updateField("password")}
                  autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                  placeholder={mode === "sign-in" ? "Enter your password" : "Create a secure password"}
                />
              </label>

              {error && <p className="status status-error">{error}</p>}
              {message && <p className="status status-success">{message}</p>}

              <button type="submit" className="primary-button" disabled={isLoading}>
                {isLoading
                  ? mode === "sign-in"
                    ? "Signing in..."
                    : "Creating account..."
                  : mode === "sign-in"
                    ? "Sign in"
                    : "Create account"}
              </button>
            </form>

            <p className="auth-switch">
              {mode === "sign-in" ? "Need an account?" : "Already have an account?"}
              <button
                type="button"
                className="auth-link"
                onClick={() => {
                  setMode(mode === "sign-in" ? "sign-up" : "sign-in");
                  resetFeedback();
                }}
              >
                {mode === "sign-in" ? "Create one" : "Sign in"}
              </button>
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}

AuthPage.propTypes = {
  onAuthenticated: PropTypes.func,
};

export default AuthPage;