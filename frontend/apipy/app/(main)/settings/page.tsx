"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { 
  IconLoader2, 
  IconDeviceFloppy, 
  IconRefresh, 
  IconAlertTriangle, 
  IconSettings, 
  IconBell, 
  IconShield, 
  IconTerminal, 
  IconActivity,
  IconCheck,
  IconX,
  IconCircleCheck,
  IconInfoCircle
} from "@tabler/icons-react";
import { ConfirmationDialog } from "@/components/confirmation-dialog";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const [webhookUrl, setWebhookUrl] = useState("");
  const [corsDomain, setCorsDomain] = useState("");
  const [oidcEnabled, setOidcEnabled] = useState(false);
  const [oidcIssuer, setOidcIssuer] = useState("");
  const [oidcClientID, setOidcClientID] = useState("");
  const [oidcClientSecret, setOidcClientSecret] = useState("");
  const [oidcRedirectURL, setOidcRedirectURL] = useState("");
  const [version, setVersion] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [activeTab, setActiveTab] = useState("system");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settingsData = await api.getSettings();
      setWebhookUrl(settingsData.discord_webhook_url || "");
      setCorsDomain(settingsData.cors_domain || "");
      setOidcEnabled(settingsData.oidc_enabled || false);
      setOidcIssuer(settingsData.oidc_issuer || "");
      setOidcClientID(settingsData.oidc_client_id || "");
      setOidcClientSecret(settingsData.oidc_client_secret || "");
      setOidcRedirectURL(settingsData.oidc_redirect_url || "");
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

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isAdmin) return;
    setIsSaving(true);
    setMessage(null);
    try {
      await api.updateSettings({ 
        discord_webhook_url: webhookUrl,
        cors_domain: corsDomain,
        oidc_enabled: oidcEnabled,
        oidc_issuer: oidcIssuer,
        oidc_client_id: oidcClientID,
        oidc_client_secret: oidcClientSecret,
        oidc_redirect_url: oidcRedirectURL
      });
      setMessage({ text: "Settings saved successfully!", type: "success" });
    } catch (err: any) {
      setMessage({ text: err.response?.data?.error || "Failed to save settings", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="container-xl py-5 text-center">
      <IconLoader2 className="animate-spin text-secondary mb-2" size={24} />
      <div className="text-secondary small">Loading settings...</div>
    </div>
  );

  const allTabs = [
    { id: "system", label: "System", icon: IconActivity, adminOnly: false },
    { id: "notifications", label: "Notifications", icon: IconBell, adminOnly: true },
    { id: "auth", label: "Authentication", icon: IconShield, adminOnly: true },
    { id: "tools", label: "Tools", icon: IconTerminal, adminOnly: true },
  ] as const;

  const tabs = allTabs.filter(tab => !tab.adminOnly || isAdmin);

  return (
    <div className="container-xl">
      <div className="page-header d-print-none mb-4">
        <div className="row align-items-center">
          <div className="col">
            <h2 className="page-title fw-bold tracking-tight">
              Settings
            </h2>
            <div className="text-secondary mt-1">Manage your application preferences and system configuration.</div>
          </div>
        </div>
      </div>

      {message && (
        <div className={`alert alert-${message.type === 'error' ? 'danger' : message.type} alert-dismissible`} role="alert">
          <div className="d-flex">
            <div>
              {message.type === 'success' ? <IconCircleCheck className="me-2" /> : message.type === 'info' ? <IconInfoCircle className="me-2" /> : <IconAlertTriangle className="me-2" />}
            </div>
            <div>{message.text}</div>
          </div>
          <button type="button" className="btn-close" onClick={() => setMessage(null)} aria-label="Close"></button>
        </div>
      )}

      <div className="row g-4">
        <div className="col-12 col-md-3">
          <div className="list-group list-group-transparent">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`list-group-item list-group-item-action d-flex align-items-center mb-1 rounded-2 ${activeTab === tab.id ? 'active fw-bold bg-primary-lt text-primary border-primary' : 'border-0'}`}
              >
                <tab.icon size={18} className="me-3" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="col-12 col-md-9">
          <div className="tab-content">
            {activeTab === "system" && (
              <div className="space-y-3">
                <div className="card card-premium shadow-sm">
                  <div className="card-header">
                    <h3 className="card-title">System Information</h3>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label text-uppercase tracking-wider fs-6 fw-bold text-secondary">API Server URL</label>
                        <input type="text" className="form-control" value={api.getBaseUrl()} readOnly />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label text-uppercase tracking-wider fs-6 fw-bold text-secondary">App Version</label>
                        <div className="d-flex align-items-baseline gap-2">
                          <span className="h1 mb-0">{version || "..." }</span>
                          <span className="badge bg-green-lt">stable</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="card card-premium shadow-sm mt-3">
                    <div className="card-header">
                      <h3 className="card-title">CORS / Reverse Proxy</h3>
                    </div>
                    <div className="card-body">
                      <form onSubmit={handleSave}>
                        <div className="mb-3">
                          <label className="form-label text-uppercase tracking-wider fs-6 fw-bold text-secondary">Allowed Origin Domain</label>
                          <div className="input-group">
                            <input
                              type="text"
                              className="form-control font-monospace"
                              placeholder="https://pyrunner.example.com"
                              value={corsDomain}
                              onChange={e => setCorsDomain(e.target.value)}
                              disabled={isSaving}
                            />
                            <button className="btn btn-primary" type="submit" disabled={isSaving}>
                              {isSaving ? <IconLoader2 size={16} className="animate-spin" /> : <IconDeviceFloppy size={16} />}
                              <span className="ms-2">Save</span>
                            </button>
                          </div>
                          <div className="form-hint mt-2">
                            If you access PyRunner through a reverse proxy, enter your public URL here.
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {isAdmin && <UpdateCard />}
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="card card-premium shadow-sm">
                <div className="card-header">
                  <h3 className="card-title">Discord Notifications</h3>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSave}>
                    <div className="mb-3">
                      <label className="form-label text-uppercase tracking-wider fs-6 fw-bold text-secondary">Discord Webhook URL</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="https://discord.com/api/webhooks/..."
                        value={webhookUrl}
                        onChange={e => setWebhookUrl(e.target.value)}
                        disabled={isSaving}
                      />
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        onClick={handleTestWebhook}
                        disabled={isTesting || !webhookUrl}
                        className="btn btn-white"
                      >
                        {isTesting && <IconLoader2 size={16} className="me-2 animate-spin" />}
                        Test Notification
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={isSaving}>
                        {isSaving ? <IconLoader2 size={16} className="animate-spin" /> : <IconDeviceFloppy size={16} />}
                        <span className="ms-2">Save Settings</span>
                      </button>
                    </div>
                    <div className="form-hint mt-2">
                      Notifications are sent when a script enters an error state or crashes.
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeTab === "auth" && (
              <div className="card card-premium shadow-sm">
                <div className="card-header">
                  <h3 className="card-title">OpenID Connect (OIDC)</h3>
                  <div className="card-actions">
                    <label className="form-check form-switch mb-0">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        checked={oidcEnabled}
                        onChange={(e) => setOidcEnabled(e.target.checked)}
                        disabled={isSaving}
                      />
                    </label>
                  </div>
                </div>
                <div className="card-body">
                  {!oidcEnabled ? (
                    <div className="text-secondary text-center py-4">
                      OIDC authentication is currently disabled.
                    </div>
                  ) : (
                    <form onSubmit={handleSave} className="space-y-3">
                      <div className="mb-3">
                        <label className="form-label text-uppercase tracking-wider fs-6 fw-bold text-secondary">Issuer URL</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="https://accounts.google.com"
                          value={oidcIssuer}
                          onChange={e => setOidcIssuer(e.target.value)}
                        />
                      </div>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label text-uppercase tracking-wider fs-6 fw-bold text-secondary">Client ID</label>
                          <input
                            type="text"
                            className="form-control"
                            value={oidcClientID}
                            onChange={e => setOidcClientID(e.target.value)}
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label text-uppercase tracking-wider fs-6 fw-bold text-secondary">Client Secret</label>
                          <input
                            type="password"
                            className="form-control"
                            value={oidcClientSecret}
                            onChange={e => setOidcClientSecret(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label text-uppercase tracking-wider fs-6 fw-bold text-secondary">Redirect URL</label>
                        <input
                          type="text"
                          className="form-control"
                          value={oidcRedirectURL}
                          onChange={e => setOidcRedirectURL(e.target.value)}
                        />
                      </div>
                      <button type="submit" className="btn btn-primary" disabled={isSaving}>
                        {isSaving ? <IconLoader2 size={16} className="animate-spin" /> : <IconDeviceFloppy size={16} />}
                        <span className="ms-2">Save Auth Configuration</span>
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {activeTab === "tools" && (
              <div className="space-y-3">
                <DebugCard />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function UpdateCard() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  const handleUpdate = async () => {
    setShowConfirm(false);
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
      <div className="card card-premium shadow-sm mt-3">
        <div className="card-header border-bottom-0 pb-0">
          <h3 className="card-title">System Update</h3>
        </div>
        <div className="card-body py-4">
          <div className="row align-items-center g-3">
            <div className="col">
              <p className="text-muted mb-0">
                Pull the latest version of apiPy directly from GitHub and restart the system service.
              </p>
            </div>
            <div className="col-md-auto">
              <button
                onClick={() => setShowConfirm(true)}
                disabled={isUpdating}
                className="btn btn-primary d-flex align-items-center"
              >
                {isUpdating ? <IconLoader2 size={18} className="me-2 animate-spin" /> : <IconRefresh size={18} className="me-2" />}
                <span className="fw-bold">{isUpdating ? "Updating..." : "Update Now"}</span>
              </button>
            </div>
          </div>

          {updateMsg && (
            <div className={`alert alert-${updateMsg.type === 'error' ? 'danger' : updateMsg.type} mt-4 mb-0`} role="alert">
              <div className="d-flex align-items-center">
                {updateMsg.type === 'success' ? <IconCircleCheck className="me-2" /> : updateMsg.type === 'error' ? <IconX className="me-2" /> : <IconInfoCircle className="me-2" />}
                <div>{updateMsg.text}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmationDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleUpdate}
        title="Confirm System Update"
        description="This will download the latest version from GitHub and restart the service. You will be disconnected for a few moments. Continue?"
        confirmText="Update Now"
        variant="warning"
      />
    </>
  );
}

function DebugCard() {
  const [port, setPort] = useState("");
  const [isKilling, setIsKilling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [debugMsg, setDebugMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleKillPort = async () => {
    setShowConfirm(false);
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
    <>
      <div className="card card-premium shadow-sm">
        <div className="card-header">
          <h3 className="card-title">Debug Tools</h3>
        </div>
        <div className="card-body">
          <label className="form-label">Kill Process by Port</label>
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="e.g. 8080"
              value={port}
              onChange={e => setPort(e.target.value)}
              disabled={isKilling}
            />
            <button
              onClick={() => {
                if (!port || isNaN(Number(port))) return;
                setShowConfirm(true);
              }}
              disabled={isKilling || !port}
              className="btn btn-outline-danger"
            >
              {isKilling ? <IconLoader2 size={16} className="animate-spin" /> : "Kill Port"}
            </button>
          </div>
          <div className="form-hint mt-2 text-danger">
            Force-terminate any process using this port. Use with caution.
          </div>

          {debugMsg && (
            <div className={`alert alert-${debugMsg.type === 'error' ? 'danger' : 'success'} mt-3 mb-0`} role="alert">
              {debugMsg.text}
            </div>
          )}
        </div>
      </div>

      <ConfirmationDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleKillPort}
        title="Kill Process"
        description={`Are you sure you want to absolute kill the process on port ${port}? This action cannot be undone.`}
        confirmText="Confirm Kill"
        variant="danger"
      />
    </>
  );
}
