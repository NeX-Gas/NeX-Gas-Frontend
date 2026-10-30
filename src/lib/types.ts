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

/** Sumber data dashboard: alat asli lewat backend, atau simulator lokal. */
export type DeviceLink = "live" | "connecting" | "demo" | "offline";

/**
 * Payload `nexgas/<DEVICE_ID>/telemetry` dari firmware.
 * Nilai -1 berarti sensor belum memberi data valid (lihat `sensorValue()`).
 * Nama field sengaja sama persis dengan `buildTelemetryJson()` di firmware.
 */
export type Telemetry = {
  /** epoch UTC (detik) dari NTP; 0 = belum sinkron */
  ts: number;
  /** uptime alat (ms), selalu ada walau NTP gagal */
  uptimeMs: number;
  /** -1 selama MQ-136 kedua belum dipasang */
  h2sBefore: number;
  h2sAfter: number;
  ch4: number;
  leak: number;
  pressureDigester: number;
  pressureCollector: number;
  temperature: number;
  humidity: number;
  gasLineTemperature: number;
  gasLineHumidity: number;
  ph: number;
  /** L/menit (firmware mengirim L/menit, dashboard menampilkan L/jam) */
  flow: number;
  gasSinceStartL: number;
  /** false selama pemanasan MQ / sensor gagal baca */
  sensorsReady: boolean;
  /** dBm, 0 = WiFi putus */
  rssi: number;
};

/**
 * Gabungan payload `.../state` + `.../status` + hasil turunan telemetry.
 * `computeNext()` (simulator) menghasilkan bentuk yang sama.
 */
export type SystemState = {
  telemetry: Telemetry;
  valveOpen: boolean;
  valveMode: ValveMode;
  filterHealth: number;
  filterWarning: boolean;
  leakWarning: boolean;
  /** auto valve terkunci sampai kalibrasi 2 titik tekanan selesai */
  pressureCalibrated: boolean;
  phCalibrated: boolean;
  /** jumlah sampel telemetry yang masih di buffer alat (offline) */
  buffered: number;
  firmware: string;
  deviceId: string;
  deviceOnline: boolean;
  /** epoch ms terakhir ada data masuk ke dashboard */
  lastSeen: number | null;
};

/** Payload `.../state` (retained) dari firmware. */
export type FirmwareState = Partial<{
  valveOpen: boolean;
  valveMode: ValveMode;
  filterWarning: boolean;
  leakWarning: boolean;
  filterHealth: number;
  pressureCalibrated: boolean;
  phCalibrated: boolean;
  sensorsReady: boolean;
  buffered: number;
  uptimeMs: number;
  firmware: string;
}>;

/** Payload `.../event` dari firmware. */
export type FirmwareEvent = {
  ts?: number;
  uptimeMs?: number;
  type: string;
  severity?: "info" | "waspada" | "bahaya";
  message?: string;
};

/** Perintah untuk topik `.../cmd` (lihat `handleCommand()` di firmware). */
export type DeviceCommand =
  | { mode: ValveMode }
  | { valve: "open" | "close" }
  | { tare: true }
  | {
      cal_pressure_point: {
        sensor: "digester" | "collector";
        kpa: number;
      };
    }
  | { cal_mq: { gas: "h2s" | "ch4" | "leak"; ref_ppm: number } }
  | { cal_ph: { ph: number } };
