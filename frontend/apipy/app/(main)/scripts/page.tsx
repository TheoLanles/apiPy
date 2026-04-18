"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Script, ProcessState } from "@/types";
import { 
  IconLoader2, 
  IconPlus, 
  IconPlayerPlay, 
  IconPlayerStop,
  IconFileText,
  IconX
} from "@tabler/icons-react";
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
      setScripts(data || []);
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

  useEffect(() => {
    const init = async () => {
      await Promise.all([loadScripts(), loadStatuses()]);
    };
    init();
  }, [loadScripts, loadStatuses]);

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
    if (selectedIds.size === filteredScripts.length && filteredScripts.length > 0) {
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
    <div className="container-xl">
      {/* Page Header */}
      <div className="page-header d-print-none mb-4">
        <div className="row align-items-center">
          <div className="col-auto">
            <span className="form-check form-check-inline m-0 pt-1">
              <input 
                className="form-check-input" 
                type="checkbox" 
                checked={selectedIds.size === filteredScripts.length && filteredScripts.length > 0}
                onChange={toggleSelectAll}
              />
            </span>
          </div>
          <div className="col">
            <h2 className="page-title fw-bold tracking-tight">
              Scripts
            </h2>
            <div className="text-secondary mt-1 small text-uppercase tracking-wider fw-medium">Manage and monitor your Python processes</div>
          </div>
          <div className="col-auto ms-auto d-print-none d-flex align-items-center gap-3">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Filter scripts..."
              className="w-auto"
            />
            {isAdmin && (
              <Link href="/scripts/new" className="btn btn-primary btn-sm d-none d-sm-inline-flex align-items-center">
                <IconPlus size={16} className="me-1" />
                New script
              </Link>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-5 text-center">
          <IconLoader2 className="animate-spin text-secondary mb-2" size={24} />
          <div className="text-secondary small">Loading scripts...</div>
        </div>
      ) : filteredScripts.length === 0 ? (
        <div className="empty">
          <div className="empty-img">
            <IconFileText size={48} stroke={1} className="text-secondary opacity-20" />
          </div>
          <p className="empty-title">No scripts found</p>
          <p className="empty-subtitle text-secondary">
            {searchQuery ? "Try adjusting your search criteria." : "Get started by creating your first automated script."}
          </p>
          {!searchQuery && isAdmin && (
            <div className="empty-action">
              <Link href="/scripts/new" className="btn btn-primary">
                <IconPlus size={18} className="me-2" />
                New script
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="row row-cards mb-5">
          {filteredScripts.map((script) => (
            <div key={script.id} className="col-12">
              <ScriptListItem
                script={script}
                status={states[script.id]?.status || "unknown"}
                isSelected={selectedIds.has(script.id)}
                isAdmin={isAdmin}
                onToggleSelect={toggleSelect}
                onDelete={(id) => setDeleteDialog({ isOpen: true, scriptId: id })}
              />
            </div>
          ))}
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="sticky-bottom bg-primary text-white p-3 rounded-top-4 shadow-lg mx-3 mb-0 z-index-100 animate__animated animate__slideInUp">
          <div className="container-xl">
            <div className="row align-items-center">
              <div className="col">
                <div className="fw-bold">{selectedIds.size} Script{selectedIds.size > 1 ? 's' : ''} selected</div>
                <div className="small text-white-50">Bulk operations will be applied to all selected items.</div>
              </div>
              <div className="col-auto d-flex gap-2">
                <button
                  onClick={handleBulkStart}
                  disabled={isBulkLoading}
                  className="btn btn-success"
                >
                  {isBulkLoading ? <IconLoader2 size={16} className="me-2 animate-spin" /> : <IconPlayerPlay size={16} className="me-2" />}
                  Mass Start
                </button>
                <button
                  onClick={handleBulkStop}
                  disabled={isBulkLoading}
                  className="btn btn-danger"
                >
                  {isBulkLoading ? <IconLoader2 size={16} className="me-2 animate-spin" /> : <IconPlayerStop size={16} className="me-2" />}
                  Mass Stop
                </button>
                <div className="vr mx-2 bg-white-50 opacity-20"></div>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="btn btn-ghost-light btn-icon"
                  title="Deselect all"
                >
                  <IconX size={20} />
                </button>
              </div>
            </div>
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
