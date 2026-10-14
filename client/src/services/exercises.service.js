import { api } from './api'

export const exercisesService = {
    list: async (params) => (await api.get('/exercises', { params })).data.data,
    create: async (payload) => (await api.post('/exercises', payload)).data.data,
    update: async (id, payload) => (await api.patch(`/exercises/${id}`, payload)).data.data,
    setStatus: async (id, isActive) =>
        (await api.patch(`/exercises/${id}/status`, { isActive })).data.data,
    remove: async (id) => (await api.delete(`/exercises/${id}`)).data,
}