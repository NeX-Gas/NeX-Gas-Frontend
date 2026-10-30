This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Integrasi alat (MQTT → backend → dashboard)

Data alat masuk lewat satu pintu: `src/lib/use-device.ts`. Kontraknya
mengikuti **NeX-Gas-Backend** (branch `feat/backend-core`), bukan format
bebas.

- `NEXT_PUBLIC_WS_URL` kosong → dashboard jalan dengan **simulator lokal**
  (`computeNext()` di `src/lib/system.ts`). Tidak ada data palsu yang
  dikirim ke alat.
- Diisi (mis. `wss://api.nex-gas.id/ws`) → dashboard membaca amplop yang
  dikirim gateway WebSocket backend:

```json
{ "type": "telemetry", "deviceId": "nexgas-001", "data": { "...": "normalized" }, "frontend": { "...": "siap pakai" } }
{ "type": "state",     "deviceId": "nexgas-001", "data": { "...": "valve/filter/kalibrasi" }, "frontend": { "telemetry": { "...": "" } } }
{ "type": "status",    "deviceId": "nexgas-001", "data": { "status": "online" } }
{ "type": "event",     "deviceId": "nexgas-001", "data": { "...": "event" }, "notification": { "...": "AppNotification" } }
```

`src/lib/device.ts` (`parseBackendMessage()`) memetakan amplop itu ke state
dashboard: nama panjang backend (`temperatureC`, `h2sAfter`, …) → payload
firmware, dan `null` backend → sentinel `-1` supaya UI menampilkan
"—" / "sensor belum terpasang" alih-alih angka palsu.

### REST & perintah

Semua endpoint backend dilindungi **Bearer JWT**:

| Aksi | Endpoint | Role |
| --- | --- | --- |
| Snapshot terakhir | `GET /api/telemetry/latest`, `GET /api/state`, `GET /api/status` | viewer/operator/admin |
| Riwayat | `GET /api/history/telemetry`, `GET /api/history/events` | viewer/operator/admin |
| Perintah | `POST /api/command` body `{ deviceId, command }` | operator/admin |
| Login | `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout` | publik |

- Login tersedia di halaman **Pengaturan → Koneksi Backend**. Token disimpan
  di `localStorage` (`nexgas-auth`) dan di-refresh otomatis sebelum
  kedaluwarsa (akses 15 menit).
- Perintah **tidak** dikirim lewat WebSocket. Backend membalas jujur:
  `status: "published"`, `verificationStatus: "pending_execution"` — bukan
  ACK firmware.
- Kalau backend dijalankan dengan `PUBLIC_MQTT_TEST_MODE=true`, semua
  perintah ditolak `403` dan pesannya ditampilkan apa adanya di UI.
- CORS backend (`CORS_ALLOWED_ORIGINS`) harus memuat origin frontend,
  mis. `https://nex-gas.vercel.app`.

Salin `.env.example` menjadi `.env.local` lalu isi URL-nya:

```bash
NEXT_PUBLIC_WS_URL=ws://localhost:5001/ws
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_DEVICE_ID=nexgas-001
```

Kontrak payload alat mengikuti `buildTelemetryJson()` / `buildStateJson()`
di repo `NeX-Gas-Firmware`, dan tipe TypeScript-nya ada di `src/lib/types.ts`.

### Sidebar

Menu kiri bisa diringkas jadi icon-only lewat tombol **Ringkas menu**
(`PanelLeftClose` / `PanelLeftOpen`). Pilihan disimpan di
`localStorage` (`nexgas:sidebar-collapsed`) sehingga tetap sama setelah
refresh.

### Yang jalan tanpa backend

- Catatan harian (input kotoran), bahasa, riwayat penggantian filter, dan
  notifikasi disimpan di `localStorage` (`src/lib/storage.ts`) — bertahan
  setelah refresh, ikut sinkron antar tab.
- Kalibrasi (`tare`, 2 titik tekanan, 2 titik pH, R0 MQ) ada di halaman
  **Pengaturan**. Tombolnya otomatis nonaktif selama dashboard masih mode
  demo / backend belum tersambung.
- Mode otomatis valve terkunci sampai `pressureCalibrated` bernilai true,
  sama seperti perilaku firmware.
- Sensor yang belum terpasang (firmware mengirim `-1`) ditampilkan sebagai
  `—` / "sensor belum terpasang", bukan angka palsu.
- Grafik produksi mingguan di halaman Riwayat masih contoh statis (belum ada
  data historis dari backend).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
