# NEX-GAS — Visual Audit

Audit dijalankan dengan screenshot headless Chrome pada 1440×1150 (desktop) dan
390×1400 (mobile), untuk kelima rute, setelah setiap perubahan struktur.

## Gate anti-slop

| Pemeriksaan | Hasil |
|---|---|
| Tesis visual jelas | ya — panel instrumen lapangan |
| Bahasa visual spesifik produk | ya — kolom tekanan, ambang firmware, mono untuk semua angka |
| Anchor visual yang diingat | kolom tekanan dengan garis 0.3 / 1.0 / 2.0 kPa |
| Tidak ada identitas template | ya — tanpa hero, tanpa grid 3 kartu, tanpa pill status |
| Font eksplisit | IBM Plex Sans + IBM Plex Mono |
| Skala tipografi konsisten | 10.5 / 11 / 12 / 12.5 / 13 / 14 / 15 / 17 / 19 / 28 / 40 |
| Palet semantik | token lama dipertahankan, peran penggunaan diperketat |
| Warna tak sah | tidak ada; merah hanya untuk alarm/ambang |
| Radius konsisten | panel 6, field 4, chip 3, modal 10 — tanpa `rounded-full` |
| Bayangan | hanya modal + toast |
| Mobile sengaja didesain | sensor jadi 2 kolom, kolom tekanan diperkecil, nav 5 item |
| State interaksi lengkap | hover / active / focus-visible / disabled netral |

## Temuan dan perbaikan

### 1. Donut gauge dekoratif (lama)

Gauge menampilkan persentase yang tidak berhubungan dengan pengukuran apa pun.
**Perbaikan:** diganti kolom tekanan vertikal dengan garis ambang nyata dari
firmware. Tidak ada angka persen rekaan.

### 2. Kartu bertumpuk bayangan + `rounded-xl`

Semua permukaan punya bayangan, sehingga hierarki tidak terbaca dan halaman
terlihat seperti template SaaS.
**Perbaikan:** `1px` garis rambut `line/55`, radius 6px, tanpa bayangan.
Hierarki lewat tingkat permukaan (canvas → surface → `info-50` inset).

### 3. Status berbentuk pil berwarna

Pil hijau/merah membuat halaman terlihat "alarm" padahal normal.
**Perbaikan:** status = titik persegi 6px + teks. Warna latar hanya dipakai
untuk chip mikro (`StatusBadge`) dan kotak peringatan.

### 4. Satuan ganda di riwayat (`1.8 m³ m³`)

Label volume dari mock sudah memuat satuan, lalu `Readout` menambah satuan lagi.
**Perbaikan:** `parseVolume()` mengambil angka dari label apa pun bentuknya.

### 5. Skala grafik tidak manusiawi (2.5 / 1.9 / 1.3 / 0.6 / 0)

Garis bantu dihitung dari fraksi tinggi, bukan dari nilai bulat.
**Perbaikan:** tangga langkah `0.1 / 0.2 / 0.25 / 0.5 / 1 / 2 / 2.5 / 5 …`
dipilih agar maksimum 4 interval; label selalu bulat.

### 6. Label skala filter tidak pada posisinya

`justify-between` menempatkan label di kuartil, bukan di 50% dan 80%.
**Perbaikan:** `ScaleTick { at, label, caption }` dengan posisi absolut di
persentase sebenarnya; label tepi dirapatkan ke tepi.

### 7. Ruang mati di panel

- Kalibrasi: langkah terakhir mengisi sisa tinggi, footer protokol menempel bawah.
- Info Digester: dipindah jadi strip 4 kolom selebar halaman.
- Pengganti LPG: ditambah baris volume, setara tabung 3 kg, harga acuan.
- Pengganti filter: catatan diberi `mt-auto` agar sejajar antar kartu.

### 8. Foto stok di Purifikasi

Banner foto dapur tidak menambah informasi dan memakan 112px tinggi.
**Perbaikan:** diganti readout H₂S keluar karbon + status "siap bakar".

### 9. Status suhu jalur gas menyesatkan

Sel "Suhu Jalur Gas" memakai ambang kelembapan, jadi 32.3 °C bisa berlabel
"Periksa". Firmware tidak punya ambang suhu jalur gas.
**Perbaikan:** status netral "Terbaca" + hint "tanpa ambang".

### 10. Halaman Purifikasi tidak bisa dijangkau

Tidak ada tautan ke `/purifikasi` dari mana pun, dan judul header mobile jatuh
ke "Beranda" karena `pathname` membawa garis miring akhir.
**Perbaikan:** Purifikasi masuk navigasi (5 item), lookup judul menormalkan
garis miring akhir, tombol kembali khusus halaman dihapus.

### 11. Tombol disabled terlihat seperti tombol aktif pudar

**Perbaikan:** latar `info-200` + teks `muted`, tanpa `opacity` global.

## Yang belum bisa diverifikasi

- Kontras aktual instrumen di bawah sinar matahari (butuh uji lapangan).
- Histori backend: grafik masih data contoh, ditandai eksplisit di UI.
- Perintah valve/kalibrasi belum punya autentikasi — backend belum ada.
- Perilaku saat data firmware putus total (semua sel `-1`) hanya diuji di demo.
