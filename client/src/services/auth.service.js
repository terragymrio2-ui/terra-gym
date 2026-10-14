import { api } from './api'

export const authService = {
    login: async (credentials) => (await api.post('/auth/login', credentials)).data.data,
    logout: async () => (await api.post('/auth/logout')).data,
    me: async () => (await api.get('/auth/me')).data.data,
    changePassword: async (payload) => (await api.patch('/auth/change-password', payload)).data,
}