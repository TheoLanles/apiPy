"use client";

import React from "react";
import { IconPencil, IconDeviceFloppy, IconX, IconCode } from "@tabler/icons-react";

interface CodeEditorProps {
  content: string;
  editMode: boolean;
  isAdmin: boolean;
  setContent: (content: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onEdit: () => void;
}

export const CodeEditor = React.memo(({
  content,
  editMode,
  isAdmin,
  setContent,
  onSave,
  onCancel,
  onEdit
}: CodeEditorProps) => {
  return (
    <div className="card card-premium shadow-sm">
      <div className="card-header d-flex align-items-center justify-content-between">
        <h3 className="card-title">
          <IconCode size={18} className="me-2 text-secondary" />
          Script Content
        </h3>
        {isAdmin && (
          editMode ? (
            <div className="btn-list">
              <button 
                onClick={onSave} 
                className="btn btn-success btn-sm"
              >
                <IconDeviceFloppy size={14} className="me-1" />
                Save Changes
              </button>
              <button 
                onClick={onCancel} 
                className="btn btn-white btn-sm"
              >
                <IconX size={14} className="me-1" />
                Cancel
              </button>
            </div>
          ) : (
            <button 
              onClick={onEdit} 
              className="btn btn-white btn-sm"
            >
              <IconPencil size={14} className="me-1" />
              Edit Source
            </button>
          )
        )}
      </div>
      <div className="card-body p-0">
        {editMode ? (
          <div className="p-3">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              className="form-control font-monospace"
              style={{ minHeight: '400px', resize: 'vertical' }}
              placeholder="Enter Python code here..."
            />
          </div>
        ) : (
          <div className="bg-dark text-light p-3 font-monospace overflow-auto" style={{ maxHeight: '500px' }}>
            <pre className="mb-0 text-white" style={{ fontSize: '13px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {content || <span className="opacity-50"># This file is empty</span>}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
});

CodeEditor.displayName = "CodeEditor";
