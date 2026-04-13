"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { LayoutDashboard, ScrollText, Users, Settings, LogOut, ChevronLeft, ChevronRight } from "lucide-react";

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("sidebar_expanded");
    if (saved !== null) {
      setIsExpanded(saved === "true");
    }
    setIsLoaded(true);
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("sidebar_expanded", String(isExpanded));
    }
  }, [isExpanded, isLoaded]);

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
      className="h-screen flex flex-col transition-all duration-300 ease-in-out relative shrink-0"
      style={{
        width: isExpanded ? 240 : 80,
        background: "#0D5C45",
        borderRight: "1px solid #0a4a37"
      }}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -right-4 top-10 w-8 h-8 rounded-full flex items-center justify-center transition shadow-lg z-50 border"
        style={{ 
          background: "#F5F0E8", 
          borderColor: "#C8DDD0",
          color: "#0D5C45" 
        }}
      >
        {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* Logo */}
      <div 
        className="px-5 py-6 flex flex-col items-center gap-3 transition-all duration-300" 
        style={{ 
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          minHeight: 110
        }}
      >
        <img src="/logo.svg" alt="apiPy Logo" className="w-10 h-10" />
        {isExpanded && (
          <div className="text-center animate-in fade-in duration-500">
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: 2, color: "#F5F0E8" }}>apiPy</span>
            <p style={{ fontSize: 10, color: "rgba(245,240,232,0.4)", marginTop: 2, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Script Manager
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-hidden">
        {links.map(({ href, label, icon: Icon }) => {
          // Handle trailing slashes for active state
          const normalizedPath = pathname.endsWith('/') ? pathname : `${pathname}/`;
          const normalizedHref = href.endsWith('/') ? href : `${href}/`;
          const active = href === "/dashboard" ? normalizedPath === normalizedHref : pathname.startsWith(href);
          
          return (
            <Link
              key={href}
              href={href}
              title={!isExpanded ? label : ""}
              className={`flex items-center ${isExpanded ? "gap-3 px-3" : "justify-center"} py-2.5 rounded-xl transition-all duration-200`}
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
              <Icon size={isExpanded ? 16 : 20} strokeWidth={active ? 2.2 : 1.8} />
              {isExpanded && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div
        className={`px-3 pb-5 transition-all duration-300 ${!isExpanded ? "flex flex-col items-center" : ""}`}
        style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 16 }}
      >
        {isExpanded ? (
          <div
            className="rounded-xl px-3 py-3 mb-3 animate-in fade-in duration-300"
            style={{ background: "rgba(245,240,232,0.08)" }}
          >
            <p className="truncate" style={{ fontSize: 13, fontWeight: 600, color: "#F5F0E8" }}>{user?.username}</p>
            <p style={{ fontSize: 11, color: "rgba(245,240,232,0.45)", marginTop: 2, textTransform: "capitalize" }}>
              {user?.role}
            </p>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(245,240,232,0.08)", color: "#F5F0E8", fontSize: 10, fontWeight: 700 }}>
            {user?.username?.substring(0, 2).toUpperCase()}
          </div>
        )}

        <button
          onClick={handleLogout}
          title={!isExpanded ? "Logout" : ""}
          className={`flex items-center ${isExpanded ? "gap-2 px-3 w-full" : "justify-center w-10 h-10"} py-2.5 rounded-xl transition`}
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
          <LogOut size={isExpanded ? 14 : 18} />
          {isExpanded && "Logout"}
        </button>
      </div>
    </div>
  );
}