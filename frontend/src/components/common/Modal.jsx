import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const overlayRef = useRef(null)
  const contentRef = useRef(null)

  // Simpan versi terbaru dari onClose di dalam ref. Kalau parent (mis.
  // DataSiswa) re-render setiap kali user mengetik di form, prop onClose
  // yang berupa arrow function inline akan selalu jadi reference BARU.
  // Kalau onClose langsung dipakai sebagai dependency useEffect di bawah,
  // effect itu akan cleanup + jalan ulang setiap keystroke — dan itu yang
  // menyebabkan fokus keyboard "dicuri balik" ke elemen pertama (tombol X)
  // setiap kali user mengetik satu huruf.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  }

  useEffect(() => {
    if (!isOpen) return

    // Ingat elemen yang tadinya fokus supaya bisa dikembalikan saat modal
    // ditutup — tanpa ini, fokus keyboard "hilang" ke awal halaman.
    const sebelumnya = document.activeElement

    const elemenFokusable = () => {
      if (!contentRef.current) return []
      return Array.from(
        contentRef.current.querySelectorAll(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null)
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCloseRef.current()
        return
      }

      // Kurung fokus di dalam modal: Tab dari elemen terakhir kembali ke
      // elemen pertama, dan sebaliknya untuk Shift+Tab.
      if (e.key !== 'Tab') return

      const daftar = elemenFokusable()
      if (daftar.length === 0) {
        e.preventDefault()
        return
      }

      const pertama = daftar[0]
      const terakhir = daftar[daftar.length - 1]

      if (e.shiftKey && document.activeElement === pertama) {
        e.preventDefault()
        terakhir.focus()
      } else if (!e.shiftKey && document.activeElement === terakhir) {
        e.preventDefault()
        pertama.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    // Pindahkan fokus ke dalam modal setelah animasi buka dimulai.
    // Effect ini sekarang HANYA jalan saat isOpen berubah (lihat dependency
    // array di bawah), bukan setiap kali parent re-render, jadi fokus tidak
    // akan direbut ulang lagi selagi user sedang mengetik.
    const timer = setTimeout(() => {
      const daftar = elemenFokusable()
      if (daftar.length > 0) daftar[0].focus()
      else contentRef.current?.focus()
    }, 0)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      if (sebelumnya instanceof HTMLElement) sebelumnya.focus()
    }
  }, [isOpen]) // ⚠️ onClose SENGAJA tidak dimasukkan ke sini, lihat catatan di atas

  if (!isOpen) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" />

      {/* Content */}
      <div
        ref={contentRef}
        className={`
          relative bg-white border border-slate-200 rounded-2xl shadow-2xl
          w-full ${sizeClasses[size] || sizeClasses.md}
          max-h-[90vh] overflow-y-auto z-10
          animate-modal-in text-slate-800
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md z-10 flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 id="modal-title" className="text-lg font-bold font-display text-slate-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {children}
        </div>
      </div>

      <style>{`
        @keyframes modal-in {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(12px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-modal-in {
          animation: modal-in 200ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
    </div>
  )
}