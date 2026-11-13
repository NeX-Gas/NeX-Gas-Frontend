import type { FilterUnit } from "./types";

// Isi file ini hanya KONFIGURASI STATIS alat (nama unit, jenis tabung filter,
// spesifikasi digester). Tidak ada satu pun nilai pengukuran sensor di sini —
// semua angka sensor datang dari backend (MQTT -> Express -> WebSocket).

export const digester = {
  name: "Unit Digester",
};

export const filterUnits: FilterUnit[] = [
  {
    id: "silica-gel",
    kind: "TABUNG FISIK 01",
    name: "Filter Silika Gel",
    subtitle: "Penyerap Uap Air & Kelembapan",
    status: { text: "Tanpa sensor", tone: "neutral" },
    saturation: null,
    thresholds: [
      { at: 50, tone: "normal" },
      { at: 80, tone: "warn" },
    ],
    scale: [
      { at: 0, label: "0%", caption: "Kering" },
      { at: 50, label: "50%", caption: "Sedang" },
      { at: 80, label: "80%", caption: "Waspada", tone: "warn" },
      { at: 100, label: "100%", caption: "Basah" },
    ],
    noteTitle: "Belum ada sensor saturasi",
    noteBody: "Alat tidak mengukur kadar air silika gel.\nCek warna indikator secara manual.",
    noteTone: "neutral",
  },
  {
    id: "carbon-active",
    kind: "TABUNG KIMIAWI 02",
    name: "Filter Karbon Aktif",
    subtitle: "Penjerap H₂S & Pengotor Gas",
    status: { text: "Aman", tone: "good" },
    saturation: null,
    thresholds: [{ at: 50, tone: "normal" }],
    scale: [
      { at: 0, label: "0%", caption: "Baru" },
      { at: 50, label: "50%", caption: "Aktif" },
      { at: 100, label: "100%", caption: "Jenuh" },
    ],
    noteTitle: "Menunggu data H₂S",
    noteBody: "Saturasi dihitung dari H₂S sesudah filter yang dikirim firmware.",
    noteTone: "neutral",
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
