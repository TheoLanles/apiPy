"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Script, ProcessState } from "@/types";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [states, setStates] = useState<Record<string, ProcessState>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const scriptsData = await api.getScripts();
      setScripts(scriptsData);
      const statesData: Record<string, ProcessState> = {};
      for (const script of scriptsData) {
        try {
          const state = await api.getScriptStatus(script.id);
          statesData[script.id] = state;
        } catch { }
      }
      setStates(statesData);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const runningCount = Object.values(states).filter(s => s.status === "running").length;
  const errorCount = Object.values(states).filter(s => s.status === "error" || s.status === "crashed").length;

  const statusStyle = (status: string) => {
    if (status === "running") return { background: "#DCFCE7", color: "#166534", border: "1px solid #BBF7D0" };
    if (status === "error" || status === "crashed") return { background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5" };
    return { background: "#FFEDD5", color: "#9A3412", border: "1px solid #FED7AA" };
  };

  return (
    <div className="px-8 py-10" style={{ background: "#F5F0E8" }}>

      {/* Header */}
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0D5C45", marginBottom: 28, letterSpacing: "-0.01em" }}>
        Dashboard
      </h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total scripts", value: scripts.length, color: "#0D5C45" },
          { label: "Running", value: runningCount, color: "#16A34A" },
          { label: "Errors", value: errorCount, color: "#DC2626" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-2xl p-5"
            style={{ background: "#FFFFFF", border: "1px solid #D6E8DC" }}
          >
            <p style={{ fontSize: 11, fontWeight: 600, color: "#4A7C65", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
              {label}
            </p>
            <p style={{ fontSize: 32, fontWeight: 700, color, lineHeight: 1 }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Scripts table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "#FFFFFF", border: "1px solid #D6E8DC" }}
      >
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #D6E8DC" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#0D5C45" }}>Scripts status</p>
        </div>

        <div className="px-5 py-4">
          {isLoading ? (
            <div className="flex items-center gap-2 py-6" style={{ color: "#4A7C65" }}>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span style={{ fontSize: 13 }}>Loading…</span>
            </div>
          ) : scripts.length === 0 ? (
            <p className="py-6 text-center" style={{ fontSize: 13, color: "#4A7C65" }}>No scripts yet</p>
          ) : (
            <div className="flex flex-col gap-2">
              {scripts.map((script) => {
                const status = states[script.id]?.status || "unknown";
                return (
                  <div
                    key={script.id}
                    className="flex items-center justify-between rounded-xl px-4 py-3 transition"
                    style={{ background: "#F5F0E8", border: "1px solid #C8DDD0" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "#0D5C45")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "#C8DDD0")}
                  >
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#0D5C45" }}>{script.name}</p>
                      <p style={{ fontSize: 12, color: "#4A7C65", marginTop: 2 }}>{script.path}</p>
                    </div>
                    <span
                      className="rounded-full px-3 py-1"
                      style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", ...statusStyle(status) }}
                    >
                      {status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}