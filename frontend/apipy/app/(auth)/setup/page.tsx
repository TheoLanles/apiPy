"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { IconLoader2, IconCheck, IconX } from "@tabler/icons-react";

export default function SetupPage() {
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const health = await api.getHealth();
        if (!health.setup_needed) router.push("/login");
        else setIsLoading(false);
      } catch {
        setIsLoading(false);
      }
    };
    checkSetup();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setIsSubmitting(true);
    try {
      const response = await api.setup(username, email, password);
      setUser({ id: response.id, username: response.username, email: response.email, role: response.role as "admin" | "user" });
      setToken(response.token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Setup failed");
      setIsSubmitting(false);
    }
  };

  const passwordMatch = password && confirmPassword ? password === confirmPassword : null;

  if (isLoading) return (
    <div className="page page-center">
      <div className="container container-slim py-4">
        <div className="text-center py-5">
          <div className="mb-3">
            <span className="fs-1 fw-bold tracking-tighter text-primary">
              <span className="text-accent me-1">api</span>PY
            </span>
          </div>
          <div className="text-secondary small">Initializing setup environment...</div>
          <div className="progress progress-sm mt-3 mx-auto" style={{ maxWidth: '150px' }}>
            <div className="progress-bar progress-bar-indeterminate bg-primary"></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page page-center">
      <div className="container container-tight py-4">
        <div className="text-center mb-5">
          <span className="fs-1 fw-bold tracking-tighter text-primary">
            <span className="text-accent me-1">api</span>PY
          </span>
          <div className="text-secondary mt-1">Initial System Configuration</div>
        </div>
        <form className="card card-md card-premium shadow-sm" onSubmit={handleSubmit}>
          <div className="card-body">
            <h2 className="h2 text-center mb-4">Create admin account</h2>
            <p className="text-secondary text-center mb-4">Set up your credentials to get started</p>
            
            {error && (
              <div className="alert alert-danger mb-3">
                {error}
              </div>
            )}

            <div className="mb-3">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Email address</label>
              <input
                type="email"
                className="form-control"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">
                Password
                <span className="form-label-description">Min. 6 characters</span>
              </label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">
                Confirm Password
                {passwordMatch !== null && (
                  <span className={`form-label-description text-${passwordMatch ? 'success' : 'danger'}`}>
                    {passwordMatch ? <IconCheck size={14} className="me-1" /> : <IconX size={14} className="me-1" />}
                    {passwordMatch ? "Match" : "No match"}
                  </span>
                )}
              </label>
              <input
                type="password"
                className={`form-control ${passwordMatch === false ? 'is-invalid' : ''}`}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-footer">
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={isSubmitting || passwordMatch === false}
              >
                {isSubmitting ? <IconLoader2 size={16} className="me-2 animate-spin" /> : null}
                {isSubmitting ? "Creating account..." : "Setup Admin Account"}
              </button>
            </div>
          </div>
        </form>
        <div className="text-center text-secondary mt-3">
          Already have an account? <button type="button" onClick={() => router.push("/login")} className="btn btn-link btn-sm p-0 mb-1">Sign in</button>
        </div>
      </div>
    </div>
  );
}