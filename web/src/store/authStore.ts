import { create } from 'zustand'
import { authApi } from '@/lib/api'
import type { User, LoginDto, RegisterDto } from '@/types'

interface AuthState {
    user: User | null
    token: string | null
    isLoading: boolean
    login: (dto: LoginDto) => Promise<void>
    register: (dto: RegisterDto) => Promise<void>
    logout: () => void
    checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: localStorage.getItem('token'),
    isLoading: false,

    login: async (dto: LoginDto) => {
        set({ isLoading: true })
        try {
            const response = await authApi.login(dto)
            localStorage.setItem('token', response.access_token)
            set({ user: response.user, token: response.access_token })
        } finally {
            set({ isLoading: false })
        }
    },

    register: async (dto: RegisterDto) => {
        set({ isLoading: true })
        try {
            const response = await authApi.register(dto)
            localStorage.setItem('token', response.access_token)
            set({ user: response.user, token: response.access_token })
        } finally {
            set({ isLoading: false })
        }
    },

    logout: () => {
        localStorage.removeItem('token')
        set({ user: null, token: null })
    },

    checkAuth: async () => {
        const token = localStorage.getItem('token')
        if (!token) {
            set({ user: null, token: null })
            return
        }

        try {
            const user = await authApi.getProfile()
            set({ user, token })
        } catch (error) {
            localStorage.removeItem('token')
            set({ user: null, token: null })
        }
    },
}))
