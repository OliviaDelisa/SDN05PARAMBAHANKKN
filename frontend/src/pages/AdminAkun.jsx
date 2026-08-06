import { useState, useEffect, useCallback } from 'react'
import {
  UserPlus,
  Edit2,
  Trash2,
  KeyRound,
  Save,
  AlertCircle,
  Info,
  ShieldCheck,
  Loader2
} from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import DataTable from '../components/common/DataTable'
import Modal from '../components/common/Modal'
import CustomSelect from '../components/common/CustomSelect'
import { useToast } from '../components/common/Toast'
import { useAuth, validateUsername } from '../context/AuthContext'
import { api } from '../utils/api'
import { getInitials, getInitialColor } from '../utils/formatters'

// Harus sama persis dengan ENUM users.role di db/initDB.js dan
// ROLE_VALID di controllers/validators.js.
const ROLE_OPTIONS = [
  { value: 'Dokter Kecil UKS', label: 'Dokter Kecil UKS' },
  { value: 'Admin', label: 'Admin' }
]

const FORM_KOSONG = {
  nama_lengkap: '',
  username: '',
  nip: '',
  no_telepon: '',
  password: '',
  role: 'Dokter Kecil UKS'
}

export default function AdminAkun() {
  const toast = useToast()
  const { user: userAktif } = useAuth()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(FORM_KOSONG)
  const [saving, setSaving] = useState(false)

  const [resetting, setResetting] = useState(null)
  const [passwordBaru, setPasswordBaru] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  const [deleting, setDeleting] = useState(null)
  const [konfirmasiNama, setKonfirmasiNama] = useState('')
  const [savingDelete, setSavingDelete] = useState(false)

  const muat = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.admin.getUsers()
      setUsers(Array.isArray(res?.data) ? res.data : [])
    } catch (err) {
      toast.error(`Gagal memuat daftar akun: ${err.message}`)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Dibungkus fungsi async lokal, bukan memanggil muat() langsung:
    // setState sinkron di badan efek memicu render bertingkat.
    async function awal() {
      await muat()
    }
    awal()
  }, [muat])

  // Dipakai untuk menyembunyikan tombol hapus pada admin terakhir.
  // Server tetap menolaknya juga — ini semata agar tombolnya tidak
  // terlihat bisa diklik padahal pasti gagal.
  const jumlahAdmin = users.filter((u) => u.role === 'Admin').length

  const handleOpenTambah = () => {
    setEditing(null)
    setForm(FORM_KOSONG)
    setIsFormOpen(true)
  }

  const handleOpenUbah = (u) => {
    setEditing(u)
    setForm({
      nama_lengkap: u.nama_lengkap || '',
      username: u.username || '',
      nip: u.nip || '',
      no_telepon: u.no_telepon || '',
      password: '',
      role: u.role || 'Dokter Kecil UKS'
    })
    setIsFormOpen(true)
  }

  const handleSimpan = async (e) => {
    e.preventDefault()
    if (saving) return

    if (!form.nama_lengkap.trim() || form.nama_lengkap.trim().length < 3) {
      toast.error('Nama lengkap wajib diisi, minimal 3 karakter.')
      return
    }
    if (!form.nip.trim()) {
      toast.error('NIP/NIS wajib diisi!')
      return
    }

    // Aturan username sama dengan server — dicek di sini juga supaya
    // petugas tidak menunggu bolak-balik ke server untuk kesalahan ketik.
    const usernameError = validateUsername(form.username)
    if (usernameError) {
      toast.error(usernameError)
      return
    }

    if (!editing && (!form.password || form.password.length < 6)) {
      toast.error('Password wajib diisi, minimal 6 karakter.')
      return
    }

    setSaving(true)
    try {
      if (editing) {
        const res = await api.admin.updateUser(editing.id, {
          nama_lengkap: form.nama_lengkap,
          username: form.username,
          nip: form.nip,
          no_telepon: form.no_telepon,
          role: form.role
        })
        toast.success(res?.message || 'Akun berhasil diperbarui.')
        // Peran ikut di dalam token yang berlaku 8 jam.
        if (res?.catatan) toast.info(res.catatan)
      } else {
        const res = await api.admin.createUser(form)
        toast.success(res?.message || 'Akun berhasil dibuat.')
      }
      setIsFormOpen(false)
      await muat()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    if (savingPassword || !resetting) return

    if (!passwordBaru || passwordBaru.length < 6) {
      toast.error('Password baru minimal 6 karakter.')
      return
    }

    setSavingPassword(true)
    try {
      await api.admin.resetPassword(resetting.id, passwordBaru)
      toast.success(`Password ${resetting.username} berhasil diatur ulang.`)
      setResetting(null)
      setPasswordBaru('')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSavingPassword(false)
    }
  }

  const handleHapus = async () => {
    if (savingDelete || !deleting) return

    setSavingDelete(true)
    try {
      const res = await api.admin.deleteUser(deleting.id)
      toast.success(res?.message || 'Akun berhasil dihapus.')
      setDeleting(null)
      setKonfirmasiNama('')
      await muat()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSavingDelete(false)
    }
  }

  const columns = [
    {
      key: 'nama_lengkap',
      label: 'Nama',
      render: (val, row) => {
        const color = getInitialColor(val)
        return (
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ backgroundColor: color }}
            >
              {getInitials(val)}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-slate-900 truncate">{val}</div>
              <div className="text-[11px] text-slate-400 font-mono truncate">
                @{row.username}
                {row.id === userAktif?.id && (
                  <span className="ml-1.5 text-emerald-600 font-sans font-semibold">
                    (Anda)
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      }
    },
    {
      key: 'nip',
      label: 'NIP / NIS',
      width: '160px',
      render: (val) => <span className="font-mono text-xs text-slate-500">{val || '-'}</span>
    },
    {
      key: 'no_telepon',
      label: 'Telepon',
      width: '130px',
      render: (val) => <span className="font-mono text-xs text-slate-500">{val || '-'}</span>
    },
    {
      key: 'role',
      label: 'Peran',
      width: '150px',
      render: (val) =>
        val === 'Admin' ? (
          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md text-xs">
            <ShieldCheck className="w-3 h-3" />
            Admin
          </span>
        ) : (
          <span className="text-xs text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
            {val}
          </span>
        )
    },
    {
      key: 'aksi',
      label: 'Aksi',
      width: '130px',
      render: (_, row) => {
        const diriSendiri = row.id === userAktif?.id
        const adminTerakhir = row.role === 'Admin' && jumlahAdmin <= 1
        const bolehHapus = !diriSendiri && !adminTerakhir

        return (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => handleOpenUbah(row)}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-500 hover:text-emerald-700 transition-colors"
              title="Ubah akun"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setResetting(row)
                setPasswordBaru('')
              }}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-500 hover:text-amber-700 transition-colors"
              title="Reset password"
            >
              <KeyRound className="w-3.5 h-3.5" />
            </button>
            {bolehHapus && (
              <button
                onClick={() => {
                  setDeleting(row)
                  setKonfirmasiNama('')
                }}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600 transition-colors"
                title="Hapus akun"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )
      }
    }
  ]

  const inputClass =
    'w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400'
  const inputMono = `${inputClass} font-mono`

  return (
    <div className="space-y-5">
      <PageHeader title="">
        <button
          onClick={handleOpenTambah}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Buat Akun</span>
        </button>
      </PageHeader>

      {/* Peran dibaca dari token yang berlaku 8 jam — ini konsekuensi yang
          paling mudah terlewat saat admin mengubah peran seseorang. */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <p className="text-xs leading-relaxed">
          Perubahan peran baru berlaku setelah pengguna yang bersangkutan{' '}
          <strong>login ulang</strong>. Sesi yang sedang berjalan masih membawa peran lama
          hingga 8 jam.
        </p>
      </div>

      <div className="rounded-xl bg-white border border-slate-200 px-4 py-3 text-xs text-slate-500">
        {loading ? 'Memuat...' : `${users.length} akun terdaftar · ${jumlahAdmin} admin`}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Memuat daftar akun...</span>
        </div>
      ) : (
        <DataTable columns={columns} data={users} emptyMessage="Belum ada akun terdaftar." />
      )}

      {/* Modal Buat / Ubah Akun */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editing ? `Ubah Akun: ${editing.nama_lengkap}` : 'Buat Akun Baru'}
        size="md"
      >
        <form onSubmit={handleSimpan} className="space-y-4 text-sm">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.nama_lengkap}
              onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })}
              placeholder="Nama lengkap pengguna..."
              className={inputClass}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.username}
                onChange={(e) =>
                  setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, '') })
                }
                placeholder="huruf_kecil"
                className={inputMono}
                required
              />
              <p className="text-[11px] text-slate-400">
                4–20 karakter, huruf kecil, angka, underscore.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">
                NIP / NIS <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.nip}
                onChange={(e) => setForm({ ...form, nip: e.target.value.replace(/\D/g, '') })}
                placeholder="Nomor induk"
                className={inputMono}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">No. Telepon</label>
              <input
                type="text"
                value={form.no_telepon}
                onChange={(e) =>
                  setForm({ ...form, no_telepon: e.target.value.replace(/\D/g, '') })
                }
                placeholder="0812..."
                className={inputMono}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Peran</label>
              <CustomSelect
                options={ROLE_OPTIONS}
                value={form.role}
                onChange={(val) => setForm({ ...form, role: val })}
              />
            </div>
          </div>

          {/* Password hanya diisi saat membuat akun. Untuk akun yang sudah ada,
              penggantian password lewat tombol terpisah — dua tindakan dengan
              risiko berbeda tidak dicampur dalam satu tombol simpan. */}
          {!editing && (
            <div className="space-y-1.5 pt-4 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-500">
                Password Awal <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Minimal 6 karakter"
                className={inputMono}
                required
              />
              <p className="text-[11px] text-slate-400">
                Sampaikan password ini langsung ke pemiliknya, lalu minta segera diganti.
              </p>
            </div>
          )}

          {editing && form.role === 'Admin' && editing.role !== 'Admin' && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">
                Akun ini akan mendapat hak penuh: mengubah data induk siswa, identitas
                sekolah, dan seluruh akun pengguna.
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
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

      {/* Modal Reset Password — terpisah dari form ubah profil */}
      <Modal
        isOpen={!!resetting}
        onClose={() => setResetting(null)}
        title="Reset Password"
        size="sm"
      >
        {resetting && (
          <form onSubmit={handleReset} className="space-y-5 text-sm">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
              <KeyRound className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">
                Password baru untuk <strong>{resetting.nama_lengkap}</strong> (@
                {resetting.username}). Password lamanya langsung tidak berlaku.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">
                Password Baru <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={passwordBaru}
                onChange={(e) => setPasswordBaru(e.target.value)}
                placeholder="Minimal 6 karakter"
                className={inputMono}
                required
              />
              <p className="text-[11px] text-slate-400">
                Sampaikan langsung ke pemiliknya, lalu minta segera diganti.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setResetting(null)}
                className="px-4 py-2.5 rounded-lg bg-slate-100 text-slate-600 font-medium text-sm"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingPassword}
                className="px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {savingPassword ? 'Menyimpan...' : 'Atur Ulang'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Hapus — konfirmasi ganda dengan mengetik ulang username */}
      <Modal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Hapus Akun"
        size="sm"
      >
        {deleting && (
          <div className="space-y-5 text-sm">
            <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200 text-red-700">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm leading-relaxed">
                Hapus akun <strong>{deleting.nama_lengkap}</strong> (@{deleting.username})?
                Orang ini akan langsung kehilangan akses. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">
                Riwayat kunjungan yang pernah dicatatnya <strong>tetap tersimpan</strong> dan
                masih bisa dicetak.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">
                Ketik <span className="font-mono text-red-600">{deleting.username}</span> untuk
                mengonfirmasi
              </label>
              <input
                type="text"
                value={konfirmasiNama}
                onChange={(e) => setKonfirmasiNama(e.target.value)}
                placeholder={deleting.username}
                className={inputMono}
                autoComplete="off"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleting(null)}
                className="px-4 py-2.5 rounded-lg bg-slate-100 text-slate-600 font-medium text-sm"
              >
                Batal
              </button>
              <button
                onClick={handleHapus}
                disabled={savingDelete || konfirmasiNama !== deleting.username}
                className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {savingDelete ? 'Menghapus...' : 'Hapus Akun'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
