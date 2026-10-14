import * as service from '../services/dashboard.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/response.js'

export const admin = asyncHandler(async (req, res) => sendSuccess(res, await service.admin()))
export const trainer = asyncHandler(async (req, res) => sendSuccess(res, await service.trainer()))
export const member = asyncHandler(async (req, res) =>
    sendSuccess(res, await service.member(req.user.id)),
)