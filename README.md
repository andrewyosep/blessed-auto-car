# Blessed Auto Car

Nama sementara; dapat diganti dari **Admin → Pengaturan website**.

## Status saat ini

- Kode frontend dan backend telah dibuat.
- `preview.html` adalah pratinjau desain mandiri dengan data contoh. Buka langsung di browser; pencarian, filter, status, favorit, slideshow, dan detail mobil dapat dicoba. Formulir admin di file ini hanya pratinjau dan tidak menyimpan data.
- Aplikasi server menyediakan `/admin`, API katalog, upload foto, D1 untuk data, dan R2 untuk foto. Sepuluh pengujian lulus; pengujian API menggunakan SQLite lokal serta pengganti layanan identitas dan R2. Integrasi di hosting dan browser belum diverifikasi.
- Instalasi dependensi gagal karena DNS npm tidak tersedia di lingkungan pengerjaan.
- Publikasi gagal karena host repository tidak dapat dijangkau. Site belum live.
- Migrasi database **belum dihasilkan**; jalankan generator sebelum build/publikasi.
- `ADMIN_EMAILS` sudah diatur di konfigurasi hosting untuk akun pemilik Site; berlaku setelah deployment berikutnya. WhatsApp, alamat, logo, dan stok asli belum diberikan. Semua mobil, harga, dan foto bawaan ditandai sebagai ilustrasi.
- Repository source: [andrewyosep/blessed-auto-car](https://github.com/andrewyosep/blessed-auto-car). Penyimpanan source di GitHub terpisah dari publikasi website melalui Sites.

## Menjalankan aplikasi setelah jaringan tersedia

Persyaratan: Node.js 22.13+ dan npm.

1. `npm run install:ci`
2. `npm run db:generate` — periksa SQL dan metadata hasilnya di `drizzle/`; commit keduanya.
3. `npm run build` — menghasilkan konfigurasi Worker lokal di `dist/server/wrangler.json`.
4. Terapkan SQL migrasi yang baru dihasilkan pada database lokal. Ikuti perintah local D1 di `SETUP.md`.
5. Untuk preview lokal, atur `ADMIN_EMAILS=seedy@sites.test` pada `.dev.vars`. Identitas simulasi hanya tersedia di pengembangan lokal. Jangan memasukkan identitas simulasi ke konfigurasi hosting.
6. `npm run dev`
7. Buka `/admin`, masuk dengan ChatGPT, lalu tambah mobil asli.

Gunakan Sites untuk memublikasikan source ke project yang sudah tercatat dalam `.openai/hosting.json`. Jangan membuat project baru. Sites menyambungkan DB/BUCKET dan menerapkan migrasi saat deployment. Website tetap privat sampai pemilik meminta akses publik.

## Pengelolaan showroom

- Stok mobil: tambah/edit/hapus; harga, tahun, kilometer, transmisi, bahan bakar, warna, lokasi, status, deskripsi, dan label tambahan.
- Foto: upload beberapa file sekaligus, maksimal 20 foto per mobil; JPG/PNG/WebP, maksimal 10 MB per foto. Foto pertama menjadi thumbnail; urutan dan foto utama dapat diubah.
- Pengaturan: nama showroom, logo, kalimat pengantar, kontak, alamat, serta 1–5 hero slide.
- Katalog: filter merek/harga/tahun/transmisi/status; urutan harga/kilometer; favorit tersimpan per browser; galeri detail; pesan WhatsApp membawa nama mobil.
- Semua write API memerlukan identitas ChatGPT yang emailnya ada di `ADMIN_EMAILS`, dan origin yang sama. Tanpa konfigurasi, backend menolak penulisan.

## Verifikasi yang sudah dilakukan

`npm test` (Node.js 22.15+ untuk pengujian API)

Sepuluh pengujian lulus: akses anonim dan admin, penolakan origin asing, tambah/edit/hapus mobil, penyimpanan pengaturan, penolakan data tidak valid, upload dan pembacaan kembali foto, penolakan upload tidak sah atau berukuran berlebih, normalisasi WhatsApp, serta pembatasan pembacaan body tanpa Content-Length. Bug payload JSON `null` yang sebelumnya menghasilkan HTTP 500 sudah diperbaiki menjadi HTTP 400.

Pengujian menjalankan handler aplikasi dan SQL yang sebenarnya. Layanan platform diganti di `scripts/test-runtime.mjs` hanya selama pengujian: identitas melalui header, database SQLite sementara, dan bucket dalam memori. Hasil ini belum membuktikan migrasi D1, layanan R2 hosted, login browser, atau keseluruhan aplikasi di hosting bekerja.

Di lingkungan tanpa jaringan, dependensi validasi Zod 3.25.76 untuk pengujian dipulihkan dari cache lokal; dependensi framework belum tersedia. Opsi `SHOWROOM_TEST_ZOD` dapat menunjuk salinan Zod tersebut. Pada instalasi biasa, `npm test` menggunakan dependensi proyek.

`node --experimental-strip-types scripts/export-preview.mjs`

Menghasilkan ulang `preview.html` dari data contoh dan CSS aplikasi. Script hasil ekspor juga diperiksa sintaksnya. Build framework, migrasi melalui Drizzle, browser QA, dan pengujian end-to-end belum bisa dijalankan karena batasan lingkungan. Server preview lokal ditolak (`Operation not permitted`); DNS npm dan host source Sites juga belum tersedia.
