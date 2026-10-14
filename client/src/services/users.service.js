import { api } from './api'

export const usersService = {
    list: async (params) => (await api.get('/users', { params })).data.data,
    create: async (payload) => (await api.post('/users', payload)).data.data,
    update: async (id, payload) => (await api.patch(`/users/${id}`, payload)).data.data,
    setStatus: async (id, isActive) =>
        (await api.patch(`/users/${id}/status`, { isActive })).data.data,
    resetPassword: async (id) => (await api.patch(`/users/${id}/reset-password`)).data.data,
}