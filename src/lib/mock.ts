import type {
  AppNotification,
  FilterUnit,
  LogEntry,
  ReplacementLog,
} from "./types";

export const digester = {
  name: "Digester Aktif",
  unit: "Unit #01 • Kandang Sapi Barat",
  online: true,
  temperature: 34,
  temperatureStatus: "Optimal",
  temperatureRange: "Normal: 30° - 38°C",
  ph: 6.8,
  phStatus: "Stabil",
  phRange: "Rentang: 6.5 - 7.5",
  tankLiters: 720,
  tankCapacity: 1000,
  burnTime: "~4.5 Jam Api Nyala",
  burnHint: "Cukup untuk 3 sesi memasak keluarga",
  h2s: { safe: true, ppm: 0.02 },
};

export const dailyLogs: LogEntry[] = [
  {
    id: "log-today",
    date: "Hari Ini, 24 Okt",
    input: "Input kotoran: 25 kg",
    gas: "1.8 m³ Gas",
    status: { text: "Kualitas Baik", tone: "good" },
  },
  {
    id: "log-1",
    date: "Kemarin, 23 Okt",
    input: "Input kotoran: 30 kg",
    gas: "2.1 m³ Gas",
    status: { text: "Kualitas Baik", tone: "good" },
  },
  {
    id: "log-2",
    date: "22 Okt 2023",
    input: "Input kotoran: 20 kg",
    gas: "1.4 m³ Gas",
    status: { text: "H2S Normal", tone: "neutral" },
  },
  {
    id: "log-3",
    date: "21 Okt 2023",
    input: "Input kotoran: 28 kg",
    gas: "1.9 m³ Gas",
    status: { text: "Kualitas Baik", tone: "good" },
  },
];

export const weeklyProduction = [
  { label: "Sen", value: 1.2 },
  { label: "Sel", value: 1.5 },
  { label: "Rab", value: 1.8 },
  { label: "Kam", value: 1.4 },
  { label: "Jum", value: 2.1 },
  { label: "Sab", value: 2.0 },
  { label: "Min", value: 1.9 },
];

export const notifications: AppNotification[] = [
  {
    id: "n1",
    category: "peringatan",
    severity: "waspada",
    badge: "WASPADA",
    time: "10 menit yang lalu",
    title: "Filter karbon aktif perlu\ndiganti dalam 2 hari",
    body: "Saturasi media sudah mencapai 85%.\nSegera ganti agar H₂S tidak lolos.",
    action: "Panduan Penggantian",
    unread: true,
  },
  {
    id: "n2",
    category: "peringatan",
    severity: "bahaya",
    badge: "BAHAYA",
    time: "2 jam yang lalu",
    title: "Kadar H2S mendekati\nambang batas",
    body: "Sensor mendeteksi H2S > 15 ppm.\nPastikan ventilasi kompor terbuka\nsaat menyalakan.",
    action: "Protokol Keamanan",
    unread: true,
  },
  {
    id: "n3",
    category: "info",
    severity: "info",
    badge: "INFO GAS",
    time: "Pagi tadi, 06:30",
    title: "Tekanan gas siap digunakan",
    body: "Volume gas mencapai 72% (720 L).\nCukup untuk memasak sore ini.",
    action: "Lihat Tangki",
    unread: false,
  },
  {
    id: "n4",
    category: "info",
    severity: "jadwal",
    badge: "JADWAL",
    time: "Kemarin",
    title: "Jadwal Pengisian Feses /\nBahan Baku",
    body: "Tambahkan 20 kg kotoran sapi dan 20 L\nair untuk menjaga kestabilan digester.",
    action: "Catat Input Hari Ini",
    unread: false,
  },
];

export const filterUnits: FilterUnit[] = [
  {
    id: "silica-gel",
    kind: "TABUNG FISIK 01",
    name: "Filter Silika Gel",
    subtitle: "Penyerap Uap Air & Kelembapan",
    status: { text: "Waspada", tone: "warn" },
    saturation: 72,
    thresholds: [
      { at: 50, tone: "normal" },
      { at: 80, tone: "warn" },
    ],
    scale: ["0% Kering", "50% Sedang", "80% Waspada", "100% Basah"],
    noteTitle: "Estimasi regenerasi: 3 hari lagi",
    noteBody: "Indikator mulai memudar\n(oranye → pucat).",
    noteTone: "warn",
  },
  {
    id: "carbon-active",
    kind: "TABUNG KIMIAWI 02",
    name: "Filter Karbon Aktif",
    subtitle: "Penjerap H₂S & Pengotor Gas",
    status: { text: "Aman", tone: "good" },
    saturation: 35,
    thresholds: [{ at: 50, tone: "normal" }],
    scale: ["0%", "50%", "100%"],
    noteTitle: "Media Masih Aktif & Optimal",
    noteBody: "H₂S sesudah filter masih di\nbawah ambang aman.",
    noteTone: "good",
  },
];

export const replacementLogs: ReplacementLog[] = [
  {
    id: "r1",
    title: "Ganti Media Karbon Aktif (500 gr)",
    meta: "15 Sep 2023 • Siklus 45 Hari",
  },
  {
    id: "r2",
    title: "Regenerasi Silika Gel",
    meta: "01 Agu 2023 • Penjemuran Sinar\nMatahari",
  },
];

export const operationalSettings = [
  {
    id: "s1",
    title: "Info Digester",
    desc: "Kapasitas 6m³, Tipe Kubah Tetap, Des 2023",
  },
  {
    id: "s2",
    title: "Kalibrasi Sensor",
    desc: "Sensor Tekanan ×2, MQ-136 H₂S, MQ-4 Metana, DHT22 & Probe pH",
  },
  {
    id: "s3",
    title: "Ambang Batas Notifikasi",
    desc: "Peringatan H₂S tembus, filter jenuh & kebocoran metana",
  },
];
