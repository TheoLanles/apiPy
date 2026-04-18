"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { useTheme } from "next-themes";
import {
  IconFileText,
  IconUsers,
  IconSettings,
  IconLogout,
  IconChevronDown,
  IconHome,
  IconPlus,
  IconSun,
  IconMoon
} from "@tabler/icons-react";
import { UserAvatar } from "@/components/UserAvatar";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Éviter les erreurs d'hydratation
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      await api.logout();
      logout();
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fermer le menu mobile lors d'un changement de route
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: "/dashboard", label: "Home", icon: IconHome },
    { href: "/scripts", label: "Scripts", icon: IconFileText },
    ...(user?.role === "admin" ? [{ href: "/users", label: "Users", icon: IconUsers }] : []),
    { href: "/settings", label: "Settings", icon: IconSettings },
  ];

  return (
    <header className="navbar navbar-expand-md d-print-none sticky-top glass-navbar">
      <div className="container-xl">
        {/* BRAND LOGO */}
        <Link href="/dashboard" aria-label="apiPy" className="navbar-brand navbar-brand-autodark me-3">
          <span className="fs-2 fw-bold tracking-tight text-primary d-flex align-items-center">
            <span className="text-accent me-1">api</span>PY
          </span>
        </Link>

        {/* HAMBURGER - mobile uniquement */}
        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-expanded={isMenuOpen}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* NAVIGATION LINKS
            ✅ FIX : on n'utilise plus Bootstrap collapse via JS.
            On gère l'affichage nous-mêmes :
            - Sur mobile  : visible uniquement si isMenuOpen === true
            - Sur desktop (md+) : toujours visible via le style inline
        */}
        <div
          className="navbar-collapse"
          id="navbar-menu"
          style={{
            display: isMenuOpen ? "flex" : undefined,
          }}
        >
          <div className="d-flex flex-column flex-md-row flex-fill align-items-stretch align-items-md-center">
            <ul className="navbar-nav">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const active = pathname.replace(/\/$/, "") === href.replace(/\/$/, "") ||
                  (href !== "/dashboard" && pathname.startsWith(href));
                return (
                  <li key={href} className={`nav-item ${active ? "active" : ""}`}>
                    <Link
                      href={href}
                      className="nav-link"
                      onClick={(e) => {
                        setIsMenuOpen(false);
                        e.currentTarget.blur();
                      }}
                    >
                      {/* ✅ FIX : d-none d-lg-inline-block retiré → icône toujours visible */}
                      <span className="nav-link-icon">
                        <Icon size={20} stroke={1.5} />
                      </span>
                      <span className="nav-link-title">{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Bouton New Script dans le menu mobile aussi */}
            <div className="d-md-none mt-2 mb-1 px-2">
              <Link
                href="/scripts/new"
                className="btn btn-primary btn-sm w-100"
                onClick={() => setIsMenuOpen(false)}
              >
                <IconPlus size={16} className="me-1" />
                New Script
              </Link>
            </div>
          </div>
        </div>

        {/* USER MENU & ACTIONS */}
        <div className="navbar-nav flex-row order-md-last ms-auto align-items-center">
          {/* Theme Toggle */}
          <div className="nav-item me-3">
            <button
              className="btn btn-ghost-secondary btn-icon btn-theme-toggle"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {mounted && (theme === "dark" ? <IconSun size={20} /> : <IconMoon size={20} />)}
            </button>
          </div>

          {/* Bouton New Script desktop */}
          <div className="nav-item d-none d-md-flex me-3">
            <Link href="/scripts/new" className="btn btn-primary btn-sm">
              <IconPlus size={16} className="me-1" />
              New Script
            </Link>
          </div>

          {/* User Dropdown */}
          <div className="nav-item dropdown" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="nav-link d-flex lh-1 text-reset p-0 bg-transparent border-0"
              aria-label="Open user menu"
            >
              <UserAvatar 
                email={user?.email} 
                username={user?.username} 
                size="sm" 
              />
              <div className="d-none d-xl-block ps-2 text-start">
                <div className="fw-bold">{user?.username}</div>
                <div className="mt-1 small text-secondary">{user?.role}</div>
              </div>
              <IconChevronDown size={14} className="ms-2 d-none d-xl-block text-secondary" />
            </button>

            <div
              className={`dropdown-menu dropdown-menu-end dropdown-menu-arrow ${isDropdownOpen ? "show" : ""}`}
              style={{ position: "absolute", top: "100%", right: 0 }}
            >
              <button
                onClick={() => {
                  handleLogout();
                  setIsDropdownOpen(false);
                }}
                className="dropdown-item text-danger w-100 text-start"
              >
                <IconLogout size={16} className="me-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}