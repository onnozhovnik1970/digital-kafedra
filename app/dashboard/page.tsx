'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) router.push('/auth/login')
      else setUser(user)
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            onClick={() => router.push('/profile')}
            className="bg-white rounded-2xl p-6 shadow-sm cursor-pointer hover:shadow-md transition"
          >
            <div className="text-3xl mb-3">👤</div>
            <h3 className="font-semibold text-gray-800">Мій профіль</h3>
            <p className="text-gray-400 text-sm mt-1">ПІБ, посада, ступінь</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm cursor-pointer hover:shadow-md transition">
            <div className="text-3xl mb-3">📚</div>
            <h3 className="font-semibold text-gray-800">Публікації</h3>
            <p className="text-gray-400 text-sm mt-1">Додати публікацію</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm cursor-pointer hover:shadow-md transition">
            <div className="text-3xl mb-3">🏆</div>
            <h3 className="font-semibold text-gray-800">Сертифікати</h3>
            <p className="text-gray-400 text-sm mt-1">Підвищення кваліфікації</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm cursor-pointer hover:shadow-md transition">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-semibold text-gray-800">Звітність</h3>
            <p className="text-gray-400 text-sm mt-1">Експорт у PDF/Excel</p>
          </div>
        </div>
      </main>
    </div>
  )
}