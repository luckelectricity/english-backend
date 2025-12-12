import { useState, useEffect } from 'react'
import { authApi } from '../lib/api'
import { Loader2, LogIn, User, Power } from 'lucide-react'
import { storage } from '../lib/storage'

function App() {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [userProfile, setUserProfile] = useState<any>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = await storage.get('token')
      if (token) {
        setToken(token)
        fetchProfile()
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchProfile = async () => {
    try {
      const profile = await authApi.getProfile()
      setUserProfile(profile)
    } catch (e) {
      // Token might be invalid
      handleLogout()
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await authApi.login(email, password)
      await storage.set('token', data.access_token)
      setToken(data.access_token)

      // Notify background to sync words
      try {
        chrome.runtime.sendMessage({ type: 'LOGIN_SUCCESS' })
      } catch (e) {
        // Ignore if running in dev mode outside extension
        console.log('Sync trigger failed (dev mode?)')
      }

      fetchProfile()
    } catch (err: any) {
      setError(err.response?.data?.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await storage.remove('token')
    setToken(null)
    setUserProfile(null)
  }

  if (loading && !token) {
    return (
      <div className="flex w-full h-full min-h-[480px] items-center justify-center p-8 bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="w-full h-full min-h-[480px] bg-slate-50 p-6 flex flex-col">
      <div className="mb-8 text-center pt-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">English Assistant</h1>
        <p className="text-sm text-slate-500 mt-2 font-medium">伴你在浏览中学习</p>
      </div>

      {token && userProfile ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="relative group">
            <div className="absolute inset-0 bg-blue-200 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative h-24 w-24 bg-white border-2 border-slate-100 rounded-full flex items-center justify-center shadow-sm">
              <User className="h-12 w-12 text-blue-600" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h2 className="font-bold text-xl text-slate-900">{userProfile.name || userProfile.email.split('@')[0]}</h2>
            <p className="text-sm text-slate-500">{userProfile.email}</p>
            <div className="pt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                {userProfile.role === 'vip' ? 'VIP 会员' : '普通用户'}
              </span>
            </div>
          </div>

          <div className="w-full pt-6 border-t border-slate-200/60">
            <div className="flex items-center justify-between text-sm px-4">
              <span className="text-slate-600">正在学习</span>
              <span className="font-bold text-slate-900 text-lg">{userProfile._count?.words || 0} <span className="text-xs font-normal text-slate-400">词</span></span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="mt-auto w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:text-red-600 hover:border-red-100 hover:bg-red-50 transition-all duration-200"
          >
            <Power className="h-4 w-4" />
            退出登录
          </button>
        </div>
      ) : (
        <form onSubmit={handleLogin} className="space-y-5 flex-1 flex flex-col justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          {error && (
            <div className="p-4 text-sm text-red-600 bg-red-50/80 border border-red-100 rounded-xl animate-in zoom-in-95">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 ml-1">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm bg-white text-slate-900 placeholder:text-slate-400"
              placeholder="user@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 ml-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm bg-white text-slate-900 placeholder:text-slate-400"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-xl font-medium hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-slate-900/10 active:scale-[0.98] mt-4"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                登 录
              </>
            )}
          </button>
        </form>
      )}
    </div>
  )
}

export default App

