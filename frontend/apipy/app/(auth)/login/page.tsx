"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { IconLoader2, IconGlobe } from "@tabler/icons-react";
import { useSearchParams } from "next/navigation";

function LoginContent() {
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [oidcEnabled, setOidcEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const health = await api.getHealth();
        if (health.setup_needed) {
          router.push("/setup");
          return;
        }

        setOidcEnabled(health.oidc_enabled);

        const errorParam = searchParams.get("error");
        if (errorParam) {
          setError(`OIDC Error: ${errorParam.replace(/_/g, " ")}`);
        }

        setIsLoading(false);
      } catch {
        setIsLoading(false);
      }
    };
    checkStatus();
  }, [router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const response = await api.login(username, password);
      setUser({
        id: response.id,
        username: response.username,
        email: response.email,
        role: response.role as "admin" | "user",
      });
      setToken(response.token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid credentials");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="page page-center">
        <div className="container container-slim py-4">
          <div className="text-center py-5">
            <div className="mb-3">
              <span className="fs-1 fw-bold tracking-tighter text-primary">
                <span className="text-accent me-1">api</span>PY
              </span>
            </div>
            <div className="text-secondary small">Establishing secure session...</div>
            <div className="progress progress-sm mt-3 mx-auto" style={{ maxWidth: '150px' }}>
              <div className="progress-bar progress-bar-indeterminate bg-primary"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-center">
      <div className="container container-tight py-4">
        <div className="text-center mb-5">
          <span className="fs-1 fw-bold tracking-tighter text-primary">
            <span className="text-accent me-1">api</span>PY
          </span>
          <div className="text-secondary mt-1">Python Script Automation Platform</div>
        </div>

        <div className="card card-md card-premium shadow-sm">
          <div className="card-body">
            <h2 className="h2 text-center mb-4">Welcome back</h2>
            <p className="text-secondary text-center mb-4">Log in to manage your scripts</p>

            {error && (
              <div className="alert alert-danger mb-4" role="alert">
                <div className="d-flex">
                  <div>{error}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} autoComplete="off">
              <div className="mb-3">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="your-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <div className="input-group input-group-flat">
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Password"
                    autoComplete="off"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-footer">
                <button
                  type="submit"
                  className={`btn btn-primary w-100 ${isSubmitting ? 'disabled' : ''}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting && <IconLoader2 className="me-2 animate-spin" size={16} />}
                  Sign in
                </button>
              </div>
            </form>

            {oidcEnabled && (
              <>
                <div className="hr-text">or continue with</div>
                <div className="card-btn-payload">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => window.location.href = `${api.getBaseUrl()}/auth/oidc/login`}
                    className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
                  >
                    <IconGlobe size={18} />
                    OpenID Connect
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="text-center text-secondary mt-3">
          First time here? <a href="/setup" className="link-primary fw-bold" tabIndex={-1}>Create an account</a>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="page page-center">
        <div className="container container-slim py-4 text-center">
          <span className="fs-2 fw-bold tracking-tighter text-primary animate-pulse">
            <span className="text-accent me-1">api</span>PY
          </span>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}