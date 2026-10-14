import * as service from '../services/memberships.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { parseId } from '../utils/parseId.js'
import { sendSuccess } from '../utils/response.js'
import { listMembershipsQuery } from '../validators/memberships.validator.js'

export const list = asyncHandler(async (req, res) => {
    sendSuccess(res, await service.list(listMembershipsQuery.parse(req.query)))
})

export const getById = asyncHandler(async (req, res) => {
    sendSuccess(res, await service.getById(parseId(req.params.id)))
})

export const me = asyncHandler(async (req, res) => {
    sendSuccess(res, await service.listForMember(req.user.id))
})

export const create = asyncHandler(async (req, res) => {
    sendSuccess(res, await service.create(req.body, req.user.id), 'Membresía creada', 201)
})

export const cancel = asyncHandler(async (req, res) => {
    sendSuccess(res, await service.cancel(parseId(req.params.id)), 'Membresía cancelada')
})