import * as service from '../services/notifications.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { parseId } from '../utils/parseId.js'
import { sendSuccess } from '../utils/response.js'
import { expirationsQuery } from '../validators/notifications.validator.js'

export const expirations = asyncHandler(async (req, res) => {
    sendSuccess(res, await service.expirations(expirationsQuery.parse(req.query)))
})

export const logWhatsapp = asyncHandler(async (req, res) => {
    const data = await service.logWhatsapp(parseId(req.params.membershipId, 'membershipId'))
    sendSuccess(res, data, 'Aviso registrado')
})