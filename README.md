# NEX-GAS Frontend Dashboard

Dashboard web modern untuk **NEX-GAS** (Sistem Pemantauan Reaktor Biogas & Pemurnian Anaerobik Cerdas). Dibangun menggunakan Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, dan Recharts.

---

## 1. Tujuan Proyek NEX-GAS

NEX-GAS Dashboard dirancang untuk memberikan visualisasi operasional reaktor biogas secara intuitif, akurat, dan transparan bagi operator maupun pengawas fasilitas:
- Pemantauan real-time kadar metana ($\text{CH}_4$), hidrogen sulfida ($\text{H}_2\text{S}$), tekanan reaktor, dan kebocoran gas.
- Evaluasi kinerja pemurnian gas dan estimasi kesehatan media filter absorben.
- Transparansi status alat dan integritas data sensor tanpa manipulasi atau nilai sintetis palsu.
- Ketahanan offline: dashboard tetap menyajikan data telemetri terakhir yang tersimpan di cloud database (Turso) dengan keterangan waktu yang jelas ketika perangkat ESP32 sedang tidak aktif.

---

## 2. Arsitektur Sistem & Aliran Data

```
┌─────────────────┐       MQTT (TLS 8883)       ┌────────────────────────────────────────────────────────┐
│  ESP32 DevKit   │ ──────────────────────────> │                   NeX-Gas-Backend                      │
│ (Gas & Pressure │                             │  1. HiveMQ Cloud Ingestion (TLS 8883)                  │
│  Sensors, Valve)│ <────────────────────────── │  2. Turso Cloud & SQLite WAL Persistence               │
└─────────────────┘        Command (cmd)        │  3. REST API & WebSocket Realtime Gateway              │
                                                └──────────────────────────┬─────────────────────────────┘
                                                                           │  HTTP REST & WebSocket
                                                                           ▼
                                                ┌────────────────────────────────────────────────────────┐
                                                │                   NeX-Gas-Frontend                     │
                                                │  - Hydration awal dari Turso via REST API              │
                                                │  - Sinkronisasi real-time via WebSocket                │
                                                │  - Watchdog koneksi online/offline akurat              │
                                                │  - Visualisasi jujur & pelindung integritas sensor     │
                                                └────────────────────────────────────────────────────────┘
```

---

## 3. Struktur Folder & Komponen Utama

```
NeX-Gas-Frontend/
├── docs/
│   └── NEXGAS_OFFLINE_DASHBOARD_VERIFICATION.md # Laporan verifikasi dashboard offline & screenshot
├── src/
│   ├── app/
│   │   ├── page.tsx          # Halaman Dashboard Utama (Overview metana, tekanan, status sistem)
│   │   ├── purifikasi/       # Halaman Pemantauan Filter H2S dan Efisiensi Pemurnian
│   │   ├── riwayat/          # Halaman Log dan Riwayat Telemetri Kronologis
│   │   ├── pengaturan/       # Halaman Konfigurasi Backend & Kontrol Kalibrasi
│   │   └── layout.tsx        # Shell layout, navigasi sidebar, dan tema
│   ├── components/
│   │   ├── monitoring.tsx    # Komponen visualisasi telemetri, banner peringatan & status keamanan
│   │   ├── app-store.tsx     # Context & penyedia state global aplikasi
│   │   └── ui/               # Komponen UI modular (cards, dialog, badges, buttons)
│   └── lib/
│       ├── api.ts            # Client HTTP untuk REST endpoint backend (snapshot, history, command)
│       ├── device.ts         # Parser amplop telemetri backend dan transformer data sensor
│       ├── system.ts         # Nilai konstan inisialisasi aman (SENSOR_UNAVAILABLE = -1)
│       ├── use-device.ts     # Hook utama sinkronisasi koneksi (WebSocket + REST snapshot fallback)
│       └── types.ts          # Definisi antarmuka TypeScript untuk sistem telemetri
└── package.json
```

---

## 4. Status Sensor & Prinsip Kejujuran Data

Aplikasi ini memegang prinsip ketat bahwa data sensor yang tidak valid atau belum terpasang **tidak boleh disamarkan** sebagai data normal:

| Parameter | Status Fisik Sensor | Tampilan di Dashboard | Keterangan |
| :--- | :--- | :--- | :--- |
| **Metana ($\text{CH}_4$)** | Terpasang (MQ-4 #1) | Nilai aktual (%) | Terbaca dari ADC sensor saluran gas. |
| **Kebocoran Gas** | Terpasang (MQ-4 #2) | Nilai ppm + Badge *Belum tervalidasi* | Pembacaan sensor kebocoran ambient disajikan dengan peringatan bahwa belum ada kalibrasi ruang tertutup. |
| **$\text{H}_2\text{S}$ Outlet** | Terpasang (MQ-136 #2)| Nilai aktual (ppm) | Terbaca sesudah tabung pemurnian. |
| **$\text{H}_2\text{S}$ Inlet** | Belum terpasang | `—` (Strip em-dash) | Sensor sebelum filter belum dipasang; efisiensi filter tidak dimanipulasi 100%. |
| **Suhu & Kelembapan** | Terpasang (DHT22 #1 & #2)| `—` (Strip em-dash) | Mengalami kendala pembacaan sinyal pada firmware ESP32 (timeout/NAN). Dashboard tidak menampilkan angka acak atau suhu kamar default. |
| **Sensor pH** | Belum terpasang (GPIO33)| `—` (Strip em-dash) | Sensor belum dihubungkan ke digester; pembacaan liar floating ADC ditolak dan tidak ditampilkan. |
| **Indikator Keamanan**| Multi-parameter | *Data Belum Lengkap* | Status keselamatan tidak menyatakan "Aman" selama parameter penting (suhu/H2S/pH) belum beroperasi normal. |

---

## 5. Fitur yang Selesai & Ditingkatkan

1. **Hidrasi Instan dari Turso Cloud (Offline Resilience)**:
   - Saat dashboard dimuat, hook `useDevice` langsung memanggil API snapshot backend untuk mengambil record terbaru dari database Turso Cloud.
   - Jika ESP32 sedang offline/dicabut, data terakhir tetap ditampilkan dengan label transparan: *"Data terakhir diterima: [Waktu]"*.
2. **Watchdog Status Perangkat yang Akurat**:
   - Menghilangkan status "Online Palsu". Status alat dievaluasi secara dinamis berdasarkan batas toleransi aman heartbeat telemetri (`STALE_AFTER_MS`), sinkron dengan Last Will and Testament (LWT) broker MQTT.
3. **Penyaringan Inisialisasi Tanpa Angka Mock**:
   - `initialSystem` menggunakan konstanta `SENSOR_UNAVAILABLE = -1` pada seluruh parameter sensor yang belum diterima dari alat riil, mencegah munculnya angka palsu saat halaman pertama kali dibuka.
4. **Validasi Tipe Data & Build Bersih**:
   - Kompatibel penuh dengan React 19 dan Next.js Turbopack compiler. Lolos pemeriksaan linting tanpa error dan lolos build produksi.

---

## 6. Cara Menjalankan Frontend Secara Lokal

### Prasyarat
- Node.js v20+ atau v22+
- npm v10+

### Langkah Instalasi:
```bash
# 1. Masuk ke folder frontend
cd NeX-Gas-Frontend

# 2. Salin template konfigurasi environment
cp .env.example .env.local

# 3. Konfigurasi endpoint backend di .env.local:
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_WS_URL=ws://localhost:5001/ws
NEXT_PUBLIC_DEVICE_ID=nexgas-001

# 4. Install dependencies
npm install

# 5. Jalankan server pengembangan Next.js
npm run dev
```

Buka peramban di `http://localhost:3000`.

### Pemeriksaan Kualitas & Build Produksi:
```bash
# Jalankan linting
npm run lint

# Jalankan build produksi
npm run build
```

---

## 7. Lisensi & Tim Pengembang

Proyek ini dikembangkan oleh Tim Pengembang NEX-GAS.
