# Blessed Auto Car

Nama sementara; dapat diganti dari **Admin → Pengaturan website**.

## Status saat ini

- Kode frontend dan backend telah dibuat.
- `preview.html` adalah pratinjau desain mandiri dengan data contoh. Buka langsung di browser; pencarian, filter, status, favorit, slideshow, dan detail mobil dapat dicoba. Formulir admin di file ini hanya pratinjau dan tidak menyimpan data.
- Aplikasi server menyediakan `/admin`, API katalog, upload foto, D1 untuk data, dan R2 untuk foto. Tujuh belas pengujian lulus; pengujian API menggunakan SQLite lokal serta pengganti layanan identitas dan R2. Integrasi di hosting dan browser belum diverifikasi.
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

## Desain dan pencarian katalog

- Arah visual charcoal, putih hangat, dan merah bata; tipografi Manrope dan Barlow Condensed.
- Sidebar filter di desktop, dialog filter dengan terapkan/batal di HP. Merek/model, harga minimum–maksimum dalam juta, tahun, kilometer, transmisi, bahan bakar, tipe bodi, lokasi, dan status dapat dikombinasikan.
- Filter aktif dapat dihapus satu per satu dan tersimpan di URL. Favorit disimpan per browser. Tampilan grid/daftar dan pengurutan tersedia di desktop.
- Foto responsif memakai `srcset`, `sizes`, dimensi tetap, `loading=lazy`, skeleton, dan fallback bila gambar gagal. Foto hero pertama dimuat lebih awal; slide lain dimuat saat dipilih.
- Entrance menggunakan IntersectionObserver, hover foto, transisi dialog, serta dukungan reduced motion. Slideshow berhenti saat hover, fokus, tab tersembunyi, atau hero keluar viewport.
- `lib/showroom-view.mjs` dan `lib/showroom-interactions.mjs` dipakai bersama oleh komponen React dan ekspor HTML agar pratinjau dan aplikasi mengikuti perilaku yang sama. Input dinamis di-escape sebelum menjadi HTML.
- Pengujian filter mencakup gabungan OR/AND, batas rentang, model/lokasi, sorting/favorit, pemulihan URL, serta escaping teks. TypeScript/TSX dan JavaScript ekspor diperiksa sintaksnya. Pemeriksaan visual responsif di browser belum dapat dilakukan.

## Pengelolaan showroom

Buka `/admin` setelah aplikasi di-deploy, lalu masuk memakai akun pemilik yang emailnya terdaftar di `ADMIN_EMAILS`.

1. Klik **Tambah mobil**, isi merek/model, harga, tahun, kilometer, transmisi, bahan bakar, warna, lokasi, dan kondisi.
2. Biarkan **Publikasi: Draf** untuk menyimpan data sebelum foto siap. Spesifikasi wajib tetap harus lengkap. Draf tidak dikirim oleh API katalog publik maupun halaman beranda.
3. Upload foto, pilih foto utama dengan tombol panah, lalu ubah publikasi menjadi **Tampilkan ke katalog** dan simpan. Minimal satu foto diperlukan untuk publikasi.
4. Saat unit dipesan atau terjual, edit status lalu simpan. Pilih Draf untuk menyembunyikan unit tanpa menghapus datanya.
5. Pengaturan website mengelola nama showroom, kontak WhatsApp, alamat, logo, dan slideshow.

Upload menampilkan progres jumlah foto. Navigasi formulir dikunci selama upload/penyimpanan; foto yang selesai diunggah tetap dipertahankan jika batch berikutnya gagal. Foto yang dilepas dari mobil atau berasal dari draf yang dibatalkan belum dihapus otomatis dari bucket. URL foto tetap dapat diakses oleh orang yang mengetahui URL-nya; jangan unggah dokumen pribadi.

Data publikasi disimpan di JSON kendaraan sehingga perubahan ini tidak memerlukan kolom database baru. Unit lama tanpa field `published` tetap tampil. Pengujian tambahan memverifikasi draf privat, penolakan akses non-admin, penolakan publikasi tanpa foto, publikasi, dan penyembunyian ulang.


- Stok mobil: tambah/edit/hapus; harga, tahun, kilometer, transmisi, bahan bakar, warna, lokasi, status, deskripsi, dan label tambahan.
- Foto: upload beberapa file sekaligus, maksimal 20 foto per mobil; JPG/PNG/WebP, maksimal 10 MB per foto. Foto pertama menjadi thumbnail; urutan dan foto utama dapat diubah.
- Pengaturan: nama showroom, logo, kalimat pengantar, kontak, alamat, serta 1–5 hero slide.
- Katalog: filter merek/harga/tahun/transmisi/status; urutan harga/kilometer; favorit tersimpan per browser; galeri detail; pesan WhatsApp membawa nama mobil.
- Semua write API memerlukan identitas ChatGPT yang emailnya ada di `ADMIN_EMAILS`, dan origin yang sama. Tanpa konfigurasi, backend menolak penulisan.

## Verifikasi yang sudah dilakukan

`npm test` (Node.js 22.15+ untuk pengujian API)

Tujuh belas pengujian lulus: akses anonim dan admin, penolakan origin asing, tambah/edit/hapus mobil, penyimpanan pengaturan, penolakan data tidak valid, upload dan pembacaan kembali foto, penolakan upload tidak sah atau berukuran berlebih, normalisasi WhatsApp, serta pembatasan pembacaan body tanpa Content-Length. Bug payload JSON `null` yang sebelumnya menghasilkan HTTP 500 sudah diperbaiki menjadi HTTP 400.

Pengujian menjalankan handler aplikasi dan SQL yang sebenarnya. Layanan platform diganti di `scripts/test-runtime.mjs` hanya selama pengujian: identitas melalui header, database SQLite sementara, dan bucket dalam memori. Hasil ini belum membuktikan migrasi D1, layanan R2 hosted, login browser, atau keseluruhan aplikasi di hosting bekerja.

Di lingkungan tanpa jaringan, dependensi validasi Zod 3.25.76 untuk pengujian dipulihkan dari cache lokal; dependensi framework belum tersedia. Opsi `SHOWROOM_TEST_ZOD` dapat menunjuk salinan Zod tersebut. Pada instalasi biasa, `npm test` menggunakan dependensi proyek.

`node --experimental-strip-types scripts/export-preview.mjs`

Menghasilkan ulang `preview.html` dari data contoh dan CSS aplikasi. Script hasil ekspor juga diperiksa sintaksnya. Build framework, migrasi melalui Drizzle, browser QA, dan pengujian end-to-end belum bisa dijalankan karena batasan lingkungan. Server preview lokal ditolak (`Operation not permitted`); DNS npm dan host source Sites juga belum tersedia.

Logo merek pada pemilih katalog dan kartu mobil disertakan sebagai data SVG. Klik merek menyaring stok dan keadaan aktif mengikuti filter. Aset: vehiclespecs/brand-logos (Toyota, BMW, Mercedes-Benz, Mitsubishi), diegojasso/car-logos-SVG (Honda). Logo milik pemilik merek masing-masing, untuk identifikasi kendaraan.
