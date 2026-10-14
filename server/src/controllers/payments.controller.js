import * as membershipsService from '../services/memberships.service.js'
import * as service from '../services/payments.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { parseId } from '../utils/parseId.js'
import { sendSuccess } from '../utils/response.js'
import { listPaymentsQuery } from '../validators/memberships.validator.js'

export const list = asyncHandler(async (req, res) => {
    sendSuccess(res, await service.list(listPaymentsQuery.parse(req.query)))
})

// Devuelve la membresía actualizada, así la pantalla refresca saldo y estado de una vez
export const register = asyncHandler(async (req, res) => {
    const { membershipId } = await service.register(req.body, req.user.id)
    sendSuccess(res, await membershipsService.getById(membershipId), 'Pago registrado', 201)
})

export const voidPayment = asyncHandler(async (req, res) => {
    const { membershipId } = await service.voidPayment(parseId(req.params.id), req.body.reason)
    sendSuccess(res, await membershipsService.getById(membershipId), 'Pago anulado')
})