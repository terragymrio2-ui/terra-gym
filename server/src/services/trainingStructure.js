import { AppError } from '../utils/AppError.js'

// Los ejercicios deben existir y estar visibles, salvo los que la plantilla ya tenía
export async function assertExercisesUsable(conn, exerciseIds, allowedHiddenIds = new Set()) {
    const ids = [...new Set(exerciseIds)]
    if (!ids.length) return
    const [rows] = await conn.query('SELECT id, is_active FROM exercises WHERE id IN (?)', [ids])
    if (rows.length !== ids.length) {
        throw new AppError('Algún ejercicio indicado no existe', 400, 'INVALID_EXERCISE')
    }
    if (rows.some((r) => !r.is_active && !allowedHiddenIds.has(r.id))) {
        throw new AppError('Algún ejercicio está oculto del catálogo', 400, 'EXERCISE_HIDDEN')
    }
}

// Inserta los días y ejercicios de un plan. Debe llamarse dentro de una transacción.
export async function writeStructure(conn, planId, days) {
    for (const [dayIndex, day] of days.entries()) {
        const [result] = await conn.query(
            'INSERT INTO training_plan_days (plan_id, name, day_order) VALUES (?, ?, ?)',
            [planId, day.name, dayIndex + 1],
        )
        if (!day.exercises.length) continue

        const values = day.exercises.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(',')
        const params = day.exercises.flatMap((e, i) => [
            result.insertId,
            e.exerciseId,
            e.block,
            e.sets,
            e.reps,
            e.restSeconds ?? null,
            e.intensity ?? null,
            e.suggestedWeight ?? null,
            e.notes ?? null,
            i + 1,
        ])
        await conn.query(
            `INSERT INTO training_plan_exercises
         (day_id, exercise_id, block, sets, reps, rest_seconds, intensity, suggested_weight, notes, exercise_order)
       VALUES ${values}`,
            params,
        )
    }
}

export async function loadStructure(db, planId) {
    const [days] = await db.query(
        'SELECT id, name FROM training_plan_days WHERE plan_id = ? ORDER BY day_order, id',
        [planId],
    )
    const [items] = await db.query(
        `SELECT tpe.id, tpe.day_id, tpe.block, tpe.sets, tpe.reps, tpe.rest_seconds,
            tpe.intensity, tpe.suggested_weight, tpe.notes,
            e.id AS exercise_id, e.name AS exercise_name, e.muscle_group, e.video_url,
            e.is_active AS exercise_active
     FROM training_plan_exercises tpe
     JOIN training_plan_days d ON d.id = tpe.day_id
     JOIN exercises e ON e.id = tpe.exercise_id
     WHERE d.plan_id = ?
     ORDER BY tpe.exercise_order, tpe.id`,
        [planId],
    )

    return days.map((d) => ({
        id: d.id,
        name: d.name,
        exercises: items
            .filter((i) => i.day_id === d.id)
            .map((i) => ({
                id: i.id,
                exerciseId: i.exercise_id,
                exerciseName: i.exercise_name,
                muscleGroup: i.muscle_group,
                videoUrl: i.video_url,
                isHidden: !i.exercise_active,
                block: i.block,
                sets: i.sets,
                reps: i.reps,
                restSeconds: i.rest_seconds,
                intensity: i.intensity,
                suggestedWeight: i.suggested_weight,
                notes: i.notes,
            })),
    }))
}