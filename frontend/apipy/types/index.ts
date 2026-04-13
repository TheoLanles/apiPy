export interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "user";
  created_at?: string;
}

export interface Script {
  id: string;
  name: string;
  path: string;
  description: string;
  created_by: string;
  start_on_boot: boolean;
  auto_restart: boolean;
  has_requirements?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScriptLog {
  id: string;
  script_id: string;
  line: string;
  level: "INFO" | "WARNING" | "ERROR";
  created_at: string;
}

export interface ProcessState {
  id: string;
  script_id: string;
  pid: number;
  status: "running" | "stopped" | "error" | "crashed";
  started_at?: string;
  stopped_at?: string;
  updated_at: string;
}

export interface AuthResponse {
  id: string;
  username: string;
  email: string;
  role: string;
  token: string;
}

export interface Settings {
  id: string;
  discord_webhook_url: string;
  cors_domain: string;
  oidc_enabled: boolean;
  oidc_issuer: string;
  oidc_client_id: string;
  oidc_client_secret: string;
  oidc_redirect_url: string;
}
