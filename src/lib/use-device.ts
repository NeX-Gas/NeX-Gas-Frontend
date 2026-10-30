"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyMessage,
  DEVICE_WS_URL,
  isDemoMode,
  messagesFromSnapshot,
  parseBackendMessage,
  type DeviceMessage,
} from "@/lib/device";
import {
  ApiError,
  fetchSnapshot,
  getSession,
  isApiConfigured,
  postCommand,
  subscribeAuth,
} from "@/lib/api";
import { computeNext, initialSystem } from "@/lib/system";
import type {
  AppNotification,
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
/** Gateway backend mem-ping tiap 30s; klien kirim ping supaya koneksi tidak diputus. */
const PING_INTERVAL_MS = 25_000;

export type DeviceClient = {
  state: SystemState;
  link: DeviceLink;
  lastError: string | null;
  /** Kirim perintah ke backend (`POST /api/command`). */
  sendCommand: (command: DeviceCommand) => boolean;
  /** Update optimistis; data dari alat akan menimpanya lagi. */
  patch: (updater: (prev: SystemState) => SystemState) => void;
  /** Ambil ulang kondisi terakhir dari REST (butuh login backend). */
  refresh: () => void;
};

/**
 * Satu-satunya pintu masuk data alat.
 *
 * - `NEXT_PUBLIC_WS_URL` kosong -> mode demo, jalankan simulator.
 * - diisi (mis. `wss://api.nex-gas.id/ws`) -> data asli dari backend.
 *
 * WebSocket backend (lihat `NeX-Gas-Backend`):
 *   { type: "telemetry", deviceId, data, frontend }
 *   { type: "state",     deviceId, data, frontend }
 *   { type: "status",    deviceId, data: { status } }
 *   { type: "event",     deviceId, data, notification }
 *
 * Perintah TIDAK lewat WebSocket: memakai REST `POST /api/command`
 * (Bearer JWT, role operator/admin).
 */
export function useDevice(
  onEvent?: (event: FirmwareEvent) => void,
  onNotification?: (notification: AppNotification) => void,
): DeviceClient {
  const [state, setState] = useState<SystemState>(initialSystem);
  const [link, setLink] = useState<DeviceLink>(
    isDemoMode ? "demo" : "connecting",
  );
  const [lastError, setLastError] = useState<string | null>(null);
  const onEventRef = useRef(onEvent);
  const onNotificationRef = useRef(onNotification);
  const socketRef = useRef<WebSocket | null>(null);
  const stateRef = useRef(state);

  useEffect(() => {
    onEventRef.current = onEvent;
    onNotificationRef.current = onNotification;
  }, [onEvent, onNotification]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const applyIncoming = useCallback((message: DeviceMessage) => {
    if (message.type === "event") onEventRef.current?.(message.payload);
    setState((prev) => applyMessage(prev, message).state);
  }, []);

  /** Isi state dari REST; dipakai saat halaman dibuka dan tiap reconnect. */
  const hydrate = useCallback(
    async (isCancelled: () => boolean = () => false) => {
      if (!isApiConfigured || !getSession()) return;
      try {
        const snapshot = await fetchSnapshot();
        if (isCancelled()) return;
        messagesFromSnapshot(snapshot).forEach(applyIncoming);
        setLastError(null);
      } catch (error) {
        if (isCancelled()) return;
        setLastError(
          error instanceof ApiError ? error.message : "Gagal mengambil snapshot backend",
        );
      }
    },
    [applyIncoming],
  );

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
    let pingTimer: ReturnType<typeof setInterval> | undefined;
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
        // Segarkan data terakhir lewat REST (kalau sudah login).
        void hydrate(() => cancelled);
        pingTimer = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "ping" }));
          }
        }, PING_INTERVAL_MS);
      };

      socket.onmessage = (event) => {
        if (cancelled) return;
        try {
          const parsed = parseBackendMessage(JSON.parse(event.data as string));
          if (!parsed) return;
          if (parsed.notification) onNotificationRef.current?.(parsed.notification);
          applyIncoming(parsed.message);
        } catch {
          setLastError("Payload backend bukan JSON yang valid");
        }
      };

      socket.onerror = () => {
        if (!cancelled) setLastError("Koneksi WebSocket ke backend gagal");
      };

      socket.onclose = () => {
        if (cancelled) return;
        if (pingTimer) clearInterval(pingTimer);
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
      if (pingTimer) clearInterval(pingTimer);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [applyIncoming, hydrate]);

  // ---- setelah login/logout, ambil ulang snapshot ----
  useEffect(() => {
    if (isDemoMode) return;
    return subscribeAuth(() => {
      if (getSession()) void hydrate();
    });
  }, [hydrate]);

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

  const refresh = useCallback(() => {
    void hydrate();
  }, [hydrate]);

  const sendCommand = useCallback((command: DeviceCommand) => {
    if (!isApiConfigured) {
      setLastError(
        "NEXT_PUBLIC_API_URL belum diset — perintah butuh REST backend, bukan WebSocket.",
      );
      return false;
    }
    if (!getSession()) {
      setLastError("Login backend dulu (role operator/admin) untuk mengirim perintah.");
      return false;
    }

    void postCommand(command)
      .then((result) => {
        setLastError(null);
        if (result.verificationStatus !== "published") {
          setLastError(result.message);
        }
      })
      .catch((error: unknown) => {
        setLastError(
          error instanceof ApiError ? error.message : "Gagal mengirim perintah ke backend",
        );
      });

    return true;
  }, []);

  return { state, link, lastError, sendCommand, patch, refresh };
}
