import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, BookOpen, GraduationCap, LogOut } from 'lucide-react'

export default function AppLayout() {
    const location = useLocation()
    const navigate = useNavigate()
    const user = useAuthStore((state) => state.user)
    const logout = useAuthStore((state) => state.logout)

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/words', label: '生词本', icon: BookOpen },
        { path: '/review', label: '复习', icon: GraduationCap },
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* 侧边栏 */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r shadow-sm">
                <div className="p-6">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        English Learning
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">语境采集器</p>
                </div>

                <nav className="px-3 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = location.pathname === item.path
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                            >
                                <Icon className="h-5 w-5" />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                {/* 用户信息 */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{user?.name || user?.email}</div>
                            <div className="text-xs text-muted-foreground capitalize">{user?.role}</div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleLogout} title="退出登录">
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </aside>

            {/* 主内容区 */}
            <main className="ml-64 p-8">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
