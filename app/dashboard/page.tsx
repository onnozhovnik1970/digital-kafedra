'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'
import { RatingProgressBar } from '@/components/RatingProgressBar'
import { getLecturerRatingPoints, getDepartmentThreshold, RatingThresholds } from '@/lib/rating'

/** Ukrainian academic year runs Sept 1 - Aug 31. Sept 2026 -> '2026-2027'. */
function getCurrentAcademicYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  return month >= 9 ? `${year}-${year + 1}` : `${year - 1}-${year}`
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)
  const [points, setPoints] = useState<number | null>(null)
  const [thresholds, setThresholds] = useState<RatingThresholds | null>(null)
  const router = useRouter()
  const academicYear = getCurrentAcademicYear()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUser(user)

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, department_id')
        .eq('id', user.id)
        .single()

      if (profile) {
        setRole(profile.role)
        if (profile.department_id) {
          const [pts, th] = await Promise.all([
            getLecturerRatingPoints(supabase, user.id),
            getDepartmentThreshold(supabase, profile.department_id, academicYear),
          ])
          setPoints(pts)
          setThresholds(th)
        }
      }
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (!user) return <div className="min-h-screen flex items-center justify-center">Завантаження...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">🎓 Цифровий завкаф</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-500 text-sm">{user.email}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Вийти
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          🎓 Вітаємо у «Цифровому завкафі»!
        </h2>
        <p className="text-gray-500 mb-8">Відстежуйте свій рейтинг, відповідність ліцензійним вимогам та формуйте звіти в один клік</p>

        {points !== null && thresholds && (
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
            <RatingProgressBar points={points} thresholds={thresholds} academicYear={academicYear} />
          </div>
        )}
        {points !== null && !thresholds && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-8 text-sm text-yellow-800">
            Завкаф ще не налаштував пороги рейтингу для {academicYear} н.р.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            onClick={() => router.push('/profile')}
            className="bg-white rounded-2xl p-6 shadow-sm cursor-pointer hover:shadow-md transition"
          >
            <div className="text-3xl mb-3">👤</div>
            <h3 className="font-semibold text-gray-800">Мій профіль</h3>
            <p className="text-gray-400 text-sm mt-1">ПІБ, посада, ступінь</p>
          </div>
          <div
            onClick={() => router.push('/publications')}
            className="bg-white rounded-2xl p-6 shadow-sm cursor-pointer hover:shadow-md transition"
          >
            <div className="text-3xl mb-3">📚</div>
            <h3 className="font-semibold text-gray-800">Публікації</h3>
            <p className="text-gray-400 text-sm mt-1">Додати публікацію</p>
          </div>
          <div
            onClick={() => router.push('/qualifications')}
            className="bg-white rounded-2xl p-6 shadow-sm cursor-pointer hover:shadow-md transition"
          >
            <div className="text-3xl mb-3">🏆</div>
            <h3 className="font-semibold text-gray-800">Сертифікати</h3>
            <p className="text-gray-400 text-sm mt-1">Підвищення кваліфікації</p>
          </div>
          <div
            onClick={() => router.push('/work-entries')}
            className="bg-white rounded-2xl p-6 shadow-sm cursor-pointer hover:shadow-md transition"
          >
            <div className="text-3xl mb-3">📋</div>
            <h3 className="font-semibold text-gray-800">Додати інші види робіт</h3>
            <p className="text-gray-400 text-sm mt-1">Методичка, оргроботи, керівництво студентами</p>
          </div>
          <div
  onClick={() => router.push('/reports')}
  className="bg-white rounded-2xl p-6 shadow-sm cursor-pointer hover:shadow-md transition"
>
  <div className="text-3xl mb-3">📊</div>
  <h3 className="font-semibold text-gray-800">Звітність</h3>
  <p className="text-gray-400 text-sm mt-1">Експорт у PDF/Excel</p>
</div>
{role === 'head' && (
  <>
    <div
      onClick={() => router.push('/admin/rating')}
      className="bg-white rounded-2xl p-6 shadow-sm cursor-pointer hover:shadow-md transition border-2 border-blue-100"
    >
      <div className="text-3xl mb-3">⚙️</div>
      <h3 className="font-semibold text-gray-800">Рейтинг кафедри</h3>
      <p className="text-gray-400 text-sm mt-1">Пороги та зведена таблиця</p>
    </div>
    <div
      onClick={() => router.push('/admin/work-approvals')}
      className="bg-white rounded-2xl p-6 shadow-sm cursor-pointer hover:shadow-md transition border-2 border-blue-100"
    >
      <div className="text-3xl mb-3">✅</div>
      <h3 className="font-semibold text-gray-800">Записи на розгляді</h3>
      <p className="text-gray-400 text-sm mt-1">Затвердження видів робіт викладачів</p>
    </div>
    <div
      onClick={() => router.push('/admin/evaluations')}
      className="bg-white rounded-2xl p-6 shadow-sm cursor-pointer hover:shadow-md transition border-2 border-blue-100"
    >
      <div className="text-3xl mb-3">📝</div>
      <h3 className="font-semibold text-gray-800">Анкетування та оцінка занять</h3>
      <p className="text-gray-400 text-sm mt-1">Опитування студентів, експертна оцінка</p>
    </div>
  </>
)}
        </div>
      </main>
    </div>
  )
}
