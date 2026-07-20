'use client'

import { useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleAuth = async () => {
    setLoading(true)
    setMessage('')

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage(error.message)
      else router.push('/dashboard')
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMessage(error.message)
      else setMessage('Перевірте email для підтвердження реєстрації!')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
          🎓 Цифровий завкаф
        </h1>
        <p className="text-center text-gray-500 mb-8">
          {isLogin ? 'Вхід до системи' : 'Реєстрація'}
        </p>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {message && (
            <p className="text-sm text-center text-blue-600">{message}</p>
          )}

          <button
            onClick={handleAuth}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Завантаження...' : isLogin ? 'Увійти' : 'Зареєструватись'}
          </button>

          <button
            onClick={() => setIsLogin(!isLogin)}
            className="w-full text-gray-500 text-sm hover:text-blue-600 transition"
          >
            {isLogin ? 'Немає акаунту? Зареєструватись' : 'Вже є акаунт? Увійти'}
          </button>
        </div>
      </div>
    </div>
  )
}