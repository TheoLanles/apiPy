"use client";

import React from "react";
import { Pencil, Save, X } from "lucide-react";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";

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
    <div className="rounded-2xl overflow-hidden mb-4" style={{ background: "#FFFFFF", border: "1px solid #D6E8DC" }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #D6E8DC" }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#0D5C45" }}>Script content</p>
        {isAdmin && (
          editMode ? (
            <div className="flex gap-2">
              <button onClick={onSave} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ fontSize: 12, fontWeight: 600, background: "#0D5C45", color: "#F5F0E8", border: "none", cursor: "pointer" }}>
                <Save size={12} /> Save
              </button>
              <button onClick={onCancel} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ fontSize: 12, fontWeight: 500, background: "transparent", color: "#4A7C65", border: "1px solid #C8DDD0", cursor: "pointer" }}>
                <X size={12} /> Cancel
              </button>
            </div>
          ) : (
            <button onClick={onEdit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ fontSize: 12, fontWeight: 500, color: "#0D5C45", background: "#F5F0E8", border: "1px solid #C8DDD0", cursor: "pointer" }}>
              <Pencil size={12} /> Edit
            </button>
          )
        )}
      </div>
      <div className="p-4">
        {editMode ? (
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            className="custom-scrollbar-light"
            style={{ width: "100%", boxSizing: "border-box", height: 320, padding: "10px", background: "#F5F0E8", border: "1px solid #C8DDD0", borderRadius: 10, fontFamily: "monospace", fontSize: 12, color: "#0D5C45", outline: "none", resize: "vertical" }}
            onFocus={e => e.target.style.borderColor = "#00C853"}
            onBlur={e => e.target.style.borderColor = "#C8DDD0"}
          />
        ) : (
          <div 
            className="hide-scrollbar" 
            style={{ 
              background: "#0D5C45", 
              borderRadius: 10, 
              maxHeight: 320, 
              overflow: "hidden", 
              padding: "16px" 
            }}
          >
            <pre style={{ color: "#F5F0E8", fontFamily: "monospace", fontSize: 12, margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
              {content || <span style={{ color: "rgba(245,240,232,0.4)" }}>Empty file</span>}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
});

CodeEditor.displayName = "CodeEditor";
