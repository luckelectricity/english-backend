import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

interface ProtectedRouteProps {
    children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const [isChecking, setIsChecking] = useState(true)
    const token = useAuthStore((state) => state.token)
    const user = useAuthStore((state) => state.user)
    const checkAuth = useAuthStore((state) => state.checkAuth)

    useEffect(() => {
        const verify = async () => {
            if (token && !user) {
                await checkAuth()
            }
            setIsChecking(false)
        }
        verify()
    }, [token, user, checkAuth])

    if (isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-muted-foreground">验证中...</div>
            </div>
        )
    }

    if (!token || !user) {
        return <Navigate to="/login" replace />
    }

    return <>{children}</>
}
