import { api } from './api'

export const membershipPlansService = {
    list: async () => (await api.get('/membership-plans')).data.data,
    create: async (payload) => (await api.post('/membership-plans', payload)).data.data,
    update: async (id, payload) => (await api.patch(`/membership-plans/${id}`, payload)).data.data,
    setStatus: async (id, isActive) =>
        (await api.patch(`/membership-plans/${id}/status`, { isActive })).data.data,
}