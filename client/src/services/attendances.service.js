import { api } from './api'

export const attendancesService = {
    lookup: async (search) => (await api.get('/attendances/lookup', { params: { search } })).data.data,
    list: async (params) => (await api.get('/attendances', { params })).data.data,
    checkIn: async (payload) => (await api.post('/attendances', payload)).data.data,
    void: async (id, reason) => (await api.patch(`/attendances/${id}/void`, { reason })).data,
    mine: async (month) => (await api.get('/attendances/me', { params: { month } })).data.data,
}