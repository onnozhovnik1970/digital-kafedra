'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'
import { getDepartmentReportData, DepartmentReportData } from '@/lib/exportData'
import { exportDepartmentReportExcel } from '@/lib/exportExcel'

function getCurrentAcademicYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  return month >= 9 ? `${year}-${year + 1}` : `${year - 1}-${year}`
}

export default function DepartmentReportPage() {
  const [report, setReport] = useState<DepartmentReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const academicYear = getCurrentAcademicYear()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, department_id')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'head' || !profile.department_id) {
        router.push('/dashboard')
        return
      }

      const { data: department } = await supabase
        .from('departments')
        .select('name')
        .eq('id', profile.department_id)
        .single()

      const data = await getDepartmentReportData(
        supabase,
        profile.department_id,
        department?.name ?? 'Кафедра',
        academicYear
      )
      setReport(data)
      setLoading(false)
    }
    init()
  }, [])

  if (loading || !report) {
    return <div className="min-h-screen flex items-center justify-center">Завантаження звіту...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .print-container { box-shadow: none !important; margin: 0 !important; }
        }
      `}</style>

      <nav className="no-print bg-white shadow-sm px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">🎓 Цифровий завкаф</h1>
        <div className="flex gap-3">
          <button
            onClick={() => exportDepartmentReportExcel(report)}
            className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            📊 Excel
          </button>
          <button
            onClick={() => window.print()}
            className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            🖨️ Друк / PDF
          </button>
          <button onClick={() => router.push('/admin/rating')} className="text-sm text-gray-500 hover:text-blue-600">
            ← Назад
          </button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-8 py-12">
        <div className="print-container bg-white rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800">Рейтинг кафедри — {report.departmentName}</h2>
          <p className="text-gray-500 mb-6">{report.academicYear} навчальний рік</p>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-800">
                <th className="text-left py-2">№</th>
                <th className="text-left py-2">ПІБ</th>
                <th className="text-right py-2">Бали</th>
                <th className="text-right py-2">Статус</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((row, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="py-2">{idx + 1}</td>
                  <td className="py-2 font-medium text-gray-800">{row.fullName}</td>
                  <td className="py-2 text-right font-semibold">{row.totalPoints}</td>
                  <td className="py-2 text-right text-gray-500">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {report.rows.length === 0 && (
            <p className="text-gray-400 text-center py-8">На кафедрі ще немає викладачів.</p>
          )}

          <div className="flex justify-between items-center border-t-2 border-gray-800 pt-4 mt-6 text-sm">
            <span className="font-bold text-gray-800">Разом / середній бал</span>
            <span className="font-bold text-gray-800">{report.totalPoints} / сер. {report.averagePoints}</span>
          </div>
        </div>
      </main>
    </div>
  )
}
