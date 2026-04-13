"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import type { ScriptLog } from "@/types";

interface UseScriptWebSocketOptions {
  scriptId: string | null;
  enabled: boolean;
  onLog: (log: ScriptLog) => void;
}

/**
 * Hook to connect to the authenticated WebSocket for real-time script logs.
 * 
 * Authentication is handled two ways:
 * - The browser automatically sends the HttpOnly `auth_token` cookie with the WS handshake
 * - If a token is available in the Zustand store, it's also sent as a ?token= query param (fallback)
 * 
 * Falls back to HTTP polling if the WebSocket connection fails.
 */
export function useScriptWebSocket({ scriptId, enabled, onLog }: UseScriptWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  const connect = useCallback(() => {
    if (!scriptId || !enabled) return;

    // Need at least a user (authenticated via cookie) or a token
    if (!user && !token) return;

    // Build the WebSocket URL
    const isProd = process.env.NODE_ENV === "production";
    const wsBase = isProd
      ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}`
      : "ws://localhost:8080";

    // Add token as query param if available (otherwise the HttpOnly cookie handles auth)
    let wsUrl = `${wsBase}/ws/scripts/${scriptId}/logs`;
    if (token) {
      wsUrl += `?token=${encodeURIComponent(token)}`;
    }

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "log") {
            onLog({
              id: data.id,
              script_id: scriptId,
              line: data.line,
              level: data.level,
              created_at: data.created_at,
            });
          }
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;

        // Reconnect after 3 seconds if still enabled
        if (enabled) {
          reconnectTimeout.current = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => {
        // onclose will fire after onerror, triggering reconnect
        ws.close();
      };
    } catch {
      // WebSocket constructor failed
      setIsConnected(false);
    }
  }, [scriptId, enabled, token, user, onLog]);

  // Connect/disconnect lifecycle
  useEffect(() => {
    if (enabled && scriptId && (user || token)) {
      connect();
    }

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
    };
  }, [scriptId, enabled, token, user, connect]);

  return { isConnected };
}
