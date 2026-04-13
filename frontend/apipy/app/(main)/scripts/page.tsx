"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Script, ProcessState } from "@/types";
import { Loader2, Plus } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { ScriptListItem } from "./components/ScriptListItem";
import { SearchInput } from "@/components/SearchInput";

export default function ScriptsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const [scripts, setScripts] = useState<Script[]>([]);
  const [states, setStates] = useState<Record<string, ProcessState>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; scriptId: string | null }>({
    isOpen: false,
    scriptId: null,
  });

  const loadScripts = useCallback(async () => {
    try {
      const data = await api.getScripts();
      setScripts(data);
    } catch (err) {
      console.error("Failed to load scripts:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadStatuses = useCallback(async () => {
    try {
      const statuses = await api.getAllScriptsStatus();
      setStates(statuses);
    } catch (err) {
      console.error("Failed to load statuses:", err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      await Promise.all([loadScripts(), loadStatuses()]);
    };
    init();
  }, [loadScripts, loadStatuses]);

  // Polling for statuses every 5 seconds
  useEffect(() => {
    const interval = setInterval(loadStatuses, 5000);
    return () => clearInterval(interval);
  }, [loadStatuses]);

  const filteredScripts = useMemo(() => {
    return scripts.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [scripts, searchQuery]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredScripts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredScripts.map(s => s.id)));
    }
  };

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleBulkStart = async () => {
    setIsBulkLoading(true);
    try {
      await api.bulkStartScripts(Array.from(selectedIds));
      await loadStatuses();
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Bulk start failed:", err);
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleBulkStop = async () => {
    setIsBulkLoading(true);
    try {
      await api.bulkStopScripts(Array.from(selectedIds));
      await loadStatuses();
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Bulk stop failed:", err);
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.scriptId) return;
    try {
      await api.deleteScript(deleteDialog.scriptId);
      setScripts(prev => prev.filter(s => s.id !== deleteDialog.scriptId));
      setDeleteDialog({ isOpen: false, scriptId: null });
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(deleteDialog.scriptId!);
        return next;
      });
    } catch (err) {
      console.error("Failed to delete script:", err);
    }
  };

  return (
    <div className="px-8 py-10 pb-32" style={{ background: "#F5F0E8" }}>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-7 gap-4">
        <div className="flex items-center gap-4">
          <input 
            type="checkbox" 
            checked={selectedIds.size === filteredScripts.length && filteredScripts.length > 0}
            onChange={toggleSelectAll}
            className="w-5 h-5 accent-emerald-800 cursor-pointer"
          />
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0D5C45", letterSpacing: "-0.01em" }}>
            Scripts
          </h1>
        </div>
        
        <div className="flex items-center gap-3 flex-1 md:max-w-md">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search scripts by name, path or info..."
          />

          {isAdmin && (
            <Link href="/scripts/new">
              <button
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition whitespace-nowrap"
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
      </div>

      {/* States */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-10" style={{ color: "#4A7C65" }}>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span style={{ fontSize: 13 }}>Loading…</span>
        </div>
      ) : filteredScripts.length === 0 ? (
        <div
          className="rounded-2xl flex flex-col items-center justify-center py-16"
          style={{ background: "#FFFFFF", border: "1px solid #D6E8DC" }}
        >
          <p style={{ fontSize: 13, color: "#4A7C65" }}>{searchQuery ? "No scripts match your search" : "No scripts yet"}</p>
          {!searchQuery && (
            <Link href="/scripts/new">
              <button
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl"
                style={{ background: "#0D5C45", color: "#F5F0E8", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}
              >
                <Plus size={14} /> Create your first script
              </button>
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredScripts.map((script) => (
            <ScriptListItem
              key={script.id}
              script={script}
              status={states[script.id]?.status || "unknown"}
              isSelected={selectedIds.has(script.id)}
              isAdmin={isAdmin}
              onToggleSelect={toggleSelect}
              onDelete={(id) => setDeleteDialog({ isOpen: true, scriptId: id })}
            />
          ))}
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div 
            className="flex items-center gap-6 px-6 py-4 rounded-2xl shadow-2xl border"
            style={{ background: "#0D5C45", borderColor: "#0a4a37", color: "#F5F0E8" }}
          >
            <div className="flex flex-col">
              <span style={{ fontSize: 13, fontWeight: 700 }}>{selectedIds.size} Script{selectedIds.size > 1 ? 's' : ''} Selected</span>
              <span style={{ fontSize: 11, color: "rgba(245,240,232,0.6)" }}>Mass operation ready</span>
            </div>

            <div className="h-8 w-px" style={{ background: "rgba(255,255,255,0.1)" }} />

            <div className="flex gap-2">
              <button
                onClick={handleBulkStart}
                disabled={isBulkLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl transition font-semibold"
                style={{ background: "#DCFCE7", color: "#166534", fontSize: 12, border: "none", cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.background = "#BBF7D0"}
                onMouseLeave={e => e.currentTarget.style.background = "#DCFCE7"}
              >
                {isBulkLoading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                Mass Start
              </button>

              <button
                onClick={handleBulkStop}
                disabled={isBulkLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl transition font-semibold"
                style={{ background: "#FEE2E2", color: "#991B1B", fontSize: 12, border: "none", cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.background = "#FECACA"}
                onMouseLeave={e => e.currentTarget.style.background = "#FEE2E2"}
              >
                {isBulkLoading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                Mass Stop
              </button>
            </div>

            <div className="h-8 w-px" style={{ background: "rgba(255,255,255,0.1)" }} />

            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-2 rounded-lg text-xs font-medium transition"
              style={{ color: "rgba(245,240,232,0.6)", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#F5F0E8"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "rgba(245,240,232,0.6)"; e.currentTarget.style.background = "transparent"; }}
            >
              Cancel
            </button>
          </div>
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
