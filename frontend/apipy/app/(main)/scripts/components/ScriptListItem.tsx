"use client";

import React from "react";
import Link from "next/link";
import { IconEye, IconTrash } from "@tabler/icons-react";
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
  const getStatusClass = (status: string) => {
    switch (status) {
      case "running": return "bg-success";
      case "error":
      case "crashed": return "bg-danger";
      case "stopped": return "bg-secondary";
      default: return "bg-warning";
    }
  };

  return (
    <div className={`card card-premium shadow-sm ${isSelected ? 'border-primary bg-primary-lt' : ''}`}>
      <div className="card-body p-3">
        <div className="row align-items-center">
          <div className="col-auto">
            <label className="form-check m-0">
              <input 
                type="checkbox" 
                className="form-check-input" 
                checked={isSelected}
                onChange={() => onToggleSelect(script.id)}
              />
            </label>
          </div>
          <div className="col">
            <div className="d-flex align-items-center gap-2">
              <Link href={`/scripts/detail?id=${script.id}`} className="text-reset fw-bold tracking-tight">
                {script.name}
              </Link>
              <span className={`badge ${getStatusClass(status)} badge-blink`}></span>
            </div>
            <div className="text-secondary small mt-1">{script.path}</div>
            {script.description && (
              <div className="text-secondary small mt-1 italic">{script.description}</div>
            )}
            <div className="mt-2 d-flex gap-2">
              {script.start_on_boot && (
                <span className="badge badge-outline text-secondary fw-normal">Start on boot</span>
              )}
              {script.auto_restart && (
                <span className="badge badge-outline text-secondary fw-normal">Auto-restart</span>
              )}
            </div>
          </div>
          <div className="col-auto">
            <span className="text-secondary small text-capitalize fw-medium me-3">
              {status}
            </span>
          </div>
          <div className="col-auto d-flex gap-2">
            <Link href={`/scripts/detail?id=${script.id}`} className="btn btn-sm btn-white">
              <IconEye size={16} className="me-1" />
              View
            </Link>
            {isAdmin && (
              <button 
                onClick={() => onDelete(script.id)}
                className="btn btn-sm btn-outline-danger"
              >
                <IconTrash size={16} className="me-1" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

ScriptListItem.displayName = "ScriptListItem";
