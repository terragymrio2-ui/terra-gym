import * as service from '../services/exercises.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { parseId } from '../utils/parseId.js'
import { sendSuccess } from '../utils/response.js'
import { listExercisesQuery } from '../validators/exercises.validator.js'

export const list = asyncHandler(async (req, res) => {
    sendSuccess(res, await service.list(listExercisesQuery.parse(req.query)))
})

export const create = asyncHandler(async (req, res) => {
    sendSuccess(res, await service.create(req.body, req.user.id), 'Ejercicio creado', 201)
})

export const update = asyncHandler(async (req, res) => {
    sendSuccess(res, await service.update(parseId(req.params.id), req.body), 'Ejercicio actualizado')
})

export const setStatus = asyncHandler(async (req, res) => {
    const exercise = await service.setStatus(parseId(req.params.id), req.body.isActive)
    sendSuccess(res, exercise, exercise.isActive ? 'Ejercicio visible' : 'Ejercicio oculto')
})

export const remove = asyncHandler(async (req, res) => {
    await service.remove(parseId(req.params.id))
    sendSuccess(res, null, 'Ejercicio eliminado')
})