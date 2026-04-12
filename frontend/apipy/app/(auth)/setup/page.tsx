"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { Loader2 } from "lucide-react";

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

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box" as const,
    background: "#F5F0E8",
    border: "1px solid #C8DDD0",
    borderRadius: 10,
    padding: "9px 12px",
    fontSize: 13,
    color: "#0D5C45",
    outline: "none",
    fontFamily: "inherit",
  };

  const labelStyle = {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    color: "#4A7C65",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    marginBottom: 6,
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "#F5F0E8" }}>
      <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#0D5C45" }} />
    </div>
  );

  return (
    <div className="flex items-center justify-center min-h-screen px-4" style={{ background: "#F5F0E8" }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
              <rect x="2" y="8" width="18" height="5" rx="1" transform="rotate(-20 2 8)" fill="#00E676" />
              <rect x="8" y="16" width="18" height="5" rx="1" transform="rotate(-20 8 16)" fill="#00C853" />
            </svg>
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: 2, color: "#0D5C45" }}>ZACT</span>
          </div>
          <p style={{ fontSize: 13, color: "#4A7C65", marginTop: 4 }}>Create your admin account</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6" style={{ background: "#FFFFFF", border: "1px solid #D6E8DC" }}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {error && (
              <div className="rounded-xl px-3 py-2" style={{ background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5", fontSize: 13 }}>
                {error}
              </div>
            )}

            <div>
              <label style={labelStyle}>Username</label>
              <input
                type="text"
                placeholder="your-username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = "#00C853"}
                onBlur={e => e.target.style.borderColor = "#C8DDD0"}
              />
            </div>

            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = "#00C853"}
                onBlur={e => e.target.style.borderColor = "#C8DDD0"}
              />
            </div>

            <div>
              <label style={labelStyle}>Password <span style={{ color: "#4A7C65", textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>— min. 6 characters</span></label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = "#00C853"}
                onBlur={e => e.target.style.borderColor = "#C8DDD0"}
              />
            </div>

            <div>
              <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Confirm password</label>
                {passwordMatch !== null && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: passwordMatch ? "#166534" : "#991B1B" }}>
                    {passwordMatch ? "✓ Match" : "✗ No match"}
                  </span>
                )}
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                style={{
                  ...inputStyle,
                  borderColor: passwordMatch === false ? "#FCA5A5" : "#C8DDD0",
                }}
                onFocus={e => e.target.style.borderColor = passwordMatch === false ? "#FCA5A5" : "#00C853"}
                onBlur={e => e.target.style.borderColor = passwordMatch === false ? "#FCA5A5" : "#C8DDD0"}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || passwordMatch === false}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 transition"
              style={{
                background: "#0D5C45",
                color: "#F5F0E8",
                fontSize: 13,
                fontWeight: 600,
                border: "none",
                marginTop: 4,
                cursor: isSubmitting || passwordMatch === false ? "not-allowed" : "pointer",
                opacity: isSubmitting || passwordMatch === false ? 0.6 : 1,
              }}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? "Creating account…" : "Create admin account"}
            </button>

          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm mt-5" style={{ color: "#4A7C65" }}>
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => router.push("/login")}
            style={{ color: "#0D5C45", fontWeight: 700, textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}
          >
            Sign in
          </button>
        </p>

      </div>
    </div>
  );
}