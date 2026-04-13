"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { Loader2, Save, RefreshCw, AlertTriangle } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const [webhookUrl, setWebhookUrl] = useState("");
  const [version, setVersion] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settingsData = await api.getSettings();
      setWebhookUrl(settingsData.discord_webhook_url || "");
      const healthData = await api.getHealth();
      setVersion(healthData.version);
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl) {
      setMessage({ text: "Please enter a webhook URL first", type: "error" });
      return;
    }
    setIsTesting(true);
    setMessage(null);
    try {
      await api.testDiscordWebhook();
      setMessage({ text: "Test notification sent successfully!", type: "success" });
    } catch (err: any) {
      setMessage({ text: err.response?.data?.error || "Failed to send test notification", type: "error" });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsSaving(true);
    setMessage(null);
    try {
      await api.updateSettings({ discord_webhook_url: webhookUrl });
      setMessage({ text: "Settings saved successfully!", type: "success" });
    } catch (err: any) {
      setMessage({ text: err.response?.data?.error || "Failed to save settings", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-20" style={{ background: "#F5F0E8" }}>
      <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#0D5C45" }} />
    </div>
  );

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box" as const,
    background: "#F5F0E8",
    border: "1px solid #C8DDD0",
    borderRadius: 10,
    padding: "9px 12px",
    fontSize: 13,
    color: "#0D5C45",
    outline: "none",
  };

  const labelStyle = {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    color: "#4A7C65",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    marginBottom: 6,
  };

  return (
    <div className="px-8 py-10" style={{ background: "#F5F0E8" }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0D5C45", letterSpacing: "-0.01em" }}>
          Settings
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="rounded-2xl overflow-hidden flex flex-col" style={{ background: "#FFFFFF", border: "1px solid #D6E8DC" }}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid #D6E8DC" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#0D5C45" }}>Discord Notifications</p>
          </div>

          <div className="p-5 flex-1 flex flex-col">
            <form onSubmit={handleSave} className="flex flex-col gap-5 flex-1">
              <div>
                <label style={labelStyle}>Discord Webhook URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://discord.com/api/webhooks/..."
                    value={webhookUrl}
                    onChange={e => setWebhookUrl(e.target.value)}
                    disabled={!isAdmin || isSaving}
                    style={{ ...inputStyle, flex: 1 }}
                    onFocus={e => e.target.style.borderColor = "#00C853"}
                    onBlur={e => e.target.style.borderColor = "#C8DDD0"}
                  />
                  {isAdmin && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleTestWebhook}
                        disabled={isTesting || !webhookUrl}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl transition"
                        style={{
                          background: "#F5F0E8",
                          color: "#0D5C45",
                          fontSize: 13,
                          fontWeight: 600,
                          border: "1px solid #C8DDD0",
                          cursor: isTesting ? "not-allowed" : "pointer"
                        }}
                        onMouseEnter={e => !isTesting && (e.currentTarget.style.background = "#EBE5D9")}
                        onMouseLeave={e => !isTesting && (e.currentTarget.style.background = "#F5F0E8")}
                      >
                        {isTesting ? <Loader2 size={14} className="animate-spin" /> : null}
                        Test
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving || !isAdmin}
                        className="flex items-center gap-2 px-6 py-2 rounded-xl transition"
                        style={{
                          background: "#0D5C45",
                          color: "#F5F0E8",
                          fontSize: 13,
                          fontWeight: 600,
                          border: "none",
                          cursor: isSaving ? "not-allowed" : "pointer",
                          whiteSpace: "nowrap"
                        }}
                        onMouseEnter={e => !isSaving && (e.currentTarget.style.background = "#0a4a37")}
                        onMouseLeave={e => !isSaving && (e.currentTarget.style.background = "#0D5C45")}
                      >
                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Save
                      </button>
                    </div>
                  )}
                </div>
                <p style={{ fontSize: 12, color: "#4A7C65", marginTop: 6 }}>
                  Enter your Discord channel webhook URL to receive status alerts.
                </p>
              </div>

              {message && (
                <div style={{
                  fontSize: 13,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: message.type === "success" ? "#DCFCE7" : "#FEE2E2",
                  color: message.type === "success" ? "#166534" : "#991B1B",
                  border: message.type === "success" ? "1px solid #BBF7D0" : "1px solid #FCA5A5"
                }}>
                  {message.text}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* System Info Section */}
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #D6E8DC" }}>
            <div className="px-5 py-4" style={{ borderBottom: "1px solid #D6E8DC" }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#0D5C45" }}>System Information</p>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label style={labelStyle}>API Server URL</label>
                <code style={{ fontSize: 11, color: "#0D5C45", background: "#F5F0E8", padding: "6px 10px", borderRadius: 8, display: "block", fontFamily: "monospace", border: "1px solid #C8DDD0", wordBreak: "break-all" }}>
                  {api.getBaseUrl()}
                </code>
              </div>
              <div>
                <label style={labelStyle}>Application Version</label>
                <div style={{ fontSize: 13, color: "#0D5C45", fontWeight: 700 }}>
                  {version || "Checking..."}
                </div>
              </div>
            </div>
          </div>

          {/* Debug Tools Card */}
          {isAdmin && (
            <DebugCard inputStyle={inputStyle} labelStyle={labelStyle} />
          )}

          {/* Update System Card */}
          {isAdmin && (
            <UpdateCard labelStyle={labelStyle} />
          )}
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({ isOpen, onClose, onConfirm, title, message }: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title: string; 
  message: string; 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Dialog Card */}
      <div 
        className="relative w-full max-w-md rounded-3xl p-6 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200" 
        style={{ background: "#FFFFFF", border: "1px solid #D6E8DC" }}
      >
        <div className="flex gap-4 mb-4">
          <div className="shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#FEE2E2" }}>
            <AlertTriangle size={24} style={{ color: "#DC2626" }} />
          </div>
          <div>
            <p className="mb-1" style={{ fontSize: 18, fontWeight: 700, color: "#0D5C45" }}>{title}</p>
            <p style={{ fontSize: 14, color: "#4A7C65", lineHeight: 1.5 }}>{message}</p>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-7">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl transition"
            style={{ 
              background: "#F5F0E8", 
              color: "#0D5C45", 
              fontSize: 13, 
              fontWeight: 600, 
              border: "1px solid #C8DDD0" 
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#EBE5D9"}
            onMouseLeave={e => e.currentTarget.style.background = "#F5F0E8"}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl transition"
            style={{ 
              background: "#0D5C45", 
              color: "#F5F0E8", 
              fontSize: 13, 
              fontWeight: 600, 
              border: "none" 
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#0a4a37"}
            onMouseLeave={e => e.currentTarget.style.background = "#0D5C45"}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

function UpdateCard({ labelStyle }: { labelStyle: any }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  const handleUpdate = async () => {
    setIsUpdating(true);
    setUpdateMsg({ text: "Update initiated... The application is restarting.", type: "info" });
    
    try {
      await api.updateSystem();
      setTimeout(() => {
        setUpdateMsg({ text: "Service is restarting. Please refresh the page in a few seconds.", type: "success" });
      }, 5000);
    } catch (err: any) {
      if (err.message === "Network Error" || !err.response) {
        setUpdateMsg({ text: "Update in progress... The system is now restarting.", type: "success" });
      } else {
        setUpdateMsg({ text: err.response?.data?.error || "Failed to trigger update", type: "error" });
        setIsUpdating(false);
      }
    }
  };

  return (
    <>
      <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #D6E8DC" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #D6E8DC" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#0D5C45" }}>System Update</p>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <label style={labelStyle}>Maintain Application</label>
              <p style={{ fontSize: 13, color: "#4A7C65" }}>
                Pull the latest version of apiPy directly from GitHub and restart the system service.
              </p>
            </div>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={isUpdating}
              className="flex items-center gap-2 px-6 py-2 rounded-xl transition shrink-0"
              style={{
                background: "#0D5C45",
                color: "#F5F0E8",
                fontSize: 13,
                fontWeight: 600,
                border: "none",
                cursor: isUpdating ? "not-allowed" : "pointer"
              }}
              onMouseEnter={e => !isUpdating && (e.currentTarget.style.background = "#0a4a37")}
              onMouseLeave={e => !isUpdating && (e.currentTarget.style.background = "#0D5C45")}
            >
              {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              {isUpdating ? "Updating..." : "Update Now"}
            </button>
          </div>

          {updateMsg && (
            <div style={{
              fontSize: 13,
              marginTop: 15,
              padding: "10px 12px",
              borderRadius: 10,
              background: updateMsg.type === "success" ? "#DCFCE7" : updateMsg.type === "info" ? "#DBEAFE" : "#FEE2E2",
              color: updateMsg.type === "success" ? "#166534" : updateMsg.type === "info" ? "#1E40AF" : "#991B1B",
              border: updateMsg.type === "success" ? "1px solid #BBF7D0" : updateMsg.type === "info" ? "1px solid #BFDBFE" : "1px solid #FCA5A5"
            }}>
              {updateMsg.text}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog 
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleUpdate}
        title="Confirm System Update"
        message="This will download the latest version from GitHub and restart the service. You will be disconnected for a few moments. Continue?"
      />
    </>
  );
}

function DebugCard({ inputStyle, labelStyle }: { inputStyle: any; labelStyle: any }) {
  const [port, setPort] = useState("");
  const [isKilling, setIsKilling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [debugMsg, setDebugMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleKillPort = async () => {
    setIsKilling(true);
    setDebugMsg(null);
    try {
      await api.killProcessByPort(Number(port));
      setDebugMsg({ text: `Process on port ${port} killed successfully!`, type: "success" });
      setPort("");
    } catch (err: any) {
      setDebugMsg({ text: err.response?.data?.error || "Failed to kill process", type: "error" });
    } finally {
      setIsKilling(false);
    }
  };

  const onBtnClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!port || isNaN(Number(port))) {
      setDebugMsg({ text: "Please enter a valid port number", type: "error" });
      return;
    }
    setShowConfirm(true);
  };

  return (
    <>
      <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #D6E8DC" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #D6E8DC" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#0D5C45" }}>Debug Tools</p>
        </div>
        <div className="p-5">
          <form onSubmit={onBtnClick} className="flex flex-col gap-5">
            <div>
              <label style={labelStyle}>Kill Process by Port</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. 8080"
                  value={port}
                  onChange={e => setPort(e.target.value)}
                  disabled={isKilling}
                  style={{ ...inputStyle, flex: 1 }}
                  onFocus={e => e.target.style.borderColor = "#00C853"}
                  onBlur={e => e.target.style.borderColor = "#C8DDD0"}
                />
                <button
                  type="submit"
                  disabled={isKilling}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl transition"
                  style={{
                    background: "#0D5C45",
                    color: "#F5F0E8",
                    fontSize: 13,
                    fontWeight: 600,
                    border: "none",
                    cursor: isKilling ? "not-allowed" : "pointer"
                  }}
                  onMouseEnter={e => !isKilling && (e.currentTarget.style.background = "#0a4a37")}
                  onMouseLeave={e => !isKilling && (e.currentTarget.style.background = "#0D5C45")}
                >
                  {isKilling ? <Loader2 size={14} className="animate-spin" /> : "Kill Port"}
                </button>
              </div>
              <p style={{ fontSize: 12, color: "#4A7C65", marginTop: 8 }}>
                Force-terminate any process using this port. Use with caution.
              </p>
            </div>

            {debugMsg && (
              <div style={{
                fontSize: 13,
                padding: "10px 12px",
                borderRadius: 10,
                background: debugMsg.type === "success" ? "#DCFCE7" : "#FEE2E2",
                color: debugMsg.type === "success" ? "#166534" : "#991B1B",
                border: debugMsg.type === "success" ? "1px solid #BBF7D0" : "1px solid #FCA5A5"
              }}>
                {debugMsg.text}
              </div>
            )}
          </form>
        </div>
      </div>

      <ConfirmDialog 
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleKillPort}
        title="Kill Process"
        message={`Are you sure you want to absolute kill the process on port ${port}? This action cannot be undone.`}
      />
    </>
  );
}