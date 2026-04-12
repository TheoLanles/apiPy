"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Script, ProcessState } from "@/types";
import { Loader2, Plus, Eye, Trash2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { ConfirmationDialog } from "@/components/confirmation-dialog";

export default function ScriptsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const [scripts, setScripts] = useState<Script[]>([]);
  const [states, setStates] = useState<Record<string, ProcessState>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; scriptId: string | null }>({
    isOpen: false,
    scriptId: null,
  });

  useEffect(() => { loadScripts(); }, []);

  const loadScripts = async () => {
    try {
      const data = await api.getScripts();
      setScripts(data);
      const statesData: Record<string, ProcessState> = {};
      for (const script of data) {
        try {
          const state = await api.getScriptStatus(script.id);
          statesData[script.id] = state;
        } catch { }
      }
      setStates(statesData);
    } catch (err) {
      console.error("Failed to load scripts:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.scriptId) return;
    try {
      await api.deleteScript(deleteDialog.scriptId);
      setScripts(scripts.filter((s) => s.id !== deleteDialog.scriptId));
      setDeleteDialog({ isOpen: false, scriptId: null });
    } catch (err) {
      console.error("Failed to delete script:", err);
    }
  };

  const statusStyle = (status: string) => {
    if (status === "running") return { background: "#DCFCE7", color: "#166534", border: "1px solid #BBF7D0" };
    if (status === "error" || status === "crashed") return { background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5" };
    return { background: "#FFEDD5", color: "#9A3412", border: "1px solid #FED7AA" };
  };

  return (
    <div className="px-8 py-10" style={{ background: "#F5F0E8" }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0D5C45", letterSpacing: "-0.01em" }}>
          Scripts
        </h1>
        {isAdmin && (
          <Link href="/scripts/new">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-xl transition"
              style={{ background: "#0D5C45", color: "#F5F0E8", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = "#0a4a37"}
              onMouseLeave={e => e.currentTarget.style.background = "#0D5C45"}
            >
              <Plus size={15} />
              New script
            </button>
          </Link>
        )}
      </div>

      {/* States */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-10" style={{ color: "#4A7C65" }}>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span style={{ fontSize: 13 }}>Loading…</span>
        </div>
      ) : scripts.length === 0 ? (
        <div
          className="rounded-2xl flex flex-col items-center justify-center py-16"
          style={{ background: "#FFFFFF", border: "1px solid #D6E8DC" }}
        >
          <p style={{ fontSize: 13, color: "#4A7C65" }}>No scripts yet</p>
          <Link href="/scripts/new">
            <button
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ background: "#0D5C45", color: "#F5F0E8", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}
            >
              <Plus size={14} /> Create your first script
            </button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {scripts.map((script) => {
            const status = states[script.id]?.status || "unknown";
            return (
              <div
                key={script.id}
                className="rounded-2xl px-5 py-4 transition"
                style={{ background: "#FFFFFF", border: "1px solid #D6E8DC" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#0D5C45"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#D6E8DC"}
              >
                <div className="flex items-start justify-between gap-4">

                  {/* Left */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/scripts/${script.id}`}
                      style={{ fontSize: 15, fontWeight: 600, color: "#0D5C45", textDecoration: "none" }}
                      onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                      onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
                    >
                      {script.name}
                    </Link>
                    <p style={{ fontSize: 12, color: "#4A7C65", marginTop: 2 }}>{script.path}</p>
                    {script.description && (
                      <p style={{ fontSize: 12, color: "#4A7C65", marginTop: 4 }}>{script.description}</p>
                    )}
                    {(script.start_on_boot || script.auto_restart) && (
                      <div className="flex gap-2 mt-3">
                        {script.start_on_boot && (
                          <span
                            className="rounded-full px-2.5 py-0.5"
                            style={{ fontSize: 11, fontWeight: 500, background: "#F5F0E8", color: "#4A7C65", border: "1px solid #C8DDD0" }}
                          >
                            Start on boot
                          </span>
                        )}
                        {script.auto_restart && (
                          <span
                            className="rounded-full px-2.5 py-0.5"
                            style={{ fontSize: 11, fontWeight: 500, background: "#F5F0E8", color: "#4A7C65", border: "1px solid #C8DDD0" }}
                          >
                            Auto-restart
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right */}
                  <div className="flex flex-col items-end gap-3">
                    <span
                      className="rounded-full px-3 py-1"
                      style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", ...statusStyle(status) }}
                    >
                      {status}
                    </span>
                    <div className="flex gap-2">
                      <Link href={`/scripts/${script.id}`}>
                        <button
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition"
                          style={{ fontSize: 12, fontWeight: 500, color: "#0D5C45", background: "#F5F0E8", border: "1px solid #C8DDD0", cursor: "pointer" }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = "#0D5C45"}
                          onMouseLeave={e => e.currentTarget.style.borderColor = "#C8DDD0"}
                        >
                          <Eye size={13} /> View
                        </button>
                      </Link>
                      {isAdmin && (
                        <button
                          onClick={() => setDeleteDialog({ isOpen: true, scriptId: script.id })}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition"
                          style={{ fontSize: 12, fontWeight: 500, color: "#991B1B", background: "#FEE2E2", border: "1px solid #FCA5A5", cursor: "pointer" }}
                          onMouseEnter={e => e.currentTarget.style.background = "#FECACA"}
                          onMouseLeave={e => e.currentTarget.style.background = "#FEE2E2"}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, scriptId: null })}
        onConfirm={handleDelete}
        title="Delete script"
        description="Are you sure you want to delete this script? This action cannot be undone and all logs will be lost."
        confirmText="Delete Script"
        variant="danger"
      />
    </div>
  );
}
