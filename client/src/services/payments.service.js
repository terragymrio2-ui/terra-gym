import { api } from './api'

export const paymentsService = {
    list: async (params) => (await api.get('/payments', { params })).data.data,
    register: async (payload) => (await api.post('/payments', payload)).data.data,
    void: async (id, reason) => (await api.patch(`/payments/${id}/void`, { reason })).data.data,
}