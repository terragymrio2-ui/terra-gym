import { api } from './api'

export const trainingTemplatesService = {
    list: async (params) => (await api.get('/training-templates', { params })).data.data,
    get: async (id) => (await api.get(`/training-templates/${id}`)).data.data,
    create: async (payload) => (await api.post('/training-templates', payload)).data.data,
    update: async (id, payload) => (await api.put(`/training-templates/${id}`, payload)).data.data,
    duplicate: async (id) => (await api.post(`/training-templates/${id}/duplicate`)).data.data,
    remove: async (id) => (await api.delete(`/training-templates/${id}`)).data,
}