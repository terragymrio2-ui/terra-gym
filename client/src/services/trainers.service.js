import { api } from './api'

export const trainersService = {
    listMembers: async (trainerId) => (await api.get(`/trainers/${trainerId}/members`)).data.data,
    addMembers: async (trainerId, memberIds) =>
        (await api.post(`/trainers/${trainerId}/members`, { memberIds })).data.data,
    removeMember: async (trainerId, memberId) =>
        (await api.delete(`/trainers/${trainerId}/members/${memberId}`)).data,
}