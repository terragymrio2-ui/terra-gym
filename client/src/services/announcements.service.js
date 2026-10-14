import { api } from './api'

export const announcementsService = {
    preview: async (audience) => (await api.get('/announcements/preview', { params: { audience } })).data.data,
    list: async (params) => (await api.get('/announcements', { params })).data.data,
    create: async (payload) => (await api.post('/announcements', payload)).data.data,
    setStatus: async (id, isActive) =>
        (await api.patch(`/announcements/${id}/status`, { isActive })).data,
    pending: async () => (await api.get('/announcements/me/pending')).data.data,
    markRead: async (id) => (await api.post(`/announcements/${id}/read`)).data,
}