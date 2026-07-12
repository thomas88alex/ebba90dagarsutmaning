import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("ebba@example.com");
  const [password, setPassword] = useState("challenge90");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const result = loginUser({ email, password, rememberMe });

    if (!result.success) {
      setError(result.message);
      return;
    }

    navigate("/dashboard", { replace: true });
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="logo-area" aria-hidden="true">
          <div className="logo-circle">90</div>
          <span>LifeOS</span>
        </div>
        <h1>Welcome back, Ebba</h1>
        <p className="auth-subtext">
          Keep your promises to yourself. Every check-in moves you forward.
        </p>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="field-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="field-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <label className="checkbox-row" htmlFor="remember-me">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            Remember me
          </label>

          {error ? (
            <p className="form-error" role="alert" aria-live="polite">
              {error}
            </p>
          ) : (
            <div className="form-error-placeholder" aria-hidden="true" />
          )}

          <button type="submit" className="primary-button">
            Log in
          </button>
        </form>

        <p className="auth-hint">Use ebba@example.com / challenge90 for this mock login.</p>
      </div>
    </div>
  );
}
