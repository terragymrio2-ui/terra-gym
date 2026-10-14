import * as service from '../services/trainers.service.js'
import { parseId } from '../utils/parseId.js'
import { sendSuccess } from '../utils/response.js'

export async function listMembers(req, res, next) {
    try {
        sendSuccess(res, await service.listMembers(parseId(req.params.id)))
    } catch (err) {
        next(err)
    }
}

export async function addMembers(req, res, next) {
    try {
        const data = await service.addMembers(parseId(req.params.id), req.body.memberIds)
        sendSuccess(res, data, 'Socios asignados', 201)
    } catch (err) {
        next(err)
    }
}

export async function removeMember(req, res, next) {
    try {
        await service.removeMember(parseId(req.params.id), parseId(req.params.memberId, 'memberId'))
        sendSuccess(res, null, 'Asignación eliminada')
    } catch (err) {
        next(err)
    }
}