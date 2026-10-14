import * as service from '../services/trainingPlans.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { parseId } from '../utils/parseId.js'
import { sendSuccess } from '../utils/response.js'
import { overviewQuery } from '../validators/trainingPlans.validator.js'

export const overview = asyncHandler(async (req, res) => {
    sendSuccess(res, await service.overview(overviewQuery.parse(req.query)))
})

export const listForMember = asyncHandler(async (req, res) => {
    sendSuccess(res, await service.listForMember(parseId(req.params.memberId, 'memberId')))
})

export const getById = asyncHandler(async (req, res) => {
    sendSuccess(res, await service.getById(parseId(req.params.id)))
})

export const mine = asyncHandler(async (req, res) => {
    sendSuccess(res, await service.getMine(req.user.id))
})

export const assign = asyncHandler(async (req, res) => {
    const created = await service.assign(req.body, req.user.id)
    sendSuccess(res, created, 'Rutina asignada', 201)
})

export const create = asyncHandler(async (req, res) => {
    sendSuccess(res, await service.createForMember(req.body, req.user.id), 'Rutina creada', 201)
})

export const update = asyncHandler(async (req, res) => {
    sendSuccess(res, await service.update(parseId(req.params.id), req.body), 'Rutina guardada')
})

export const setStatus = asyncHandler(async (req, res) => {
    const plan = await service.setStatus(parseId(req.params.id), req.body.isActive)
    sendSuccess(res, plan, plan.isActive ? 'Rutina activada' : 'Rutina desactivada')
})