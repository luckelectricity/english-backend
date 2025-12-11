export * from './ai'
export interface User {
    id: number
    email: string
    name: string | null
    role: 'user' | 'vip' | 'vvip' | 'admin'
    vipExpireAt: string | null
    vvipExpireAt: string | null
    createdAt: string
    updatedAt: string
}

export interface Word {
    id: number
    text: string
    phonetic?: string | null
    userId: number
    createdAt: string
    updatedAt: string
    contexts: Context[]
}

export interface Context {
    id: number
    sentence: string
    meaning: string
    sourceUrl: string | null
    wordId: number
    createdAt: string
}

export interface CreateWordDto {
    word: string
    sentence: string
    meaning: string
    sourceUrl?: string
}

export interface UpdateWordDto {
    phonetic?: string
}

export interface LoginDto {
    email: string
    password: string
}

export interface RegisterDto {
    email: string
    password: string
    name?: string
}

export interface AuthResponse {
    access_token: string
    user: User
}

export interface OxfordProgress {
    total: number
    learned: number
    byLevel: {
        A1: { total: number; learned: number }
        A2: { total: number; learned: number }
        B1: { total: number; learned: number }
        B2: { total: number; learned: number }
    }
}
