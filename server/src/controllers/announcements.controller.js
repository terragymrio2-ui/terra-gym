import * as service from '../services/announcements.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { parseId } from '../utils/parseId.js'
import { sendSuccess } from '../utils/response.js'
import { listAnnouncementsQuery, previewQuery } from '../validators/announcements.validator.js'

export const preview = asyncHandler(async (req, res) => {
    sendSuccess(res, await service.preview(previewQuery.parse(req.query).audience))
})

export const list = asyncHandler(async (req, res) => {
    sendSuccess(res, await service.list(listAnnouncementsQuery.parse(req.query)))
})

export const create = asyncHandler(async (req, res) => {
    sendSuccess(res, await service.create(req.body, req.user.id), 'Aviso enviado', 201)
})

export const setStatus = asyncHandler(async (req, res) => {
    await service.setStatus(parseId(req.params.id), req.body.isActive)
    sendSuccess(res, null, req.body.isActive ? 'Aviso reactivado' : 'Aviso archivado')
})

export const pending = asyncHandler(async (req, res) => {
    sendSuccess(res, await service.pendingFor(req.user.id))
})

export const markRead = asyncHandler(async (req, res) => {
    await service.markRead(parseId(req.params.id), req.user.id)
    sendSuccess(res, null, 'Aviso leído')
})