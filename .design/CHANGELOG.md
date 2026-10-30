# Visual Changelog

## 2026-10-30 — Redesign: panel instrumen lapangan

Palet tidak berubah. Yang berubah adalah sistem visualnya.

- Tipografi: Inter → IBM Plex Sans (UI) + IBM Plex Mono (seluruh angka,
  satuan, ambang, id perangkat).
- Permukaan: kartu `rounded-xl` + bayangan → panel datar radius 6px dengan
  garis rambut; bayangan hanya pada modal dan toast.
- Status: pil berwarna → titik persegi 6px + teks; chip mikro bersudut 3px.
- Navigasi: sidebar 240px dengan penanda aktif 2px persegi; top bar tipis berisi
  jalur perangkat; nav bawah 5 item (Purifikasi masuk).
- Dashboard: gauge donat dihapus, diganti kolom tekanan dengan garis ambang
  firmware (0.3 / 1.0 / 2.0 kPa); strip 5 sensor 2 kolom di mobile.
- Riwayat: grafik batang instrumen dengan skala bulat; panel penghematan LPG
  diisi tiga baris turunan (volume, tabung 3 kg, harga acuan).
- Purifikasi: banner foto diganti readout H₂S keluar; skala filter diposisikan
  di persentase sebenarnya dengan keterangan kering/sedang/waspada/basah.
- Notifikasi: rel severity 3px, teks mengalir penuh, label severity ganda
  dihapus.
- Pengaturan: Info Digester jadi strip 4 kolom selebar halaman; panel kalibrasi
  tidak lagi menyisakan ruang mati; tombol disabled netral.
- Aksesibilitas: `prefers-reduced-motion`, focus ring 2px, target sentuh ≥ 32px,
  label aria pada grup kontrol.
