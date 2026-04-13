"use client";

import React from "react";
import { Download, Trash2 } from "lucide-react";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import type { ScriptLog } from "@/types";

interface LogViewerProps {
  logs: ScriptLog[];
  isAdmin: boolean;
  isLive?: boolean;
  onDownload: () => void;
  onClear: () => void;
}

export const LogViewer = React.memo(({
  logs,
  isAdmin,
  isLive = false,
  onDownload,
  onClear
}: LogViewerProps) => {
  const stripAnsi = (str: string) => {
    return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #D6E8DC" }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #D6E8DC" }}>
        <div className="flex items-center gap-3">
          <p style={{ fontSize: 13, fontWeight: 600, color: "#0D5C45" }}>Logs</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onDownload} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition" style={{ fontSize: 12, fontWeight: 500, color: "#0D5C45", background: "#F5F0E8", border: "1px solid #C8DDD0", cursor: "pointer" }}>
            <Download size={12} /> Download
          </button>
          {isAdmin && (
            <button onClick={onClear} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition" style={{ fontSize: 12, fontWeight: 500, color: "#991B1B", background: "#FEE2E2", border: "1px solid #FCA5A5", cursor: "pointer" }}>
              <Trash2 size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      <div style={{ background: "#0D5C45", margin: 16, borderRadius: 10, padding: 0, overflow: "hidden" }}>
        <SimpleBar
          className="custom-scrollbar-dark"
          style={{ maxHeight: 384, padding: "12px 16px" }}
          autoHide={true}
        >
          {logs.length === 0 ? (
            <p style={{ color: "rgba(245,240,232,0.35)", fontSize: 12, fontFamily: "monospace" }}>No logs</p>
          ) : (
            logs.map(log => (
              <div
                key={log.id}
                style={{
                  color: log.level === "ERROR" ? "#FCA5A5" : log.level === "WARNING" ? "#FCD34D" : "#86EFAC",
                  lineHeight: 1.7,
                  fontFamily: "monospace",
                  fontSize: 12
                }}
              >
                [{log.level}] {stripAnsi(log.line)}
              </div>
            ))
          )}
        </SimpleBar>
      </div>
    </div>
  );
});

LogViewer.displayName = "LogViewer";
