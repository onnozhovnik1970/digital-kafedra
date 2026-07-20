'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [profile, setProfile] = useState({
    full_name: '',
    position: '',
    degree: '',
    rank: '',
    email: '',
    phone: '',
    bio: '',
  })
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUser(user)
      
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (data) setProfile(data)
    }
    getUser()
  }, [])

  const handleSave = async () => {
    setLoading(true)
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...profile })
    
    if (!error) setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">🎓 Цифровий завкаф</h1>
        <button onClick={() => router.push('/dashboard')} className="text-sm text-gray-500 hover:text-blue-600">
          ← Назад до кабінету
        </button>
      </nav>

      <main className="max-w-2xl mx-auto px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-8">👤 Мій профіль</h2>

        <div className="bg-white rounded-2xl p-8 shadow-sm space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ПІБ</label>
            <input
              type="text"
              placeholder="Іваненко Іван Іванович"
              value={profile.full_name}
              onChange={(e) => setProfile({...profile, full_name: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Посада</label>
            <select
              value={profile.position}
              onChange={(e) => setProfile({...profile, position: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Оберіть посаду</option>
              <option value="Професор">Професор</option>
              <option value="Доцент">Доцент</option>
              <option value="Старший викладач">Старший викладач</option>
              <option value="Викладач">Викладач</option>
              <option value="Асистент">Асистент</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Науковий ступінь</label>
            <select
              value={profile.degree}
              onChange={(e) => setProfile({...profile, degree: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Оберіть ступінь</option>
              <option value="Доктор наук">Доктор наук</option>
              <option value="Кандидат наук">Кандидат наук</option>
              <option value="PhD">PhD</option>
              <option value="Без ступеня">Без ступеня</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Вчене звання</label>
            <select
              value={profile.rank}
              onChange={(e) => setProfile({...profile, rank: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Оберіть звання</option>
              <option value="Професор">Професор</option>
              <option value="Доцент">Доцент</option>
              <option value="Старший дослідник">Старший дослідник</option>
              <option value="Без звання">Без звання</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Телефон</label>
            <input
              type="text"
              placeholder="+380..."
              value={profile.phone}
              onChange={(e) => setProfile({...profile, phone: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Коротко про себе</label>
            <textarea
              placeholder="Сфера наукових інтересів, досягнення..."
              value={profile.bio}
              onChange={(e) => setProfile({...profile, bio: e.target.value})}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Збереження...' : saved ? '✅ Збережено!' : 'Зберегти профіль'}
          </button>
        </div>
      </main>
    </div>
  )
}