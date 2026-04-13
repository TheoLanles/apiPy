"use client";

import React from "react";
import Link from "next/link";
import { Eye, Trash2 } from "lucide-react";
import type { Script, ProcessState } from "@/types";

interface ScriptListItemProps {
  script: Script;
  status: string;
  isSelected: boolean;
  isAdmin: boolean;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ScriptListItem = React.memo(({
  script,
  status,
  isSelected,
  isAdmin,
  onToggleSelect,
  onDelete
}: ScriptListItemProps) => {
  const statusStyle = (status: string) => {
    if (status === "running") return { background: "#DCFCE7", color: "#166534", border: "1px solid #BBF7D0" };
    if (status === "error" || status === "crashed") return { background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5" };
    return { background: "#FFEDD5", color: "#9A3412", border: "1px solid #FED7AA" };
  };

  return (
    <div
      className="rounded-2xl px-5 py-4 transition flex items-start gap-4"
      style={{ 
        background: isSelected ? "#F0FDF4" : "#FFFFFF", 
        border: isSelected ? "1px solid #C8DDD0" : "1px solid #D6E8DC" 
      }}
      onMouseEnter={e => { if(!isSelected) e.currentTarget.style.borderColor = "#0D5C45" }}
      onMouseLeave={e => { if(!isSelected) e.currentTarget.style.borderColor = "#D6E8DC" }}
    >
      <div className="pt-1">
        <input 
          type="checkbox" 
          checked={isSelected}
          onChange={() => onToggleSelect(script.id)}
          className="w-4 h-4 accent-emerald-800 cursor-pointer"
        />
      </div>
      <div className="flex-1 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <Link
            href={`/scripts/detail?id=${script.id}`}
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

        <div className="flex flex-col items-end gap-3">
          <span
            className="rounded-full px-3 py-1"
            style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", ...statusStyle(status) }}
          >
            {status}
          </span>
          <div className="flex gap-2">
            <Link href={`/scripts/detail?id=${script.id}`}>
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
                onClick={() => onDelete(script.id)}
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
});

ScriptListItem.displayName = "ScriptListItem";
