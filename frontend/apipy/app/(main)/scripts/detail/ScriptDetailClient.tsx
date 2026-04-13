"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import type { Script, ProcessState, ScriptLog } from "@/types";
import { Loader2, Play, Square, RotateCw, Package } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { CodeEditor } from "./components/CodeEditor";
import { LogViewer } from "./components/LogViewer";

export default function ScriptDetailClient() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const searchParams = useSearchParams();
  const scriptId = searchParams.get("id") as string;

  const [script, setScript] = useState<Script | null>(null);
  const [state, setState] = useState<ProcessState | null>(null);
  const [logs, setLogs] = useState<ScriptLog[]>([]);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isClearLogsDialogOpen, setIsClearLogsDialogOpen] = useState(false);
  const [isStopDialogOpen, setIsStopDialogOpen] = useState(false);

  const lastStatusRef = useRef<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!scriptId) return;
    try {
      const stateData = await api.getScriptStatus(scriptId);
      setState(stateData);
      lastStatusRef.current = stateData.status;
    } catch (err) {
      console.error("Failed to load status:", err);
    }
  }, [scriptId]);

  const fetchLogs = useCallback(async () => {
    if (!scriptId) return;
    try {
      const logsData = await api.getLogs(scriptId);
      setLogs(logsData);
    } catch (err) {
      console.error("Failed to load logs:", err);
    }
  }, [scriptId]);

  // Initial load: fetch everything once
  useEffect(() => {
    if (!scriptId) return;

    const init = async () => {
      try {
        const [scriptData, stateData, logsData, fileData] = await Promise.all([
          api.getScript(scriptId),
          api.getScriptStatus(scriptId),
          api.getLogs(scriptId),
          api.getScriptFile(scriptId)
        ]);

        setScript(scriptData);
        setState(stateData);
        setLogs(logsData);
        setContent(fileData.content);
        lastStatusRef.current = stateData.status;
      } catch (err) {
        console.error("Failed to load initial data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [scriptId]);

  // Continually poll status every 2 seconds
  useEffect(() => {
    if (!scriptId || isLoading) return;
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, [scriptId, isLoading, fetchStatus]);

  // Poll logs ONLY if script is running
  useEffect(() => {
    if (!scriptId || isLoading) return;

    // Check if we should poll logs: running
    const shouldPollLogs = state?.status === "running";

    if (shouldPollLogs) {
      const interval = setInterval(fetchLogs, 2000);
      return () => clearInterval(interval);
    }
  }, [scriptId, isLoading, state?.status, fetchLogs]);

  const handleStart = async () => {
    setIsExecuting(true);
    try {
      await api.startScript(scriptId);
      await fetchStatus();
      await fetchLogs();
    } catch { } finally { setIsExecuting(false); }
  };

  const handleStop = async () => {
    setIsStopDialogOpen(false);
    setIsExecuting(true);
    try {
      await api.stopScript(scriptId);
      await fetchStatus();
      await fetchLogs();
    } catch { }
    finally { setIsExecuting(false); }
  };

  const handleRestart = async () => {
    setIsExecuting(true);
    try {
      await api.restartScript(scriptId);
      await fetchStatus();
      await fetchLogs();
    } catch { } finally { setIsExecuting(false); }
  };
  const handleSaveContent = async () => { try { await api.updateScriptFile(scriptId, content); setEditMode(false); } catch (err) { console.error(err); } };
  const handleClearLogs = async () => {
    setIsClearLogsDialogOpen(false);
    try {
      await api.deleteLogs(scriptId);
      setLogs([]);
    } catch { }
  };
  const handleReinstall = async () => { setIsExecuting(true); try { await api.reinstallDependencies(scriptId); } catch { } finally { setIsExecuting(false); } };

  const handleToggleOption = async (option: "start_on_boot" | "auto_restart") => {
    if (!script) return;
    const newValue = !script[option];

    // Optimistic update
    setScript({ ...script, [option]: newValue });

    try {
      await api.updateScript(scriptId, { [option]: newValue });
    } catch (err) {
      console.error("Failed to update script option:", err);
      // Rollback on error
      setScript(script);
    }
  };

  const handleDownloadLogs = async () => {
    try {
      const blob = await api.downloadLogs(scriptId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${script?.name || "script"}-logs.txt`;
      a.click();
    } catch { }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-20" style={{ background: "#F5F0E8" }}>
      <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#0D5C45" }} />
    </div>
  );

  if (!script) return (
    <div className="flex items-center justify-center py-20" style={{ background: "#F5F0E8" }}>
      <p style={{ color: "#4A7C65", fontSize: 14 }}>Script not found</p>
    </div>
  );

  const status = state?.status || "unknown";
  const statusStyle =
    status === "running" ? { background: "#DCFCE7", color: "#166534", border: "1px solid #BBF7D0" } :
      status === "error" || status === "crashed" ? { background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5" } :
        { background: "#FFEDD5", color: "#9A3412", border: "1px solid #FED7AA" };

  const actionBtn = (onClick: () => void, disabled: boolean, icon: React.ReactNode, label: string, primary = false) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition w-full"
      style={{
        background: primary ? "#0D5C45" : "transparent",
        color: primary ? "#F5F0E8" : "#0D5C45",
        border: primary ? "none" : "1px solid #C8DDD0",
        fontSize: 13, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = primary ? "#0a4a37" : "#F5F0E8"; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = primary ? "#0D5C45" : "transparent"; }}
    >
      {isExecuting ? <Loader2 size={14} className="animate-spin" /> : icon}
      {label}
    </button>
  );

  return (
    <div className="px-8 py-10" style={{ background: "#F5F0E8" }}>

      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0D5C45", letterSpacing: "-0.01em" }}>{script.name}</h1>
          <p style={{ fontSize: 12, color: "#4A7C65", fontFamily: "monospace", marginTop: 4 }}>{script.path}</p>
        </div>
        <span className="rounded-full px-3 py-1" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", ...statusStyle }}>
          {status}
        </span>
      </div>

      {/* Controls */}
      {isAdmin && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {actionBtn(handleStart, isExecuting || status === "running", <Play size={14} />, "Start", true)}
          {actionBtn(() => setIsStopDialogOpen(true), isExecuting || status !== "running", <Square size={14} />, "Stop")}
          {actionBtn(handleRestart, isExecuting, <RotateCw size={14} />, "Restart")}
        </div>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #D6E8DC" }}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid #D6E8DC" }}>
            <div className="flex items-center justify-between">
              <p style={{ fontSize: 13, fontWeight: 600, color: "#0D5C45" }}>Description</p>
              {isAdmin && script.has_requirements && (
                <button
                  onClick={handleReinstall}
                  disabled={isExecuting}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition"
                  style={{
                    fontSize: 11, fontWeight: 600,
                    background: "#F5F0E8", color: "#0D5C45",
                    border: "1px solid #C8DDD0", cursor: isExecuting ? "not-allowed" : "pointer"
                  }}
                  onMouseEnter={e => !isExecuting && (e.currentTarget.style.borderColor = "#0D5C45")}
                  onMouseLeave={e => !isExecuting && (e.currentTarget.style.borderColor = "#C8DDD0")}
                >
                  <Package size={11} /> Reinstall deps
                </button>
              )}
            </div>
          </div>
          <div className="px-5 py-4">
            <p style={{ fontSize: 12, color: script.description ? "#0D5C45" : "#4A7C65" }}>
              {script.description || "No description"}
            </p>
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #D6E8DC" }}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid #D6E8DC" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#0D5C45" }}>Options</p>
          </div>
          <div className="px-5 py-4 flex flex-col gap-3">
            {[
              { id: "start_on_boot", label: "Start on boot", checked: script.start_on_boot },
              { id: "auto_restart", label: "Auto-restart", checked: script.auto_restart },
            ].map(({ id, label, checked }) => (
              <label
                key={id}
                className={`flex items-center gap-3 ${isAdmin ? "cursor-pointer group" : "cursor-default opacity-80"}`}
                onClick={() => isAdmin && handleToggleOption(id as any)}
              >
                <div
                  className="flex items-center justify-center rounded-md transition"
                  style={{
                    width: 18, height: 18, flexShrink: 0,
                    background: checked ? "#0D5C45" : "#F5F0E8",
                    border: `1.5px solid ${checked ? "#0D5C45" : "#C8DDD0"}`
                  }}
                >
                  {checked && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="#F5F0E8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>
                <span
                  style={{ fontSize: 13, color: "#0D5C45", fontWeight: checked ? 600 : 400 }}
                  className={isAdmin ? "group-hover:opacity-70 transition-opacity" : ""}
                >
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>


      <CodeEditor
        content={content}
        editMode={editMode}
        isAdmin={isAdmin}
        setContent={setContent}
        onSave={handleSaveContent}
        onCancel={() => setEditMode(false)}
        onEdit={() => setEditMode(true)}
      />

      <LogViewer
        logs={logs}
        isAdmin={isAdmin}
        onDownload={handleDownloadLogs}
        onClear={() => setIsClearLogsDialogOpen(true)}
      />

      <ConfirmationDialog
        isOpen={isClearLogsDialogOpen}
        onClose={() => setIsClearLogsDialogOpen(false)}
        onConfirm={handleClearLogs}
        title="Clear Log History"
        description="Are you sure you want to clear all log entries for this script? This action cannot be undone."
        confirmText="Clear Logs"
        variant="warning"
      />

      <ConfirmationDialog
        isOpen={isStopDialogOpen}
        onClose={() => setIsStopDialogOpen(false)}
        onConfirm={handleStop}
        title="Stop script execution"
        description="Are you sure you want to stop this script? Any active processes will be terminated."
        confirmText="Stop Script"
        variant="warning"
      />
    </div>
  );
}
