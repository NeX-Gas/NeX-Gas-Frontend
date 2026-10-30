# NEX-GAS — References & Synthesis

Riset dilakukan sebelum implementasi. Sumber di bawah adalah yang benar-benar
dibuka saat itu; sisanya konvensi instrumen yang sudah dikenal (panel SCADA,
multimeter, regulator gas).

## REFERENCE 1 — Manufacturing dashboard design guide (Fuselab, Okt 2026)

- URL: https://fuselabcreative.com/manufacturing-dashboard-ux-design
- Kategori: industrial / operations dashboard, 2026

**Apa yang berguna**

- Dashboard pabrik gagal bukan karena kurang dekorasi, tapi karena operator
  tidak bisa menjawab "apakah ini normal?" dalam satu pandangan.
- Kepadatan data justru membantu bila hierarkinya tegas; ruang kosong besar
  pada layar operasional adalah pemborosan.
- Status harus dinyatakan sebagai kata, bukan hanya warna.

**Tipografi** — label kecil, angka besar, perbedaan tegas antara keduanya.
**Warna** — warna aksen dipakai untuk anomali, bukan untuk memperindah.
**Layout** — blok data rapat dengan garis pemisah, bukan kartu mengambang.
**Motion** — minimal; animasi hanya pada perubahan nilai.

**Yang diambil:** hierarki angka-vs-label, status sebagai teks, kepadatan.
**Yang tidak diambil:** estetika dashboard gelap ala SCADA, grafik tren yang
tidak punya aksi.

## REFERENCE 2 — Panel instrumen fisik (multimeter, regulator gas, manometer)

Bukan situs web; acuan bentuk yang dilihat operator setiap hari.

- Skala dicetak pada posisi nilai sebenarnya, bukan dibagi rata.
- Angka memakai lebar tetap agar tidak bergeser saat berubah.
- Satu warna untuk "dalam batas", satu untuk "lewat batas", tanpa gradasi.
- Label teknis huruf kapital kecil dengan jarak huruf lebar.

**Yang diambil:** posisi tick di persentase nyata, angka tabular, dua warna
status, label kapital berjarak.
**Yang tidak diambil:** tekstur metalik, bezel, bayangan emboss.

## REFERENCE 3 — Dokumentasi teknis / manual peralatan

- Pola: judul bagian + garis rambut, tabel parameter, catatan kaki mono.

**Yang diambil:** `RuleLabel` (label + garis sampai tepi), catatan kaki mono
untuk asumsi dan sumber data.
**Yang tidak diambil:** tabel penuh bergaris ganda.

## Sintesis

```
JANGAN meniru dashboard SaaS: sidebar kartu, hero, tiga kartu fitur.
JANGAN meniru SCADA gelap: latar hitam, neon, grafik tanpa aksi.
JANGAN memakai foto stok sebagai pengganti diagram.

SINTESIS
- tipografi : IBM Plex Sans (UI) + IBM Plex Mono (semua angka & satuan)
- palet     : palet lama dipertahankan; hijau = sehat, merah = alarm,
              biru informasi hanya untuk blok data inset
- komposisi : panel datar ber garis rambut, grid 12 kolom, satu anchor
              per halaman
- kepadatan : tinggi; setiap baris punya label dan satuan
- interaksi : hover halus, focus ring 2px, tanpa animasi dekoratif
- citra     : tidak ada; diganti readout dan skala
- elemen khas: kolom tekanan vertikal dengan ambang 0.3 / 1.0 / 2.0 kPa
```

Palet tidak diubah karena diminta tetap; yang diubah adalah cara membelanjakannya.
