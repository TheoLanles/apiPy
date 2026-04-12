"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { LayoutDashboard, ScrollText, Users, Settings, LogOut } from "lucide-react";

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await api.logout();
      logout();
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/scripts", label: "Scripts", icon: ScrollText },
    ...(user?.role === "admin" ? [{ href: "/users", label: "Users", icon: Users }] : []),
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div
      className="w-60 min-h-screen flex flex-col"
      style={{ background: "#0D5C45", borderRight: "1px solid #0a4a37" }}
    >
      {/* Logo */}
      <div className="px-5 py-6 flex flex-col items-center gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <img src="/logo.svg" alt="apiPy Logo" className="w-12 h-12" />
        <div className="text-center">
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: 2, color: "#F5F0E8" }}>apiPy</span>
          <p style={{ fontSize: 10, color: "rgba(245,240,232,0.4)", marginTop: 2, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Script Manager
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition"
              style={{
                background: active ? "rgba(245,240,232,0.12)" : "transparent",
                color: active ? "#F5F0E8" : "rgba(245,240,232,0.55)",
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                textDecoration: "none",
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(245,240,232,0.07)"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="px-3 pb-5" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 16 }}>
        <div
          className="rounded-xl px-3 py-3 mb-3"
          style={{ background: "rgba(245,240,232,0.08)" }}
        >
          <p style={{ fontSize: 13, fontWeight: 600, color: "#F5F0E8" }}>{user?.username}</p>
          <p style={{ fontSize: 11, color: "rgba(245,240,232,0.45)", marginTop: 2, textTransform: "capitalize" }}>
            {user?.role}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl transition"
          style={{
            background: "transparent",
            border: "1px solid rgba(245,240,232,0.15)",
            color: "rgba(245,240,232,0.6)",
            fontSize: 13,
            cursor: "pointer",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(220,38,38,0.15)";
            e.currentTarget.style.borderColor = "rgba(220,38,38,0.4)";
            e.currentTarget.style.color = "#FCA5A5";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "rgba(245,240,232,0.15)";
            e.currentTarget.style.color = "rgba(245,240,232,0.6)";
          }}
        >
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </div>
  );
}