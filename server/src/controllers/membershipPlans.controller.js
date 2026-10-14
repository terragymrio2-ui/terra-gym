import * as service from '../services/membershipPlans.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { parseId } from '../utils/parseId.js'
import { sendSuccess } from '../utils/response.js'

// ADMIN ve todos los planes; el resto solo los activos
export const list = asyncHandler(async (req, res) => {
    sendSuccess(res, await service.list({ activeOnly: req.user.role !== 'ADMIN' }))
})

export const create = asyncHandler(async (req, res) => {
    sendSuccess(res, await service.create(req.body), 'Plan creado', 201)
})

export const update = asyncHandler(async (req, res) => {
    sendSuccess(res, await service.update(parseId(req.params.id), req.body), 'Plan actualizado')
})

export const setStatus = asyncHandler(async (req, res) => {
    const plan = await service.setStatus(parseId(req.params.id), req.body.isActive)
    sendSuccess(res, plan, plan.isActive ? 'Plan activado' : 'Plan desactivado')
})