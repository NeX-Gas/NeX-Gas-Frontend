This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Integrasi alat (MQTT → backend → dashboard)

Data alat masuk lewat satu pintu: `src/lib/use-device.ts`.

- `NEXT_PUBLIC_DEVICE_WS_URL` kosong → dashboard jalan dengan **simulator lokal**
  (`computeNext()` di `src/lib/system.ts`). Tidak ada data palsu yang
  dikirim ke alat.
- Diisi (mis. `wss://api.nex-gas.id/ws`) → dashboard membaca data asli dari
  backend. Backend hanya perlu meneruskan pesan MQTT sebagai JSON:

```json
{ "type": "telemetry", "payload": { "...": "isi nexgas/<id>/telemetry" } }
{ "type": "state",     "payload": { "...": "isi nexgas/<id>/state" } }
{ "type": "event",     "payload": { "...": "isi nexgas/<id>/event" } }
{ "type": "status",    "payload": "online" }
```

Perintah dari dashboard (`mode`, `valve`, `tare`, `cal_pressure_point`,
`cal_mq`, `cal_ph`) dikirim sebagai
`{"type":"command","payload":{...}}` pada WebSocket yang sama, atau
`POST {NEXT_PUBLIC_API_URL}/commands` sebagai fallback.

Salin `.env.example` menjadi `.env.local` lalu isi URL-nya. Kontrak payload
mengikuti `buildTelemetryJson()` / `buildStateJson()` di repo
`NeX-Gas-Firmware`, dan tipe TypeScript-nya ada di `src/lib/types.ts`.

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
