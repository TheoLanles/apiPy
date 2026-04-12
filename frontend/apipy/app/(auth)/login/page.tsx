"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const health = await api.getHealth();
        if (health.setup_needed) router.push("/setup");
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
      <div
        style={{ background: "#F5F0E8" }}
        className="flex flex-col items-center justify-center min-h-screen animate-in fade-in duration-700"
      >
        <div className="flex flex-col items-center gap-6">
          {/* Pulsing Logo Container */}
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-emerald-800/10 animate-ping duration-[2000ms]" />
            <div
              className="relative w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl"
              style={{ background: "#FFFFFF", border: "1px solid #D6E8DC" }}
            >
              <img src="/logo.svg" alt="apiPy" className="w-12 h-12" />
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <span style={{ fontWeight: 800, fontSize: 24, letterSpacing: 2, color: "#0D5C45" }}>
              apiPy
            </span>
            <div className="flex items-center gap-2 text-emerald-800/60 text-sm font-medium">
              <Loader2 className="h-3 w-3 animate-spin" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-center min-h-screen px-4"
      style={{ background: "#F5F0E8" }}
    >
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span style={{ fontFamily: "sans-serif", fontWeight: 800, fontSize: 26, letterSpacing: 2, color: "#0D5C45" }}>
              apiPy
            </span>
          </div>
          <p style={{ color: "#4A7C65", fontSize: 13, marginTop: 4 }}>
            Sign in to your account
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-7"
          style={{
            background: "#FFFFFF",
            border: "1px solid #D6E8DC",
          }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {error && (
              <div
                className="rounded-lg px-3 py-2 text-sm"
                style={{ background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5" }}
              >
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label style={{ fontSize: 12, fontWeight: 600, color: "#4A7C65", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Username
              </label>
              <input
                type="text"
                placeholder="your-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition"
                style={{
                  background: "#F5F0E8",
                  border: "1px solid #C8DDD0",
                  color: "#0D5C45",
                  fontSize: 14,
                }}
                onFocus={(e) => (e.target.style.borderColor = "#00C853")}
                onBlur={(e) => (e.target.style.borderColor = "#C8DDD0")}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label style={{ fontSize: 12, fontWeight: 600, color: "#4A7C65", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition"
                style={{
                  background: "#F5F0E8",
                  border: "1px solid #C8DDD0",
                  color: "#0D5C45",
                  fontSize: 14,
                }}
                onFocus={(e) => (e.target.style.borderColor = "#00C853")}
                onBlur={(e) => (e.target.style.borderColor = "#C8DDD0")}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition"
              style={{
                background: "#0D5C45",
                color: "#F5F0E8",
                marginTop: 4,
                opacity: isSubmitting ? 0.7 : 1,
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>

          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm mt-5" style={{ color: "#4A7C65" }}>
          First time here?{" "}
          <button
            type="button"
            onClick={() => router.push("/setup")}
            style={{ color: "#0D5C45", fontWeight: 700, textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}
          >
            Create an account
          </button>
        </p>

      </div>
    </div>
  );
}