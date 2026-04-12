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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #D6E8DC" }}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid #D6E8DC" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#0D5C45" }}>Discord Notifications</p>
          </div>
          
          <div className="p-5">
            <form onSubmit={handleSave} className="flex flex-col gap-5">
              <div>
                <label style={labelStyle}>Discord Webhook URL</label>
                <input
                  type="url"
                  placeholder="https://discord.com/api/webhooks/..."
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                  disabled={!isAdmin || isSaving}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "#00C853"}
                  onBlur={e => e.target.style.borderColor = "#C8DDD0"}
                />
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

              {isAdmin && (
                <button
                  type="submit"
                  disabled={isSaving || !isAdmin}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl transition self-start"
                  style={{ 
                    background: "#0D5C45", 
                    color: "#F5F0E8", 
                    fontSize: 13, 
                    fontWeight: 600, 
                    border: "none", 
                    cursor: isSaving ? "not-allowed" : "pointer" 
                  }}
                  onMouseEnter={e => !isSaving && (e.currentTarget.style.background = "#0a4a37")}
                  onMouseLeave={e => !isSaving && (e.currentTarget.style.background = "#0D5C45")}
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Save Settings
                </button>
              )}
            </form>
          </div>
        </div>

        {/* System Info Section */}
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
      </div>
    </div>
  );
}