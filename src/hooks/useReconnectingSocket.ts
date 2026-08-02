import { useEffect, useRef, useState, useCallback } from "react";

export type SocketStatus = "connecting" | "open" | "reconnecting" | "closed";

const HEARTBEAT_INTERVAL_MS = 15_000;
const HEARTBEAT_TIMEOUT_MS = 5_000;
const MAX_BACKOFF_MS = 30_000;
const BASE_BACKOFF_MS = 1_000;

/** Exponential backoff with ±20% jitter, capped — jitter keeps many tabs
 * reconnecting after a shared outage from all retrying in lockstep. */
function backoffDelay(attempt: number): number {
  const raw = Math.min(BASE_BACKOFF_MS * 2 ** attempt, MAX_BACKOFF_MS);
  const jitter = raw * 0.2 * (Math.random() * 2 - 1);
  return Math.round(raw + jitter);
}

/**
 * A WebSocket that reconnects itself.
 *
 * - Exponential backoff (capped at 30s, jittered) on any non-intentional close.
 * - Application-level heartbeat: sends {type:"ping"} every 15s and expects
 *   {type:"pong"} back within 5s. The browser's native WebSocket has no
 *   JS-visible ping/pong of its own, so without this the client has no way
 *   to notice a connection that's dead at the network level but hasn't
 *   fired a 'close' event yet (e.g. the server vanished mid-session) — this
 *   catches that and forces a reconnect instead of sitting silently stuck.
 * - Closes and stops retrying on unmount.
 *
 * `url`/`protocols` re-running the effect (e.g. the auth token changing)
 * tears down the old socket and opens a fresh one; pass `null` for `url` to
 * stay disconnected (e.g. while logged out).
 */
export function useReconnectingSocket(
  url: string | null,
  protocols: string[] | undefined,
  onMessage: (data: unknown) => void
) {
  const [status, setStatus] = useState<SocketStatus>("closed");
  const socketRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  const attemptRef = useRef(0);
  const intentionalCloseRef = useRef(false);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const clearHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    if (heartbeatTimeoutRef.current) clearTimeout(heartbeatTimeoutRef.current);
    heartbeatTimerRef.current = null;
    heartbeatTimeoutRef.current = null;
  }, []);

  useEffect(() => {
    if (!url) {
      setStatus("closed");
      return undefined;
    }

    intentionalCloseRef.current = false;

    function connect() {
      setStatus(attemptRef.current === 0 ? "connecting" : "reconnecting");
      const socket = protocols && protocols.length > 0 ? new WebSocket(url!, protocols) : new WebSocket(url!);
      socketRef.current = socket;

      socket.onopen = () => {
        attemptRef.current = 0;
        setStatus("open");

        clearHeartbeat();
        heartbeatTimerRef.current = setInterval(() => {
          if (socket.readyState !== WebSocket.OPEN) return;
          socket.send(JSON.stringify({ type: "ping" }));
          heartbeatTimeoutRef.current = setTimeout(() => {
            // No pong in time — the connection is dead even though 'close'
            // hasn't fired. Force it closed; onclose below picks up the
            // reconnect from there.
            socket.close();
          }, HEARTBEAT_TIMEOUT_MS);
        }, HEARTBEAT_INTERVAL_MS);
      };

      socket.onmessage = (event) => {
        let data: unknown;
        try {
          data = JSON.parse(event.data);
        } catch {
          return;
        }
        if ((data as { type?: string })?.type === "pong") {
          if (heartbeatTimeoutRef.current) clearTimeout(heartbeatTimeoutRef.current);
          return;
        }
        onMessageRef.current(data);
      };

      socket.onerror = () => {
        // Intentionally no-op beyond logging — 'close' always follows an
        // 'error' for a WebSocket, so the actual reconnect decision lives
        // in onclose to avoid double-scheduling a retry from both handlers.
        console.warn("WebSocket error");
      };

      socket.onclose = () => {
        clearHeartbeat();
        if (intentionalCloseRef.current) {
          setStatus("closed");
          return;
        }
        setStatus("reconnecting");
        const delay = backoffDelay(attemptRef.current);
        attemptRef.current += 1;
        reconnectTimerRef.current = setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      intentionalCloseRef.current = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      clearHeartbeat();
      socketRef.current?.close();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, protocols?.join(",")]);

  const send = useCallback((data: unknown) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify(data));
    return true;
  }, []);

  return { status, send };
}
