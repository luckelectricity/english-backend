import axios from 'axios'
import type {
    AuthResponse,
    LoginDto,
    RegisterDto,
    User,
    Word,
    CreateWordDto,
    UpdateWordDto,
    OxfordProgress,
} from '@/types'

// 统一响应格式
interface ApiResponse<T = any> {
    code: number
    message: string
    data: T
}

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
})

// 请求拦截器：自动添加 token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// 响应拦截器：处理统一响应格式和错误
api.interceptors.response.use(
    (response) => {
        // 解包统一响应格式
        const apiResponse = response.data as ApiResponse
        if (apiResponse.code === 200 || apiResponse.code === 201) {
            // 成功响应，返回 data 部分
            return { ...response, data: apiResponse.data }
        } else {
            // 业务错误
            return Promise.reject(new Error(apiResponse.message))
        }
    },
    (error) => {
        if (error.response) {
            const apiResponse = error.response.data as ApiResponse

            // 401 未授权，清除 token 并跳转登录
            if (error.response.status === 401) {
                localStorage.removeItem('token')
                window.location.href = '/login'
            }

            // 返回业务错误信息
            return Promise.reject(new Error(apiResponse.message || '请求失败'))
        }
        return Promise.reject(error)
    }
)

// 认证 API
export const authApi = {
    login: async (dto: LoginDto): Promise<AuthResponse> => {
        const { data } = await api.post<AuthResponse>('/auth/login', dto)
        return data
    },

    register: async (dto: RegisterDto): Promise<AuthResponse> => {
        const { data } = await api.post<AuthResponse>('/auth/register', dto)
        return data
    },

    getProfile: async (): Promise<User> => {
        const { data } = await api.get<User>('/auth/profile')
        return data
    },
}

// 单词 API
export const wordApi = {
    create: async (dto: CreateWordDto): Promise<Word> => {
        const { data } = await api.post<Word>('/words', dto)
        return data
    },

    list: async (): Promise<Word[]> => {
        const { data } = await api.get<Word[]>('/words')
        return data
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/words/${id}`)
    },

    getOxfordProgress: async (): Promise<OxfordProgress> => {
        const { data } = await api.get<OxfordProgress>('/words/oxford-progress')
        return data
    },

    update: async (id: number, dto: UpdateWordDto): Promise<Word> => {
        const { data } = await api.patch<Word>(`/words/${id}`, dto)
        return data
    },
}

export const aiApi = {
    expand: async (word: string, sentence: string, contextId?: number): Promise<import('@/types').AiExpandResponse> => {
        const { data } = await api.post<import('@/types').AiExpandResponse>('/ai/expand', { word, sentence, contextId })
        return data
    }
}

export const adminApi = {
    getUsers: async (): Promise<any[]> => {
        const { data } = await api.get('/admin/users')
        return data
    },
    updateRole: async (email: string, role: string): Promise<any> => {
        const { data } = await api.patch('/admin/users/role', { email, role })
        return data
    }
}

export default api
