import axios, { AxiosInstance } from "axios";
import type {
  AuthResponse,
  ProcessState,
  Script,
  ScriptLog,
  Settings,
  User,
} from "@/types";

const isProd = process.env.NODE_ENV === "production";
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (isProd ? "/api" : "http://localhost:8080/api");

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  getBaseUrl() {
    return API_BASE_URL;
  }

  // Health check
  async getHealth() {
    const response = await this.client.get<{
      status: string;
      message: string;
      version: string;
      setup_needed: boolean;
    }>("/health");
    return response.data;
  }

  // Auth endpoints
  async setup(username: string, email: string, password: string) {
    const response = await this.client.post<AuthResponse>("/setup", {
      username,
      email,
      password,
    });
    return response.data;
  }

  async login(username: string, password: string) {
    const response = await this.client.post<AuthResponse>("/auth/login", {
      username,
      password,
    });
    return response.data;
  }

  async logout() {
    return this.client.post("/auth/logout");
  }

  async getMe() {
    const response = await this.client.get<User>("/auth/me");
    return response.data;
  }

  // Scripts endpoints
  async getScripts() {
    const response = await this.client.get<Script[]>("/scripts");
    return response.data;
  }

  async getScript(id: string) {
    const response = await this.client.get<Script>(`/scripts/${id}`);
    return response.data;
  }

  async createScript(
    name: string,
    path: string,
    description?: string,
    startOnBoot?: boolean,
    autoRestart?: boolean
  ) {
    const response = await this.client.post<Script>("/scripts", {
      name,
      path,
      description,
      start_on_boot: startOnBoot,
      auto_restart: autoRestart,
    });
    return response.data;
  }

  async updateScript(id: string, updates: Partial<Script>) {
    const response = await this.client.put<Script>(`/scripts/${id}`, updates);
    return response.data;
  }

  async deleteScript(id: string) {
    return this.client.delete(`/scripts/${id}`);
  }

  async duplicateScript(id: string) {
    const response = await this.client.post<Script>(
      `/scripts/${id}/duplicate`
    );
    return response.data;
  }

  // Script file endpoints
  async getScriptFile(id: string) {
    const response = await this.client.get<{
      id: string;
      name: string;
      path: string;
      content: string;
    }>(`/scripts/${id}/file`);
    return response.data;
  }

  async updateScriptFile(id: string, content: string) {
    return this.client.put(`/scripts/${id}/file`, { content });
  }

  // Script execution endpoints
  async startScript(id: string) {
    const response = await this.client.post(`/scripts/${id}/start`);
    return response.data;
  }

  async stopScript(id: string) {
    const response = await this.client.post(`/scripts/${id}/stop`);
    return response.data;
  }

  async restartScript(id: string) {
    const response = await this.client.post(`/scripts/${id}/restart`);
    return response.data;
  }

  async reinstallDependencies(id: string) {
    const response = await this.client.post(`/scripts/${id}/reinstall`);
    return response.data;
  }

  async bulkStartScripts(ids: string[]) {
    const response = await this.client.post("/scripts/bulk/start", { ids });
    return response.data;
  }

  async bulkStopScripts(ids: string[]) {
    const response = await this.client.post("/scripts/bulk/stop", { ids });
    return response.data;
  }

  async getSettings() {
    const response = await this.client.get<Settings>("/settings");
    return response.data;
  }

  async updateSettings(data: { discord_webhook_url: string }) {
    const response = await this.client.post<Settings>("/settings", data);
    return response.data;
  }

  async testDiscordWebhook() {
    const response = await this.client.post("/settings/test-webhook");
    return response.data;
  }

  async updateSystem() {
    const response = await this.client.post("/settings/update");
    return response.data;
  }

  async getScriptStatus(id: string) {
    const response = await this.client.get<ProcessState>(
      `/scripts/${id}/status`
    );
    return response.data;
  }

  async getAllScriptsStatus() {
    const response = await this.client.get<Record<string, ProcessState>>(
      "/scripts/status"
    );
    return response.data;
  }

  // Logs endpoints
  async getLogs(id: string, limit: number = 1000) {
    const response = await this.client.get<ScriptLog[]>(`/scripts/${id}/logs`, {
      params: { limit },
    });
    return response.data;
  }

  async deleteLogs(id: string) {
    return this.client.delete(`/scripts/${id}/logs`);
  }

  async downloadLogs(id: string) {
    const response = await this.client.get(`/scripts/${id}/logs/download`, {
      responseType: "blob",
    });
    return response.data;
  }

  // Users endpoints
  async getUsers() {
    const response = await this.client.get<User[]>("/users");
    return response.data;
  }

  async createUser(username: string, email: string, password: string, role: string) {
    const response = await this.client.post<User>("/users", {
      username,
      email,
      password,
      role,
    });
    return response.data;
  }

  async deleteUser(id: string) {
    return this.client.delete(`/users/${id}`);
  }

  async getUser(id: string) {
    const response = await this.client.get<User>(`/users/${id}`);
    return response.data;
  }

  // Script upload endpoints
  async uploadScript(file: File, name: string, description?: string, requirements?: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", name);
    if (description) {
      formData.append("description", description);
    }
    if (requirements) {
      formData.append("requirements", requirements);
    }

    const response = await this.client.post<Script>("/scripts/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }

  // Debug tools
  async killProcessByPort(port: number) {
    await this.client.post("/settings/debug/kill-port", { port });
  }
}

export const api = new APIClient();
