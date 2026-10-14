import * as service from '../services/attendances.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { parseId } from '../utils/parseId.js'
import { sendSuccess } from '../utils/response.js'
import {
    listAttendancesQuery,
    lookupQuery,
    myAttendancesQuery,
} from '../validators/attendances.validator.js'

export const lookup = asyncHandler(async (req, res) => {
    const { search } = lookupQuery.parse(req.query)
    sendSuccess(res, await service.lookup(search))
})

export const checkIn = asyncHandler(async (req, res) => {
    sendSuccess(res, await service.checkIn(req.body, req.user.id), 'Ingreso registrado', 201)
})

export const list = asyncHandler(async (req, res) => {
    sendSuccess(res, await service.list(listAttendancesQuery.parse(req.query)))
})

export const voidAttendance = asyncHandler(async (req, res) => {
    await service.voidAttendance(parseId(req.params.id), req.body.reason, req.user.id)
    sendSuccess(res, null, 'Ingreso anulado')
})

export const mine = asyncHandler(async (req, res) => {
    const { month } = myAttendancesQuery.parse(req.query)
    sendSuccess(res, await service.getMine(req.user.id, month))
})