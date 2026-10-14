import { api } from './api'

export const dashboardService = {
    admin: async () => (await api.get('/dashboard/admin')).data.data,
    trainer: async () => (await api.get('/dashboard/trainer')).data.data,
    member: async () => (await api.get('/dashboard/member')).data.data,
}