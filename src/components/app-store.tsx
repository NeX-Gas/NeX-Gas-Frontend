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
import { computeNext, initialSystem, THRESHOLDS } from "@/lib/system";
import type {
  AppNotification,
  FilterUnit,
  Language,
  LogEntry,
  ReplacementLog,
  SystemState,
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
  addLog: (inputKg: number, gas: string) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  replaceFilter: (id: string) => void;
  setLanguage: (lang: Language) => void;
  setValveMode: (mode: ValveMode) => void;
  openValve: () => void;
  closeValve: () => void;
  resetFilterMaintenance: () => void;
  notify: (message: string) => void;
};

const AppContext = createContext<AppStore | null>(null);

let uid = 0;
const nextId = () => `gen-${Date.now()}-${uid++}`;

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<LogEntry[]>(dailyLogs);
  const [notifications, setNotifications] =
    useState<AppNotification[]>(seedNotifications);
  const [filters, setFilters] = useState<FilterUnit[]>(filterUnits);
  const [replacementLogs, setReplacementLogs] =
    useState<ReplacementLog[]>(seedReplacementLogs);
  const [language, setLanguageState] = useState<Language>("id");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [system, setSystem] = useState<SystemState>(initialSystem);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const systemRef = useRef(system);
  const warnRef = useRef({ filter: false, leak: false });

  const notify = useCallback((message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2600);
  }, []);

  useEffect(() => {
    systemRef.current = system;
  }, [system]);

  useEffect(() => {
    const id = setInterval(() => {
      const prev = systemRef.current;
      const next = computeNext(prev);
      systemRef.current = next;
      setSystem(next);

      if (next.filterWarning && !warnRef.current.filter) {
        notify("Peringatan: H₂S tembus filter — segera ganti karbon aktif");
      }
      if (next.leakWarning && !warnRef.current.leak) {
        notify("Bahaya: kebocoran metana terdeteksi — valve ditutup");
      }
      warnRef.current = {
        filter: next.filterWarning,
        leak: next.leakWarning,
      };
    }, 2500);
    return () => clearInterval(id);
  }, [notify]);

  const addLog = useCallback(
    (inputKg: number, gas: string) => {
      const entry: LogEntry = {
        id: nextId(),
        date: "Hari Ini, Baru Saja",
        input: `Input kotoran: ${inputKg} kg`,
        gas,
        status: { text: "Kualitas Baik", tone: "good" },
      };
      setLogs((prev) => [entry, ...prev]);
      notify(`Catatan ${inputKg} kg berhasil disimpan`);
    },
    [notify],
  );

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    notify("Semua notifikasi ditandai dibaca");
  }, [notify]);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n)),
    );
  }, []);

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
      setSystem((prev) => ({
        ...prev,
        filterHealth: 100,
        filterWarning: false,
        telemetry: { ...prev.telemetry, h2sAfter: 2.5 },
      }));
      warnRef.current = { ...warnRef.current, filter: false };
    },
    [filters, notify],
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
    [notify],
  );

  const setValveMode = useCallback(
    (mode: ValveMode) => {
      setSystem((prev) => ({ ...prev, valveMode: mode }));
      notify(
        mode === "auto"
          ? "Kontrol valve: OTOMATIS (berdasarkan tekanan)"
          : "Kontrol valve: MANUAL",
      );
    },
    [notify],
  );

  const openValve = useCallback(() => {
    const s = systemRef.current;
    if (s.valveMode !== "manual") return;
    if (s.telemetry.leak >= THRESHOLDS.leakDanger) {
      notify("Ditolak: kebocoran metana terdeteksi — valve tetap tertutup");
      return;
    }
    setSystem((prev) => ({ ...prev, valveOpen: true }));
    notify("Solenoid valve DIBUKA — gas mengalir ke penampung");
  }, [notify]);

  const closeValve = useCallback(() => {
    setSystem((prev) => ({ ...prev, valveOpen: false }));
    notify("Solenoid valve DITUTUP — gas terkumpul di digester");
  }, [notify]);

  const resetFilterMaintenance = useCallback(() => {
    setSystem((prev) => ({
      ...prev,
      filterHealth: 100,
      filterWarning: false,
      telemetry: { ...prev.telemetry, h2sAfter: 2.5 },
    }));
    warnRef.current = { ...warnRef.current, filter: false };
    notify("Media filter diganti — kesehatan filter direset 100%");
  }, [notify]);

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
      addLog,
      markAllRead,
      markRead,
      replaceFilter,
      setLanguage,
      setValveMode,
      openValve,
      closeValve,
      resetFilterMaintenance,
      notify,
    };
  }, [
    logs,
    notifications,
    filters,
    replacementLogs,
    language,
    system,
    addLog,
    markAllRead,
    markRead,
    replaceFilter,
    setLanguage,
    setValveMode,
    openValve,
    closeValve,
    resetFilterMaintenance,
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
