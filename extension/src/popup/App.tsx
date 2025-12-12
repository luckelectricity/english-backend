import { useState, useEffect } from 'react'
import { authApi } from '../lib/api'
import { Loader2, LogIn, Power } from 'lucide-react'
import { storage } from '../lib/storage'

function App() {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [userProfile, setUserProfile] = useState<any>(null)
  const [recentWords, setRecentWords] = useState<any[]>([])

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = await storage.get('token')
      if (token) {
        setToken(token as string)
        await fetchProfile()
        await fetchRecentWords()
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
      handleLogout()
    }
  }

  const fetchRecentWords = async () => {
    try {
      const data = await storage.get('learning_words')
      const words = (Array.isArray(data) ? data : []) as any[]
      // Take top 50
      setRecentWords(words.slice(0, 50))
    } catch (e) {
      console.error('Failed to load words', e)
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

      try {
        chrome.runtime.sendMessage({ type: 'LOGIN_SUCCESS' })
      } catch (e) {
        console.log('Sync trigger failed (dev mode?)')
      }

      await fetchProfile()
      setTimeout(fetchRecentWords, 1000)
    } catch (err: any) {
      setError(err.response?.data?.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await storage.remove('token')
    await storage.remove('learning_words')
    setToken(null)
    setUserProfile(null)
    setRecentWords([])
  }

  const openDashboard = () => {
    window.open('http://english.166211.xyz', '_blank')
  }

  if (loading && !token) {
    return (
      <div className="flex w-full h-full min-h-[480px] items-center justify-center p-8 bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    )
  }

  // Login View
  if (!token || !userProfile) {
    return (
      <div className="w-full h-full min-h-[480px] bg-slate-50 p-6 flex flex-col">
        <div className="mb-8 text-center pt-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">English Assistant</h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">伴你在浏览中学习</p>
        </div>
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
      </div>
    );
  }

  // Authenticated View (Minimalist)
  return (
    <div className="w-full h-full min-h-[480px] bg-slate-50 flex flex-col">
      {/* Header: User Info & Actions */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs ring-2 ring-white">
            {userProfile.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 text-sm max-w-[100px] truncate">{userProfile.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${['vip', 'vvip', 'admin'].includes(userProfile.role)
                ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-100 text-slate-600'
                }`}>
                {['vip', 'vvip', 'admin'].includes(userProfile.role) ? (userProfile.role === 'vvip' ? 'VVIP' : 'VIP') : 'Free'}
              </span>
            </div>
            <div className="text-[10px] text-slate-500">
              已收录 {userProfile._count?.words || recentWords.length} 词
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openDashboard}
            className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-md hover:bg-slate-800 transition-colors"
          >
            后台管理
          </button>
          <button
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
            title="退出登录"
          >
            <Power size={16} />
          </button>
        </div>
      </div>

      {/* Main Content: Recent Words */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {recentWords.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-sm">
            <p>暂无生词</p>
            <p className="text-xs mt-1">在网页上划词以添加</p>
          </div>
        ) : (
          recentWords.map((word: any) => (
            <div key={word.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-slate-800 text-sm">{word.text}</span>
                <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                  {new Date(word.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="text-xs text-slate-600 line-clamp-2">
                {word.contexts?.[0]?.meaning || '暂无释义'}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Simple Footer/Status */}
      <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 text-center text-[10px] text-slate-400">
        最近添加的 50 个生词
      </div>
    </div>
  )
}

export default App

