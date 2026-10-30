"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CheckCircle2 } from "lucide-react";
import {
  dailyLogs,
  filterUnits,
  notifications as seedNotifications,
  replacementLogs as seedReplacementLogs,
} from "@/lib/mock";
import { usePersistentState } from "@/lib/storage";
import { THRESHOLDS } from "@/lib/system";
import { useDevice } from "@/lib/use-device";
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
  sendCommand: (command: DeviceCommand) => boolean;
  addLog: (inputKg: number, gas: string) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  replaceFilter: (id: string) => void;
  setLanguage: (lang: Language) => void;
  setValveMode: (mode: ValveMode) => void;
  openValve: () => void;
  closeValve: () => void;
  resetFilterMaintenance: () => void;
  tare: () => boolean;
  calibratePressure: (
    sensor: "digester" | "collector",
    kpa: number,
  ) => boolean;
  calibratePh: (ph: number) => boolean;
  calibrateMq: (gas: "h2s" | "ch4" | "leak", refPpm: number) => boolean;
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
  const [logs, setLogs] = usePersistentState<LogEntry[]>("logs", dailyLogs);
  const [notifications, setNotifications] = usePersistentState<
    AppNotification[]
  >("notifications", seedNotifications);
  const [filters, setFilters] = usePersistentState<FilterUnit[]>(
    "filters",
    filterUnits,
  );
  const [replacementLogs, setReplacementLogs] = usePersistentState<
    ReplacementLog[]
  >("replacementLogs", seedReplacementLogs);
  const [language, setLanguageState] = usePersistentState<Language>(
    "language",
    "id",
  );
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnRef = useRef({ filter: false, leak: false });

  const notify = useCallback((message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2600);
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
  const { state: system, link, sendCommand, patch } = useDevice(onDeviceEvent);
  const systemRef = useRef(system);

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
      });
      const entry: LogEntry = {
        id: nextId(),
        date: `Hari Ini, ${stamp}`,
        input: `Input kotoran: ${inputKg} kg`,
        gas,
        status: { text: "Kualitas Baik", tone: "good" },
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
      notify(`${unit?.name ?? "Filter"} ditandai sudah diganti`);
      patch((prev) => ({
        ...prev,
        filterHealth: 100,
        filterWarning: false,
        telemetry: { ...prev.telemetry, h2sAfter: 2.5 },
      }));
      warnRef.current = { ...warnRef.current, filter: false };
    },
    [filters, notify, patch, setFilters, setReplacementLogs],
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
    (mode: ValveMode) => {
      const current = systemRef.current;
      if (mode === "auto" && !current.pressureCalibrated) {
        notify("Mode otomatis terkunci: kalibrasi tekanan 2 titik dulu");
        return;
      }
      patch((prev) => ({ ...prev, valveMode: mode }));
      const sent = sendCommand({ mode });
      notify(
        mode === "auto"
          ? "Kontrol valve: OTOMATIS (berdasarkan tekanan)"
          : "Kontrol valve: MANUAL",
      );
      if (!sent) notify("Mode disimpan lokal — backend belum tersambung");
    },
    [notify, patch, sendCommand],
  );

  const openValve = useCallback(() => {
    const s = systemRef.current;
    if (s.valveMode !== "manual") return;
    if (s.telemetry.leak >= THRESHOLDS.leakDanger) {
      notify("Ditolak: kebocoran metana terdeteksi — valve tetap tertutup");
      return;
    }
    patch((prev) => ({ ...prev, valveOpen: true }));
    const sent = sendCommand({ valve: "open" });
    notify(
      sent
        ? "Solenoid valve DIBUKA — gas mengalir ke penampung"
        : "Dibuka lokal — backend belum tersambung",
    );
  }, [notify, patch, sendCommand]);

  const closeValve = useCallback(() => {
    patch((prev) => ({ ...prev, valveOpen: false }));
    const sent = sendCommand({ valve: "close" });
    notify(
      sent
        ? "Solenoid valve DITUTUP — gas terkumpul di digester"
        : "Ditutup lokal — backend belum tersambung",
    );
  }, [notify, patch, sendCommand]);

  const resetFilterMaintenance = useCallback(() => {
    patch((prev) => ({
      ...prev,
      filterHealth: 100,
      filterWarning: false,
      telemetry: { ...prev.telemetry, h2sAfter: 2.5 },
    }));
    warnRef.current = { ...warnRef.current, filter: false };
    notify("Media filter diganti — kesehatan filter direset 100%");
  }, [notify, patch]);

  const tare = useCallback(() => {
    const sent = sendCommand({ tare: true });
    notify(
      sent
        ? "Perintah tare tekanan dikirim ke alat"
        : "Tare gagal: backend belum tersambung",
    );
    return sent;
  }, [notify, sendCommand]);

  const calibratePressure = useCallback(
    (sensor: "digester" | "collector", kpa: number) => {
      const sent = sendCommand({ cal_pressure_point: { sensor, kpa } });
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
    (ph: number) => {
      const sent = sendCommand({ cal_ph: { ph } });
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
    (gas: "h2s" | "ch4" | "leak", refPpm: number) => {
      const sent = sendCommand({ cal_mq: { gas, ref_ppm: refPpm } });
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
      (n) => n.category === "peringatan",
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
      canCommand: link === "live" && system.deviceOnline,
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
    notify,
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-toast-in pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-[10px] bg-ink px-4 py-2.5 text-[12.5px] font-medium text-white shadow-xl"
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
