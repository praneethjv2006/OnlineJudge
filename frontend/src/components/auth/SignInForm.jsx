function SignInForm({ form, onChange, onSubmit, isLoading, error, onSwitchToSignUp }) {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <label>
        Email
        <input
          type="email"
          value={form.email}
          onChange={onChange("email")}
          autoComplete="email"
          placeholder="ada@example.com"
        />
      </label>

      <label>
        Password
        <input
          type="password"
          value={form.password}
          onChange={onChange("password")}
          autoComplete="current-password"
          placeholder="Enter your password"
        />
      </label>

      {error && <p className="status error">{error}</p>}

      <button type="submit" className="primary-button" disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign in"}
      </button>

      <button type="button" className="link-button" onClick={onSwitchToSignUp}>
        Create an account
      </button>
    </form>
  );
}

export default SignInForm;