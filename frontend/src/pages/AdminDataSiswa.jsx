import DataSiswa from './DataSiswa'

/**
 * Data siswa dengan hak penuh: tambah, ubah, hapus.
 *
 * Seluruh tampilan dan logikanya ada di DataSiswa — berkas ini hanya
 * memilih modenya, supaya tabel dan filter tidak terduplikasi.
 */
export default function AdminDataSiswa() {
  return <DataSiswa mode="admin" />
}
