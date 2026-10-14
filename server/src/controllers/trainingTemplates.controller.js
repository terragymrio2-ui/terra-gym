import * as service from '../services/trainingTemplates.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { parseId } from '../utils/parseId.js'
import { sendSuccess } from '../utils/response.js'
import { listTemplatesQuery } from '../validators/trainingTemplates.validator.js'

export const list = asyncHandler(async (req, res) => {
    sendSuccess(res, await service.list(listTemplatesQuery.parse(req.query)))
})

export const getById = asyncHandler(async (req, res) => {
    sendSuccess(res, await service.getById(parseId(req.params.id)))
})

export const create = asyncHandler(async (req, res) => {
    sendSuccess(res, await service.create(req.body, req.user.id), 'Plantilla creada', 201)
})

export const update = asyncHandler(async (req, res) => {
    sendSuccess(res, await service.update(parseId(req.params.id), req.body), 'Plantilla guardada')
})

export const duplicate = asyncHandler(async (req, res) => {
    const copy = await service.duplicate(parseId(req.params.id), req.user.id)
    sendSuccess(res, copy, 'Plantilla duplicada', 201)
})

export const remove = asyncHandler(async (req, res) => {
    await service.remove(parseId(req.params.id), req.user)
    sendSuccess(res, null, 'Plantilla eliminada')
})