"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { CheckCircle2 } from "lucide-react";
import { filterUnits } from "@/lib/mock";
import { usePersistentState } from "@/lib/storage";
import { THRESHOLDS } from "@/lib/system";
import { useDevice } from "@/lib/use-device";
import {
  API_URL,
  DEVICE_ID as BACKEND_DEVICE_ID,
  getServerSession,
  getSession,
  isApiConfigured,
  login as loginRequest,
  logout as logoutRequest,
  postCalibration,
  subscribeAuth,
  type AuthSession,
  type CalibrationRequest,
  type CalibrationResult,
} from "@/lib/api";
import { DEVICE_WS_URL, isSensorValue } from "@/lib/device";
import type {
  AppNotification,
  DeviceCommand,
  DeviceLink,
  FilterUnit,
  FirmwareEvent,
  Language,
  LogEntry,
  NotificationSeverity,
  ReplacementLog,
  Telemetry,
  ValveMode,
} from "@/lib/types";

type Toast = { id: number; message: string };

type AppStore = {
  logs: LogEntry[];
  notifications: AppNotification[];
  unreadCount: number;
  criticalCount: number;
  filters: FilterUnit[];
  replacementLogs: ReplacementLog[];
  language: Language;
  telemetry: Telemetry;
  valveOpen: boolean;
  valveMode: ValveMode;
  filterHealth: number;
  filterWarning: boolean;
  leakWarning: boolean;
  /** Readback kalibrasi terakhir dari firmware (v1.1.0). */
  cal: import("@/lib/types").CalibrationReadback | null;
  leakLatched: boolean;
  calSensor: string;
  authCmd: boolean;
  authMsgs: boolean;
  /** Kirim satu langkah kalibrasi bertanda tangan lewat backend. */
  calibrate: (request: CalibrationRequest) => Promise<CalibrationResult | null>;
  /** `live` = data alat asli, `demo` = simulator lokal */
  link: DeviceLink;
  deviceOnline: boolean;
  pressureCalibrated: boolean;
  phCalibrated: boolean;
  sensorsReady: boolean;
  buffered: number;
  firmware: string;
  deviceId: string;
  rssi: number;
  lastSeen: number | null;
  /** true kalau perintah bisa benar-benar sampai ke alat */
  canCommand: boolean;
  sendCommand: (command: DeviceCommand) => Promise<boolean>;
  /** Sesi login backend (JWT). `null` = belum login. */
  auth: AuthSession | null;
  /** true kalau `NEXT_PUBLIC_API_URL` diset. */
  apiConfigured: boolean;
  apiUrl: string;
  wsUrl: string;
  backendDeviceId: string;
  /** Pesan error terakhir dari WebSocket/REST, ditampilkan apa adanya. */
  lastError: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshFromBackend: () => void;
  addLog: (inputKg: number, gas: string) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  replaceFilter: (id: string) => void;
  setLanguage: (lang: Language) => void;
  setValveMode: (mode: ValveMode) => void;
  openValve: () => void;
  closeValve: () => void;
  resetFilterMaintenance: () => void;
  tare: () => Promise<boolean>;
  calibratePressure: (
    sensor: "digester" | "collector",
    kpa: number,
  ) => Promise<boolean>;
  calibratePh: (ph: number) => Promise<boolean>;
  calibrateMq: (gas: "h2s" | "ch4" | "leak", refPpm: number) => Promise<boolean>;
  notify: (message: string) => void;
};

const AppContext = createContext<AppStore | null>(null);

let uid = 0;
const nextId = () => `gen-${Date.now()}-${uid++}`;

const MAX_STORED_LOGS = 100;
const MAX_NOTIFICATIONS = 50;

const eventSeverity: Record<string, NotificationSeverity> = {
  bahaya: "bahaya",
  waspada: "waspada",
  info: "info",
};

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  // Key v2: buang seed contoh yang tersimpan di localStorage versi lama.
  const [logs, setLogs] = usePersistentState<LogEntry[]>("logs:v2", []);
  const [notifications, setNotifications] = usePersistentState<
    AppNotification[]
  >("notifications:v2", []);
  const [filters, setFilters] = usePersistentState<FilterUnit[]>(
    "filters:v2",
    filterUnits,
  );
  const [replacementLogs, setReplacementLogs] = usePersistentState<
    ReplacementLog[]
  >("replacementLogs:v2", []);
  const [language, setLanguageState] = usePersistentState<Language>(
    "language",
    "id",
  );
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastTimers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const warnRef = useRef({ filter: false, leak: false });

  const notify = useCallback((message: string) => {
    // Dua toast bisa lahir di milidetik yang sama -> id harus unik.
    const id = uid++;
    setToasts((prev) => [...prev, { id, message }]);
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      toastTimers.current.delete(id);
    }, 2600);
    toastTimers.current.set(id, timer);
  }, []);

  useEffect(() => {
    const timers = toastTimers.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const onDeviceEvent = useCallback(
    (event: FirmwareEvent) => {
      const severity = eventSeverity[event.severity ?? "info"] ?? "info";
      const isWarning = severity !== "info";
      const title =
        event.message ??
        {
          boot: "Alat menyala ulang",
          valve_closed_leak: "Valve ditutup: kebocoran metana",
          collector_full: "Penampung penuh, valve ditutup",
          pressure_uncalibrated: "Sensor tekanan belum terkalibrasi",
          filter_saturated: "Filter H₂S jenuh",
        }[event.type] ??
        `Peristiwa alat: ${event.type}`;

      setNotifications((prev) =>
        [
          {
            id: nextId(),
            category: isWarning ? "peringatan" : "info",
            severity,
            badge: severity === "bahaya" ? "BAHAYA" : isWarning ? "WASPADA" : "INFO",
            time: "Baru saja",
            title,
            body: `Peristiwa firmware • ${event.type}`,
            action: "",
            unread: true,
          } satisfies AppNotification,
          ...prev,
        ].slice(0, MAX_NOTIFICATIONS),
      );
      notify(title);
    },
    [notify, setNotifications],
  );

  // Sumber data tunggal: backend (WebSocket) atau simulator kalau belum diset.
  const onBackendNotification = useCallback(
    (notification: AppNotification) => {
      setNotifications((prev) => {
        if (prev.some((item) => item.id === notification.id)) return prev;
        return [notification, ...prev].slice(0, MAX_NOTIFICATIONS);
      });
      notify(notification.title);
    },
    [notify, setNotifications],
  );

  const {
    state: system,
    link,
    lastError,
    sendCommand,
    refresh,
  } = useDevice(onDeviceEvent, onBackendNotification);
  const systemRef = useRef(system);

  // ---- sesi backend ----
  const auth = useSyncExternalStore(subscribeAuth, getSession, getServerSession);

  const login = useCallback(
    async (username: string, password: string) => {
      const session = await loginRequest(username, password);
      notify(`Login backend sebagai ${session.user.username} (${session.user.role})`);
      refresh();
    },
    [notify, refresh],
  );

  const logout = useCallback(async () => {
    await logoutRequest();
    notify("Sesi backend diakhiri");
  }, [notify]);

  useEffect(() => {
    systemRef.current = system;
  }, [system]);

  useEffect(() => {
    if (system.filterWarning && !warnRef.current.filter) {
      notify("Peringatan: H₂S tembus filter — segera ganti karbon aktif");
    }
    if (system.leakWarning && !warnRef.current.leak) {
      notify("Bahaya: kebocoran metana terdeteksi — valve ditutup");
    }
    warnRef.current = {
      filter: system.filterWarning,
      leak: system.leakWarning,
    };
  }, [system.filterWarning, system.leakWarning, notify]);

  const addLog = useCallback(
    (inputKg: number, gas: string) => {
      const stamp = new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const entry: LogEntry = {
        id: nextId(),
        date: stamp,
        input: `Input kotoran: ${inputKg} kg`,
        gas,
        // Bukan hasil ukur alat: hasil gas adalah asumsi, bukan kualitas terverifikasi.
        status: { text: "Estimasi", tone: "neutral" },
      };
      setLogs((prev) => [entry, ...prev].slice(0, MAX_STORED_LOGS));
      notify(`Catatan ${inputKg} kg berhasil disimpan`);
    },
    [notify, setLogs],
  );

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    notify("Semua notifikasi ditandai dibaca");
  }, [notify, setNotifications]);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n)),
    );
  }, [setNotifications]);

  const replaceFilter = useCallback(
    (id: string) => {
      const unit = filters.find((f) => f.id === id);
      setFilters((prev) =>
        prev.map((f) => {
          if (f.id !== id) return f;
          return {
            ...f,
            saturation: 0,
            status: { text: "Aman", tone: "good" },
            noteTitle: "Filter baru dipasang",
            noteBody: "Media pengganti aktif dan siap menjerap kembali.",
            noteTone: "good",
          };
        }),
      );
      const now = new Date();
      const stamp = now.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      setReplacementLogs((prev) => [
        {
          id: nextId(),
          title: `Penggantian ${unit?.name ?? "Filter"}`,
          meta: `${stamp} • Siklus Diperbarui`,
        },
        ...prev,
      ]);
      notify(`${unit?.name ?? "Filter"} dicatat sudah diganti (catatan lokal)`);
      warnRef.current = { ...warnRef.current, filter: false };
    },
    [filters, notify, setFilters, setReplacementLogs],
  );

  const setLanguage = useCallback(
    (lang: Language) => {
      setLanguageState(lang);
      const names: Record<Language, string> = {
        id: "Indonesia",
        jv: "Basa Jawa",
        su: "Basa Sunda",
      };
      notify(`Bahasa diubah ke ${names[lang]}`);
    },
    [notify, setLanguageState],
  );

  const setValveMode = useCallback(
    async (mode: ValveMode) => {
      const current = systemRef.current;
      if (mode === "auto" && !current.pressureCalibrated) {
        notify("Mode otomatis terkunci: kalibrasi tekanan 2 titik dulu");
        return;
      }
      // Jangan ubah state lokal sebelum alat mengonfirmasi lewat topik state.
      const sent = await sendCommand({ mode });
      notify(
        sent
          ? `Perintah mode ${mode.toUpperCase()} terkirim — menunggu konfirmasi alat`
          : "Perintah mode gagal dikirim",
      );
    },
    [notify, sendCommand],
  );

  const openValve = useCallback(async () => {
    const s = systemRef.current;
    if (s.valveMode !== "manual") {
      notify("Pilih mode Manual dulu untuk mengontrol valve");
      return;
    }
    if (isSensorValue(s.telemetry.leak) && s.telemetry.leak >= THRESHOLDS.leakDanger) {
      notify("Ditolak: kebocoran metana terdeteksi — valve tetap tertutup");
      return;
    }
    const sent = await sendCommand({ valve: "open" });
    notify(
      sent
        ? "Perintah BUKA terkirim — menunggu konfirmasi alat"
        : "Perintah buka valve gagal dikirim",
    );
  }, [notify, sendCommand]);

  const closeValve = useCallback(async () => {
    const sent = await sendCommand({ valve: "close" });
    notify(
      sent
        ? "Perintah TUTUP terkirim — menunggu konfirmasi alat"
        : "Perintah tutup valve gagal dikirim",
    );
  }, [notify, sendCommand]);

  const resetFilterMaintenance = useCallback(() => {
    notify("Catatan penggantian disimpan. Kesehatan filter mengikuti sensor H₂S alat.");
  }, [notify]);

  const calibrate = useCallback(
    async (request: CalibrationRequest): Promise<CalibrationResult | null> => {
      try {
        const result = await postCalibration(request);
        if (result.ack && !result.ack.ok) {
          notify(`Alat menolak: ${result.ack.err ?? "error"}`);
        } else {
          notify(result.message);
        }
        return result;
      } catch (error: unknown) {
        notify(error instanceof Error ? error.message : "Kalibrasi gagal dikirim");
        return null;
      }
    },
    [notify],
  );

  const tare = useCallback(async () => {
    const sent = await sendCommand({ tare: true });
    notify(
      sent
        ? "Perintah tare tekanan terkirim — menunggu alat"
        : "Tare gagal: backend belum tersambung",
    );
    return sent;
  }, [notify, sendCommand]);

  const calibratePressure = useCallback(
    async (sensor: "digester" | "collector", kpa: number) => {
      const sent = await sendCommand({ cal_pressure_point: { sensor, kpa } });
      const label = sensor === "digester" ? "digester" : "penampung";
      notify(
        sent
          ? `Titik kalibrasi tekanan ${label} (${kpa} kPa) dikirim`
          : "Kalibrasi gagal: backend belum tersambung",
      );
      return sent;
    },
    [notify, sendCommand],
  );

  const calibratePh = useCallback(
    async (ph: number) => {
      const sent = await sendCommand({ cal_ph: { ph } });
      notify(
        sent
          ? `Kalibrasi pH ${ph} dikirim — bilas probe sebelum titik berikutnya`
          : "Kalibrasi gagal: backend belum tersambung",
      );
      return sent;
    },
    [notify, sendCommand],
  );

  const calibrateMq = useCallback(
    async (gas: "h2s" | "ch4" | "leak", refPpm: number) => {
      const sent = await sendCommand({ cal_mq: { gas, ref_ppm: refPpm } });
      notify(
        sent
          ? `Kalibrasi MQ ${gas.toUpperCase()} (${refPpm} ppm) dikirim`
          : "Kalibrasi gagal: backend belum tersambung",
      );
      return sent;
    },
    [notify, sendCommand],
  );

  const value = useMemo<AppStore>(() => {
    const unreadCount = notifications.filter((n) => n.unread).length;
    const criticalCount = notifications.filter(
      (n) => n.category === "peringatan" && n.unread,
    ).length;
    return {
      logs,
      notifications,
      unreadCount,
      criticalCount,
      filters,
      replacementLogs,
      language,
      telemetry: system.telemetry,
      valveOpen: system.valveOpen,
      valveMode: system.valveMode,
      filterHealth: system.filterHealth,
      filterWarning: system.filterWarning,
      leakWarning: system.leakWarning,
      cal: system.cal,
      leakLatched: system.leakLatched,
      calSensor: system.calSensor,
      authCmd: system.authCmd,
      authMsgs: system.authMsgs,
      calibrate,
      link,
      deviceOnline: system.deviceOnline,
      pressureCalibrated: system.pressureCalibrated,
      phCalibrated: system.phCalibrated,
      sensorsReady: system.telemetry.sensorsReady,
      buffered: system.buffered,
      firmware: system.firmware,
      deviceId: system.deviceId,
      rssi: system.telemetry.rssi,
      lastSeen: system.lastSeen,
      canCommand:
        link === "live" &&
        system.deviceOnline &&
        isApiConfigured &&
        auth !== null &&
        auth.user.role !== "viewer",
      sendCommand,
      auth,
      apiConfigured: isApiConfigured,
      apiUrl: API_URL,
      wsUrl: DEVICE_WS_URL,
      backendDeviceId: BACKEND_DEVICE_ID,
      lastError,
      login,
      logout,
      refreshFromBackend: refresh,
      addLog,
      markAllRead,
      markRead,
      replaceFilter,
      setLanguage,
      setValveMode,
      openValve,
      closeValve,
      resetFilterMaintenance,
      tare,
      calibratePressure,
      calibratePh,
      calibrateMq,
      notify,
    };
  }, [
    logs,
    notifications,
    filters,
    replacementLogs,
    language,
    system,
    link,
    lastError,
    auth,
    login,
    logout,
    refresh,
    sendCommand,
    addLog,
    markAllRead,
    markRead,
    replaceFilter,
    setLanguage,
    setValveMode,
    openValve,
    closeValve,
    resetFilterMaintenance,
    tare,
    calibratePressure,
    calibratePh,
    calibrateMq,
    calibrate,
    notify,
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-toast-in pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white shadow-xl"
          >
            <CheckCircle2 className="size-4 shrink-0 text-brand-300" />
            {t.message}
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppStore must be used within AppStoreProvider");
  return ctx;
}
