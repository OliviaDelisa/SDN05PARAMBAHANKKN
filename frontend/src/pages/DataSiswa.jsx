import { useState } from 'react'
import {
  Search,
  UserPlus,
  Edit2,
  Trash2,
  Save,
  AlertCircle
} from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import DataTable from '../components/common/DataTable'
import Modal from '../components/common/Modal'
import CustomSelect from '../components/common/CustomSelect'
import { kelasOptions } from '../data/mockData'
import { getInitials, getInitialColor, formatTanggalPendek } from '../utils/formatters'
import { useToast } from '../components/common/Toast'
import { useData } from '../context/DataContext'

/**
 * Halaman data siswa, dipakai dalam dua mode:
 *
 *   mode="petugas" (bawaan) — HANYA LIHAT & CARI, tidak ada tambah/ubah/hapus
 *   mode="admin"            — plus tambah, ubah & hapus
 *
 * Satu komponen, bukan dua berkas: tabel, pencarian, dan filter kelasnya
 * identik. Kalau dipisah, setiap perubahan kolom harus dikerjakan dua kali
 * dan lambat laun keduanya akan menyimpang.
 *
 * Menyembunyikan tombol pada mode petugas hanyalah kerapian tampilan —
 * POST/PUT/DELETE /api/siswa sudah ditolak 403 oleh requireRole('Admin').
 *
 * CATATAN PERBAIKAN: modal "Tambah/Edit" (isModalOpen) dan modal "Hapus"
 * (deletingSiswa) sekarang saling menutup satu sama lain setiap kali salah
 * satu dibuka. Sebelumnya keduanya independen sehingga bisa sama-sama
 * bernilai "terbuka" di saat yang sama, membuat dua modal tampil bertumpuk
 * dan rebutan fokus/klik.
 */
export default function DataSiswa({ mode = 'petugas' }) {
  const isAdmin = mode === 'admin'

  const toast = useToast()
  const { siswaList, kunjunganList, addSiswa, updateSiswa, deleteSiswa } = useData()

  const [searchQuery, setSearchQuery] = useState('')
  const [filterKelas, setFilterKelas] = useState('')

  // Modal State (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSiswa, setEditingSiswa] = useState(null)
  const [formData, setFormData] = useState({
    nis: '',
    nama: '',
    kelas: '1',
    jenis_kelamin: 'Laki-laki',
    tanggal_lahir: '',
    nama_wali: '',
    telepon_wali: ''
  })

  // Delete Confirm Modal State
  const [deletingSiswa, setDeletingSiswa] = useState(null)

  // Cegah klik ganda saat menyimpan / menghapus
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Options formatted for CustomSelect
  const kelasFilterOptions = [
    { value: '', label: 'Semua Kelas' },
    ...kelasOptions.map((k) => ({ value: k, label: `Kelas ${k}` }))
  ]

  const kelasFormOptions = kelasOptions.map((k) => ({ value: k, label: `Kelas ${k}` }))

  const jkOptions = [
    { value: 'Laki-laki', label: 'Laki-laki' },
    { value: 'Perempuan', label: 'Perempuan' }
  ]

  // Filter logic
  const filteredSiswa = siswaList.filter((s) => {
    const q = searchQuery.toLowerCase()
    const matchQuery = !searchQuery || s.nama?.toLowerCase().includes(q) || s.nis?.includes(q)
    const matchKelas = !filterKelas || s.kelas === filterKelas
    return matchQuery && matchKelas
  })

  // Dipakai untuk memperingatkan admin sebelum menghapus siswa yang
  // sudah punya rekam kunjungan.
  const jumlahRiwayat = deletingSiswa
    ? kunjunganList.filter(
        (k) => k.siswa_id === deletingSiswa.id || k.siswa_nis === deletingSiswa.nis
      ).length
    : 0

  // Open modal for new student
  const handleOpenAdd = () => {
    setDeletingSiswa(null) // pastikan modal Hapus tertutup
    setEditingSiswa(null)
    setFormData({
      nis: '',
      nama: '',
      kelas: '1',
      jenis_kelamin: 'Laki-laki',
      tanggal_lahir: '',
      nama_wali: '',
      telepon_wali: ''
    })
    setIsModalOpen(true)
  }

  // Open modal for editing
  const handleOpenEdit = (siswa) => {
    setDeletingSiswa(null) // pastikan modal Hapus tertutup
    setEditingSiswa(siswa)
    setFormData({
      nis: siswa.nis,
      nama: siswa.nama,
      kelas: siswa.kelas,
      jenis_kelamin: siswa.jenis_kelamin,
      tanggal_lahir: siswa.tanggal_lahir || '',
      nama_wali: siswa.nama_wali || '',
      telepon_wali: siswa.telepon_wali || ''
    })
    setIsModalOpen(true)
  }

  // Open confirm-delete modal
  const handleOpenDelete = (siswa) => {
    setIsModalOpen(false) // pastikan modal Tambah/Edit tertutup
    setDeletingSiswa(siswa)
  }

  // Save (Add or Update)
  const handleSave = async (e) => {
    e.preventDefault()

    if (saving) return

    if (!formData.nis || !formData.nama) {
      toast.error('NIS dan Nama Lengkap wajib diisi!')
      return
    }

    setSaving(true)
    try {
      if (editingSiswa) {
        await updateSiswa(editingSiswa.id, formData)
        toast.success(`Data siswa ${formData.nama} berhasil diperbarui!`)
      } else {
        await addSiswa(formData)
        toast.success(`Siswa baru ${formData.nama} berhasil ditambahkan!`)
      }
      setIsModalOpen(false)
    } catch (err) {
      toast.error(`Gagal menyimpan data siswa: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  // Delete
  const handleDeleteConfirm = async () => {
    if (!deletingSiswa || deleting) return

    setDeleting(true)
    try {
      await deleteSiswa(deletingSiswa.id)
      toast.success(`Data siswa ${deletingSiswa.nama} berhasil dihapus.`)
      setDeletingSiswa(null)
    } catch (err) {
      toast.error(`Gagal menghapus data siswa: ${err.message}`)
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    {
      key: 'nis',
      label: 'NIS',
      width: '110px',
      render: (val) => <span className="font-mono text-xs text-slate-500">{val}</span>
    },
    {
      key: 'nama',
      label: 'Nama Siswa',
      render: (val) => {
        const color = getInitialColor(val)
        const initial = getInitials(val)
        return (
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ backgroundColor: color }}
            >
              {initial}
            </div>
            <span className="font-semibold text-slate-900">{val}</span>
          </div>
        )
      }
    },
    {
      key: 'kelas',
      label: 'Kelas',
      width: '80px',
      render: (val) => (
        <span className="font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md text-xs">
          {val}
        </span>
      )
    },
    {
      key: 'jenis_kelamin',
      label: 'Jenis Kelamin',
      width: '120px',
      render: (val) => (
        <span className="text-xs text-slate-600">{val}</span>
      )
    },
    {
      key: 'tanggal_lahir',
      label: 'Tgl Lahir',
      width: '120px',
      render: (val) => <span className="text-xs text-slate-500 font-mono">{val ? formatTanggalPendek(val) : '-'}</span>
    },
    {
      key: 'nama_wali',
      label: 'Orang Tua / Wali',
      render: (val, row) => (
        <div>
          <div className="text-xs font-medium text-slate-700">{val || '-'}</div>
          {row.telepon_wali && (
            <div className="text-[11px] text-slate-400 font-mono">{row.telepon_wali}</div>
          )}
        </div>
      )
    },
    // Kolom Aksi hanya untuk admin — petugas tidak punya hak ubah/hapus.
    ...(isAdmin
      ? [
          {
            key: 'aksi',
            label: 'Aksi',
            width: '90px',
            render: (_, row) => (
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleOpenEdit(row)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-500 hover:text-emerald-700 transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleOpenDelete(row)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600 transition-colors"
                  title="Hapus"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          }
        ]
      : [])
  ]

  return (
    <div className="space-y-5">
      {/* Tombol "Tambah Siswa" hanya untuk admin. Petugas cuma boleh lihat
          data, tidak boleh menambah siswa baru. */}
      <PageHeader title="">
        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="
              inline-flex items-center gap-2 px-4 py-2.5 rounded-lg
              bg-emerald-600 hover:bg-emerald-700
              text-white font-semibold text-sm
              transition-colors cursor-pointer
            "
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Siswa</span>
          </button>
        )}
      </PageHeader>

      {/* Filter Bar */}
      <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau NIS..."
              className="
                w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200
                bg-white text-sm text-slate-800 placeholder:text-slate-400
                focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400
              "
            />
          </div>

          <div className="sm:col-span-4">
            <CustomSelect
              options={kelasFilterOptions}
              value={filterKelas}
              onChange={setFilterKelas}
              placeholder="Semua Kelas"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
          {filteredSiswa.length} siswa terdaftar
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={filteredSiswa}
        emptyMessage="Tidak ada data siswa yang cocok."
      />

      {/* Add / Edit Modal — hanya bisa dibuka lewat handleOpenAdd/handleOpenEdit,
          yang keduanya hanya dipanggil dari elemen yang sudah dibungkus isAdmin. */}
      {isAdmin && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingSiswa ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
          size="md"
        >
          <form onSubmit={handleSave} className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">
                  NIS <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formData.nis}
                  onChange={(e) => {
                    const onlyNumbers = e.target.value.replace(/\D/g, '')
                    setFormData({ ...formData, nis: onlyNumbers })
                  }}
                  placeholder="Misal: 20241032"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">
                  Kelas <span className="text-red-500">*</span>
                </label>
                <CustomSelect
                  options={kelasFormOptions}
                  value={formData.kelas}
                  onChange={(val) => setFormData({ ...formData, kelas: val })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Nama lengkap siswa..."
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Jenis Kelamin</label>
                <CustomSelect
                  options={jkOptions}
                  value={formData.jenis_kelamin}
                  onChange={(val) => setFormData({ ...formData, jenis_kelamin: val })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Tanggal Lahir</label>
                <input
                  type="date"
                  value={formData.tanggal_lahir}
                  onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-3 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-500">Nama Orang Tua / Wali</label>
              <input
                type="text"
                value={formData.nama_wali}
                onChange={(e) => setFormData({ ...formData, nama_wali: e.target.value })}
                placeholder="Nama ibu/ayah/wali..."
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">No. Telepon Wali</label>
              <input
                type="text"
                value={formData.telepon_wali}
                onChange={(e) => {
                  const onlyNumbers = e.target.value.replace(/\D/g, '')
                  setFormData({ ...formData, telepon_wali: onlyNumbers })
                }}
                placeholder="0812..."
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium text-sm"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Menyimpan...' : 'Simpan'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal — sama, hanya relevan untuk admin. */}
      {isAdmin && (
        <Modal
          isOpen={!!deletingSiswa}
          onClose={() => setDeletingSiswa(null)}
          title="Hapus Data Siswa"
          size="sm"
        >
          {deletingSiswa && (
            <div className="space-y-5 text-sm">
              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200 text-red-700">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-sm leading-relaxed">
                  Hapus data siswa <strong>{deletingSiswa.nama}</strong> ({deletingSiswa.nis})? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>

              {/* Rekam kunjungan tidak ikut terhapus (FK ON DELETE SET NULL),
                  tapi admin perlu tahu ada riwayat yang akan kehilangan
                  tautannya ke data induk siswa. */}
              {jumlahRiwayat > 0 && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200 text-amber-800">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed">
                    Siswa ini punya <strong>{jumlahRiwayat} rekam kunjungan</strong>. Riwayatnya
                    tetap tersimpan dan masih bisa dicetak, tetapi tidak lagi tertaut ke data
                    induk siswa.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeletingSiswa(null)}
                  className="px-4 py-2.5 rounded-lg bg-slate-100 text-slate-600 font-medium text-sm"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {deleting ? 'Menghapus...' : 'Hapus'}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}