"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { Loader2, Save } from "lucide-react";

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
                    type="url"
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
        </div>
      </div>
    </div>
  );
}

function DebugCard({ inputStyle, labelStyle }: { inputStyle: any; labelStyle: any }) {
  const [port, setPort] = useState("");
  const [isKilling, setIsKilling] = useState(false);
  const [debugMsg, setDebugMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleKillPort = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!port || isNaN(Number(port))) {
      setDebugMsg({ text: "Please enter a valid port number", type: "error" });
      return;
    }

    if (!confirm(`Are you sure you want to kill the process on port ${port}?`)) return;

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

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #D6E8DC" }}>
      <div className="px-5 py-4" style={{ borderBottom: "1px solid #D6E8DC" }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#0D5C45" }}>Debug Tools</p>
      </div>
      <div className="p-5">
        <form onSubmit={handleKillPort} className="flex flex-col gap-5">
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
  );
}