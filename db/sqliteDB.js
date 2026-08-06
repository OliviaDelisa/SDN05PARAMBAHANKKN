/**
 * JALUR SQLITE SUDAH TIDAK DIPAKAI — JANGAN DI-IMPORT.
 *
 * Aplikasi ini memakai MySQL (lihat db/db.js dan db/initDB.js).
 *
 * File lama di posisi ini bermasalah karena:
 *   1. Skemanya sudah menyimpang — masih memakai kolom `email`, sementara
 *      jalur MySQL sudah bermigrasi ke `username`.
 *   2. Ia memanggil initSQLiteDB() saat modul dimuat, sehingga cukup
 *      meng-import-nya saja sudah membuat file database baru di disk.
 *   3. Ia menyemai password dalam bentuk teks biasa.
 *
 * Isinya sengaja diganti penanda ini, bukan dihapus, supaya import yang
 * tertinggal gagal dengan pesan yang jelas alih-alih diam-diam membuat
 * database kedua yang isinya berbeda dari MySQL.
 */

throw new Error(
  'db/sqliteDB.js sudah tidak dipakai. Aplikasi memakai MySQL — ' +
    'gunakan db/db.js (pool) dan db/initDB.js (skema).'
)
