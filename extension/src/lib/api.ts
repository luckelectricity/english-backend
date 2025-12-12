import axios from 'axios';
import { storage } from './storage';

const api = axios.create({
    baseURL: 'http://localhost:3000/api', // Assume local dev for now
    headers: {
        'Content-Type': 'application/json',
    },
});

// Helper to get token from storage
const getToken = async () => {
    return await storage.get('token');
};

// Interceptor to add token
api.interceptors.request.use(async (config) => {
    const token = await getToken();
    console.log('[API] Interceptor token:', token); // Debug log
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor to unpack standard response format
api.interceptors.response.use(
    (response) => {
        const apiResponse = response.data;
        if (apiResponse.code === 200 || apiResponse.code === 201) {
            return { ...response, data: apiResponse.data };
        } else {
            return Promise.reject(new Error(apiResponse.message || 'Error'));
        }
    },
    (error) => {
        if (error.response && error.response.data) {
            return Promise.reject(new Error(error.response.data.message || 'Request failed'));
        }
        return Promise.reject(error);
    }
);

export const authApi = {
    login: async (email: string, password: string): Promise<{ access_token: string; user: any }> => {
        const { data } = await api.post('/auth/login', { email, password });
        return data;
    },
    getProfile: async () => {
        const { data } = await api.get('/auth/profile');
        return data;
    }
};

export const aiApi = {
    expand: async (word: string, contextSentence: string, contextId?: number): Promise<any> => {
        const { data } = await api.post('/ai/expand', { word, sentence: contextSentence, contextId });
        return data;
    }
};

export default api;
