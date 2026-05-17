import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const initialRegisterState = {
  full_name: "",
  email: "",
  password: "",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState(initialRegisterState);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (mode === "login") {
        await login(loginForm);
      } else {
        await register(registerForm);
      }
      navigate("/tickets");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="auth-copy">
          <span className="eyebrow">Cloud Computing Final Project</span>
          <h1>Mini Helpdesk Platform</h1>
          <p>
            Start with local auth, ticket workflows, and admin stats, then move the same stack to Azure
            Container Apps, PostgreSQL, Blob Storage, and Key Vault.
          </p>
        </div>

        <div className="auth-card">
          <div className="auth-toggle">
            <button
              type="button"
              className={mode === "login" ? "active" : ""}
              onClick={() => setMode("login")}
            >
              Sign In
            </button>
            <button
              type="button"
              className={mode === "register" ? "active" : ""}
              onClick={() => setMode("register")}
            >
              Create Account
            </button>
          </div>

          <form className="form-stack" onSubmit={handleSubmit}>
            {mode === "register" ? (
              <>
                <label>
                  Full Name
                  <input
                    type="text"
                    value={registerForm.full_name}
                    onChange={(event) =>
                      setRegisterForm((current) => ({ ...current, full_name: event.target.value }))
                    }
                    required
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={(event) =>
                      setRegisterForm((current) => ({ ...current, email: event.target.value }))
                    }
                    required
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    value={registerForm.password}
                    onChange={(event) =>
                      setRegisterForm((current) => ({ ...current, password: event.target.value }))
                    }
                    required
                  />
                </label>
                <p className="field-hint">
                  Public signup creates regular user accounts. Admin accounts are created separately with the backend
                  seed command, then admins can promote support agents from the dashboard.
                </p>
              </>
            ) : (
              <>
                <label>
                  Email
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
                    required
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(event) =>
                      setLoginForm((current) => ({ ...current, password: event.target.value }))
                    }
                    required
                  />
                </label>
              </>
            )}

            {error ? <p className="error-text">{error}</p> : null}

            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting
                ? "Please wait..."
                : mode === "login"
                  ? "Sign In"
                  : "Create Account and Continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
