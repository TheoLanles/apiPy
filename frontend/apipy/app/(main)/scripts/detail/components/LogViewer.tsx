"use client";

import React from "react";
import { IconDownload, IconTrash, IconTerminal } from "@tabler/icons-react";
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
    <div className="card card-premium shadow-sm">
      <div className="card-header d-flex align-items-center justify-content-between">
        <h3 className="card-title">
          <IconTerminal size={18} className="me-2 text-secondary" />
          Logs {isLive && <span className="badge badge-pulse bg-success-lt ms-2">Live</span>}
        </h3>
        <div className="btn-list">
          <button 
            onClick={onDownload} 
            className="btn btn-white btn-sm"
          >
            <IconDownload size={14} className="me-1" />
            Download
          </button>
          {isAdmin && (
            <button 
              onClick={onClear} 
              className="btn btn-outline-danger btn-sm"
            >
              <IconTrash size={14} className="me-1" />
              Clear Logs
            </button>
          )}
        </div>
      </div>

      <div className="card-body p-0">
        <div className="bg-dark p-0">
          <SimpleBar
            className="p-3"
            style={{ maxHeight: '500px' }}
            autoHide={true}
          >
            {logs.length === 0 ? (
              <div className="text-secondary font-monospace small"># No log entries found</div>
            ) : (
              logs.map(log => (
                <div
                  key={log.id}
                  className="font-monospace small mb-1"
                  style={{
                    color: log.level === "ERROR" ? "#FCA5A5" : log.level === "WARNING" ? "#FCD34D" : "#86EFAC",
                    lineHeight: 1.5,
                  }}
                >
                  <span className="opacity-50 me-2">[{log.level}]</span>
                  {stripAnsi(log.line)}
                </div>
              ))
            )}
          </SimpleBar>
        </div>
      </div>
    </div>
  );
});

LogViewer.displayName = "LogViewer";
