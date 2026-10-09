export type Tone = "good" | "warn" | "neutral" | "danger";

export type LogEntry = {
  id: string;
  date: string;
  input: string;
  gas: string;
  status: { text: string; tone: Tone };
};

export type NotificationSeverity = "waspada" | "bahaya" | "info" | "jadwal";
export type NotificationCategory = "peringatan" | "info";

export type AppNotification = {
  id: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  badge: string;
  time: string;
  title: string;
  body: string;
  action: string;
  unread: boolean;
};

export type Threshold = { at: number; tone: "normal" | "warn" };

export type FilterUnit = {
  id: string;
  kind: string;
  name: string;
  subtitle: string;
  status: { text: string; tone: Tone };
  saturation: number;
  thresholds: Threshold[];
  scale: string[];
  noteTitle: string;
  noteBody: string;
  noteTone: Tone;
};

export type ReplacementLog = { id: string; title: string; meta: string };

export type Language = "id" | "jv" | "su";

export type ValveMode = "auto" | "manual";

export type Telemetry = {
  h2sBefore: number;
  h2sAfter: number;
  ch4: number;
  leak: number;
  pressureDigester: number;
  pressureCollector: number;
  temperature: number;
  humidity: number;
  flow: number;
};

export type SystemState = {
  telemetry: Telemetry;
  valveOpen: boolean;
  valveMode: ValveMode;
  filterHealth: number;
  filterWarning: boolean;
  leakWarning: boolean;
};
