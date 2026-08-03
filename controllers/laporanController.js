import pool from '../db/db.js'

export const laporanController = {
  getMonthlyReport: async (req, res) => {
    try {
      const bulan = req.query.bulan || new Date().getMonth() + 1
      const tahun = req.query.tahun || new Date().getFullYear()

      const [visits] = await pool.query('SELECT * FROM kunjungan')
      const totalKunjungan = visits.length
      const totalDarurat = visits.filter((v) => v.is_darurat).length

      res.json({
        success: true,
        data: {
          bulan,
          tahun,
          totalKunjungan,
          totalDarurat
        }
      })
    } catch (err) {
      res.status(500).json({ success: false, message: err.message })
    }
  }
}
