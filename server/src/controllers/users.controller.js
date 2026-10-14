import * as service from '../services/users.service.js'
import { parseId } from '../utils/parseId.js'
import { sendSuccess } from '../utils/response.js'
import { listUsersQuery } from '../validators/users.validator.js'

export async function list(req, res, next) {
    try {
        sendSuccess(res, await service.list(listUsersQuery.parse(req.query)))
    } catch (err) {
        next(err)
    }
}

export async function getById(req, res, next) {
    try {
        sendSuccess(res, await service.getById(parseId(req.params.id)))
    } catch (err) {
        next(err)
    }
}

export async function create(req, res, next) {
    try {
        const data = await service.create(req.body)
        sendSuccess(res, data, 'Usuario creado', 201)
    } catch (err) {
        next(err)
    }
}

export async function update(req, res, next) {
    try {
        sendSuccess(res, await service.update(parseId(req.params.id), req.body), 'Usuario actualizado')
    } catch (err) {
        next(err)
    }
}

export async function setStatus(req, res, next) {
    try {
        const user = await service.setStatus(parseId(req.params.id), req.body.isActive, req.user.id)
        sendSuccess(res, user, user.isActive ? 'Usuario activado' : 'Usuario desactivado')
    } catch (err) {
        next(err)
    }
}

export async function resetPassword(req, res, next) {
    try {
        const data = await service.resetPassword(parseId(req.params.id), req.user.id)
        sendSuccess(res, data, 'Contraseña restablecida')
    } catch (err) {
        next(err)
    }
}