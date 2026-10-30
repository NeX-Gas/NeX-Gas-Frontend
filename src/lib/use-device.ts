"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyMessage,
  DEVICE_API_URL,
  DEVICE_WS_URL,
  isDemoMode,
  type DeviceMessage,
} from "@/lib/device";
import { computeNext, initialSystem } from "@/lib/system";
import type {
  DeviceCommand,
  DeviceLink,
  FirmwareEvent,
  SystemState,
} from "@/lib/types";

const DEMO_TICK_MS = 2500;
const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 15_000;
/** Alat dianggap offline kalau tidak ada data selama ini. */
const STALE_AFTER_MS = 20_000;
const WATCHDOG_TICK_MS = 5_000;

export type DeviceClient = {
  state: SystemState;
  link: DeviceLink;
  lastError: string | null;
  /** Kirim perintah ke topik `.../cmd` (via WebSocket backend). */
  sendCommand: (command: DeviceCommand) => boolean;
  /** Update optimistis; data dari alat akan menimpanya lagi. */
  patch: (updater: (prev: SystemState) => SystemState) => void;
};

/**
 * Satu-satunya pintu masuk data alat.
 *
 * - `NEXT_PUBLIC_DEVICE_WS_URL` kosong  -> mode demo, jalankan simulator.
 * - diisi (mis. `wss://api.domain.id/ws`) -> data asli dari backend.
 *
 * Backend cukup meneruskan pesan MQTT sebagai JSON:
 *   {"type":"telemetry","payload":{...}}  dari nexgas/<id>/telemetry
 *   {"type":"state","payload":{...}}      dari nexgas/<id>/state
 *   {"type":"event","payload":{...}}      dari nexgas/<id>/event
 *   {"type":"status","payload":"online"}  dari nexgas/<id>/status
 *   {"type":"snapshot","payload":{...}}   opsional, saat klien baru connect
 */
export function useDevice(
  onEvent?: (event: FirmwareEvent) => void,
): DeviceClient {
  const [state, setState] = useState<SystemState>(initialSystem);
  const [link, setLink] = useState<DeviceLink>(
    isDemoMode ? "demo" : "connecting",
  );
  const [lastError, setLastError] = useState<string | null>(null);
  const onEventRef = useRef(onEvent);
  const socketRef = useRef<WebSocket | null>(null);
  const stateRef = useRef(state);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const applyIncoming = useCallback((message: DeviceMessage) => {
    if (message.type === "event") onEventRef.current?.(message.payload);
    setState((prev) => applyMessage(prev, message).state);
  }, []);

  // ---- mode demo: simulator lokal, perilaku UI tetap sama ----
  useEffect(() => {
    if (!isDemoMode) return;
    const id = setInterval(() => {
      setState((prev) => computeNext(prev));
    }, DEMO_TICK_MS);
    return () => clearInterval(id);
  }, []);

  // ---- mode live: WebSocket ke backend ----
  useEffect(() => {
    if (isDemoMode) return;

    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;

    const connect = () => {
      if (cancelled) return;
      setLink((prev) => (prev === "live" ? prev : "connecting"));

      let socket: WebSocket;
      try {
        socket = new WebSocket(DEVICE_WS_URL);
      } catch (error) {
        setLastError(error instanceof Error ? error.message : "URL tidak valid");
        setLink("offline");
        return;
      }
      socketRef.current = socket;

      socket.onopen = () => {
        if (cancelled) return;
        attempt = 0;
        setLink("live");
        setLastError(null);
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data as string) as DeviceMessage;
          if (!parsed || typeof parsed !== "object" || !("type" in parsed)) {
            return;
          }
          applyIncoming(parsed);
        } catch {
          setLastError("Payload backend bukan JSON yang valid");
        }
      };

      socket.onerror = () => {
        if (!cancelled) setLastError("Koneksi ke backend gagal");
      };

      socket.onclose = () => {
        if (cancelled) return;
        socketRef.current = null;
        setLink("offline");
        attempt += 1;
        const delay = Math.min(
          RECONNECT_BASE_MS * 2 ** Math.min(attempt, 5),
          RECONNECT_MAX_MS,
        );
        reconnectTimer = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [applyIncoming]);

  // ---- watchdog: tandai alat offline kalau data berhenti ----
  useEffect(() => {
    if (isDemoMode) return;
    const id = setInterval(() => {
      const { lastSeen } = stateRef.current;
      if (lastSeen && Date.now() - lastSeen > STALE_AFTER_MS) {
        setState((prev) =>
          prev.deviceOnline ? { ...prev, deviceOnline: false } : prev,
        );
      }
    }, WATCHDOG_TICK_MS);
    return () => clearInterval(id);
  }, []);

  const patch = useCallback((updater: (prev: SystemState) => SystemState) => {
    setState((prev) => updater(prev));
  }, []);

  const sendCommand = useCallback((command: DeviceCommand) => {
    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({ type: "command", payload: command } satisfies {
          type: "command";
          payload: DeviceCommand;
        }),
      );
      return true;
    }
    // Fallback REST kalau backend menyediakan endpoint perintah.
    if (DEVICE_API_URL) {
      void fetch(`${DEVICE_API_URL.replace(/\/$/, "")}/commands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      }).catch(() => setLastError("Gagal mengirim perintah ke backend"));
      return true;
    }
    return false;
  }, []);

  return { state, link, lastError, sendCommand, patch };
}
