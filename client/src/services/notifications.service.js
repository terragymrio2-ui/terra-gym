import { api } from './api'

export const notificationsService = {
    expirations: async (params) => (await api.get('/notifications/expirations', { params })).data.data,
    logWhatsapp: async (membershipId) =>
        (await api.post(`/notifications/whatsapp/${membershipId}`)).data.data,
}