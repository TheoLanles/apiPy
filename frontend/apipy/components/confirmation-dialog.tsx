"use client";

import React from "react";
import { 
  IconX, 
  IconAlertTriangle, 
  IconTrash, 
  IconHelpCircle, 
  IconLoader2 
} from "@tabler/icons-react";

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

  const getVariantConfig = () => {
    switch (variant) {
      case "danger":
        return {
          icon: <IconTrash size={32} className="text-danger" />,
          buttonClass: "btn-danger",
        };
      case "warning":
        return {
          icon: <IconAlertTriangle size={32} className="text-warning" />,
          buttonClass: "btn-warning",
        };
      default:
        return {
          icon: <IconHelpCircle size={32} className="text-primary" />,
          buttonClass: "btn-primary",
        };
    }
  };

  const config = getVariantConfig();

  return (
    <div className="modal modal-blur fade show d-block" tabIndex={-1} role="dialog" aria-modal="true" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-sm modal-dialog-centered" role="document">
        <div className="modal-content">
          <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
          <div className="modal-status bg-danger"></div>
          <div className="modal-body text-center py-4">
            {config.icon}
            <h3 className="mt-3">{title}</h3>
            <div className="text-secondary">{description}</div>
          </div>
          <div className="modal-footer">
            <div className="w-100">
              <div className="row">
                <div className="col">
                  <button 
                    className="btn w-100" 
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    {cancelText}
                  </button>
                </div>
                <div className="col">
                  <button 
                    className={`btn ${config.buttonClass} w-100`} 
                    onClick={onConfirm}
                    disabled={isLoading}
                  >
                    {isLoading && <IconLoader2 className="me-2 animate-spin" size={16} />}
                    {confirmText}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
