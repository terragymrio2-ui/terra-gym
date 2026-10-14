import { api } from './api'

export const trainingPlansService = {
    overview: async (params) => (await api.get('/training-plans/overview', { params })).data.data,
    listForMember: async (memberId) =>
        (await api.get(`/training-plans/member/${memberId}`)).data.data,
    get: async (id) => (await api.get(`/training-plans/${id}`)).data.data,
    mine: async () => (await api.get('/training-plans/me')).data.data,
    assign: async (payload) => (await api.post('/training-plans/assign', payload)).data.data,
    create: async (payload) => (await api.post('/training-plans', payload)).data.data,
    update: async (id, payload) => (await api.put(`/training-plans/${id}`, payload)).data.data,
    setStatus: async (id, isActive) =>
        (await api.patch(`/training-plans/${id}/status`, { isActive })).data.data,
}