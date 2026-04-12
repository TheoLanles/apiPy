"use client";

import React from "react";
import { X, AlertTriangle, Trash2, HelpCircle, Loader2 } from "lucide-react";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "info",
  isLoading = false,
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: <Trash2 size={24} className="text-red-600" />,
          iconBg: "bg-red-50",
          confirmBtn: {
            background: "#991B1B",
            color: "#FFFFFF",
            hover: "#b91c1c",
          },
        };
      case "warning":
        return {
          icon: <AlertTriangle size={24} className="text-amber-600" />,
          iconBg: "bg-amber-50",
          confirmBtn: {
            background: "#B45309",
            color: "#FFFFFF",
            hover: "#92400e",
          },
        };
      default:
        return {
          icon: <HelpCircle size={24} className="text-emerald-600" />,
          iconBg: "bg-emerald-50",
          confirmBtn: {
            background: "#0D5C45",
            color: "#FFFFFF",
            hover: "#0a4a37",
          },
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ background: "rgba(13,92,69,0.2)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-sm rounded-[24px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200"
        style={{ background: "#FFFFFF", border: "1px solid #D6E8DC" }}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl ${styles.iconBg} flex-shrink-0`}>
              {styles.icon}
            </div>
            <div className="flex-1 pt-1">
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0D5C45", marginBottom: 6 }}>
                {title}
              </h3>
              <p style={{ fontSize: 13, color: "#4A7C65", lineHeight: 1.5 }}>
                {description}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 flex items-center justify-end gap-3" style={{ background: "#F9FAF2", borderTop: "1px solid #D6E8DC" }}>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl transition"
            style={{
              background: "transparent",
              color: "#4A7C65",
              fontSize: 13,
              fontWeight: 600,
              border: "1px solid #C8DDD0",
              cursor: isLoading ? "not-allowed" : "pointer"
            }}
            onMouseEnter={e => { if (!isLoading) e.currentTarget.style.borderColor = "#0D5C45"; }}
            onMouseLeave={e => { if (!isLoading) e.currentTarget.style.borderColor = "#C8DDD0"; }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl transition"
            style={{
              background: styles.confirmBtn.background,
              color: styles.confirmBtn.color,
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              cursor: isLoading ? "not-allowed" : "pointer"
            }}
            onMouseEnter={e => { if (!isLoading) e.currentTarget.style.background = styles.confirmBtn.hover; }}
            onMouseLeave={e => { if (!isLoading) e.currentTarget.style.background = styles.confirmBtn.background; }}
          >
            {isLoading && <Loader2 size={14} className="animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
