"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import type { Script, ProcessState, ScriptLog } from "@/types";
import { 
  IconLoader2, 
  IconPlayerPlay, 
  IconPlayerStop, 
  IconRotateClockwise, 
  IconPackage,
  IconClock,
  IconChevronLeft,
  IconCode,
  IconNotes,
  IconSettings
} from "@tabler/icons-react";
import { useAuthStore } from "@/lib/auth-store";
import { useScriptWebSocket } from "@/hooks/use-script-websocket";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { CodeEditor } from "./components/CodeEditor";
import { LogViewer } from "./components/LogViewer";
import Link from "next/link";

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

  // WebSocket handler for real-time log push (deduplicate by ID)
  const handleNewLog = useCallback((log: ScriptLog) => {
    setLogs(prev => {
      if (prev.some(l => l.id === log.id)) return prev;
      return [...prev, log];
    });
  }, []);

  // Connect WebSocket when script is running (with auth)
  const { isConnected: wsConnected } = useScriptWebSocket({
    scriptId,
    enabled: state?.status === "running",
    onLog: handleNewLog,
  });

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

  // Fallback: poll logs only if WebSocket is NOT connected and script is running
  useEffect(() => {
    if (!scriptId || isLoading || wsConnected) return;

    const shouldPollLogs = state?.status === "running";
    if (shouldPollLogs) {
      const interval = setInterval(fetchLogs, 3000);
      return () => clearInterval(interval);
    }
  }, [scriptId, isLoading, state?.status, wsConnected, fetchLogs]);

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
    <div className="container-xl py-5 text-center">
      <IconLoader2 className="animate-spin text-secondary mb-2" size={24} />
      <div className="text-secondary small">Loading script details...</div>
    </div>
  );

  if (!script) return (
    <div className="container-xl py-5 text-center">
      <div className="text-secondary mb-3">Script not found</div>
      <Link href="/scripts" className="btn btn-white">Back to list</Link>
    </div>
  );

  const status = state?.status || "unknown";
  const statusColor = 
    status === "running" ? "success" : 
    status === "error" || status === "crashed" ? "danger" : 
    "warning";

  return (
    <div className="container-xl">
      <div className="page-header d-print-none mb-4">
        <div className="row align-items-center">
          <div className="col">
            <div className="mb-1">
              <Link href="/scripts" className="text-secondary d-inline-flex align-items-center">
                <IconChevronLeft size={16} className="me-1" />
                Back to scripts
              </Link>
            </div>
            <h2 className="page-title d-flex align-items-center gap-2 fw-bold tracking-tight">
              {script.name}
              <span className={`badge bg-${statusColor}-lt ms-2 fw-medium`}>{status}</span>
            </h2>
            <div className="text-secondary mt-1 font-monospace small">{script.path}</div>
          </div>
          {isAdmin && (
            <div className="col-auto ms-auto d-print-none">
              <div className="btn-list">
                <button
                  className="btn btn-success d-inline-flex align-items-center"
                  onClick={handleStart}
                  disabled={isExecuting || status === "running"}
                >
                  {isExecuting ? <IconLoader2 size={16} className="me-2 animate-spin" /> : <IconPlayerPlay size={16} className="me-2" />}
                  Start
                </button>
                <button
                  className="btn btn-outline-danger d-inline-flex align-items-center"
                  onClick={() => setIsStopDialogOpen(true)}
                  disabled={isExecuting || status !== "running"}
                >
                  {isExecuting ? <IconLoader2 size={16} className="me-2 animate-spin" /> : <IconPlayerStop size={16} className="me-2" />}
                  Stop
                </button>
                <button
                  className="btn btn-white d-inline-flex align-items-center"
                  onClick={handleRestart}
                  disabled={isExecuting}
                >
                  {isExecuting ? <IconLoader2 size={16} className="me-2 animate-spin" /> : <IconRotateClockwise size={16} className="me-2" />}
                  Restart
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-8">
          <div className="card h-100 card-premium shadow-sm">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h3 className="card-title">
                <IconNotes size={18} className="me-2 text-secondary" />
                Description
              </h3>
              {isAdmin && script.has_requirements && (
                <button
                  onClick={handleReinstall}
                  disabled={isExecuting}
                  className="btn btn-sm btn-white"
                >
                  <IconPackage size={14} className="me-1" />
                  Reinstall dependencies
                </button>
              )}
            </div>
            <div className="card-body">
              <p className={script.description ? 'text-dark' : 'text-secondary italic'}>
                {script.description || "No description provided for this script."}
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card h-100 card-premium shadow-sm">
            <div className="card-header">
              <h3 className="card-title">
                <IconSettings size={18} className="me-2 text-secondary" />
                Options
              </h3>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <label className="form-check form-switch mb-3">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    checked={script.start_on_boot}
                    onChange={() => isAdmin && handleToggleOption("start_on_boot")}
                    disabled={!isAdmin}
                  />
                  <span className="form-check-label">Start on boot</span>
                </label>
                <label className="form-check form-switch">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    checked={script.auto_restart}
                    onChange={() => isAdmin && handleToggleOption("auto_restart")}
                    disabled={!isAdmin}
                  />
                  <span className="form-check-label">Auto-restart on fail</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <CodeEditor
          content={content}
          editMode={editMode}
          isAdmin={isAdmin}
          setContent={setContent}
          onSave={handleSaveContent}
          onCancel={() => setEditMode(false)}
          onEdit={() => setEditMode(true)}
        />
      </div>

      <div className="mb-4">
        <LogViewer
          logs={logs}
          isAdmin={isAdmin}
          isLive={wsConnected}
          onDownload={handleDownloadLogs}
          onClear={() => setIsClearLogsDialogOpen(true)}
        />
      </div>

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
        title="Stop Script Execution"
        description="Are you sure you want to stop this script? Any active processes will be terminated."
        confirmText="Stop Script"
        variant="danger"
      />
    </div>
  );
}
