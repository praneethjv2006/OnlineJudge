function SignUpForm({ form, onChange, onSubmit, isLoading, error, onSwitchToSignIn }) {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <label>
        Name
        <input
          value={form.name}
          onChange={onChange("name")}
          autoComplete="name"
          placeholder="Ada Lovelace"
        />
      </label>

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
          autoComplete="new-password"
          placeholder="Create a password"
        />
      </label>

      {error && <p className="status error">{error}</p>}

      <button type="submit" className="primary-button" disabled={isLoading}>
        {isLoading ? "Creating account..." : "Sign up"}
      </button>

      <button type="button" className="link-button" onClick={onSwitchToSignIn}>
        I already have an account
      </button>
    </form>
  );
}

export default SignUpForm;