import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'
import { z } from 'zod'
import { randomUUID } from 'crypto'

export async function mealsRoutes(app: FastifyInstance) {
  app.post(
    '/',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const createMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        isOnDiet: z.boolean(),
      })

      const { name, description, isOnDiet } = createMealBodySchema.parse(
        request.body,
      )

      await knex('meals').insert({
        id: randomUUID(),
        name,
        description,
        is_diet: isOnDiet,
        user_id: request.user?.id,
      })

      return reply.status(201).send()
    },
  )

  app.get(
    '/',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const meals = await knex('meals')
        .where({ user_id: request.user?.id })
        .orderBy('created_at', 'desc')

      return reply.send({ meals })
    },
  )

  app.get(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const paramsSchema = z.object({ id: z.string().uuid() })

      const { id } = paramsSchema.parse(request.params)

      const meal = await knex('meals')
        .where({ id, user_id: request.user?.id })
        .first()

      if (!meal) {
        return reply.status(404).send({ error: 'Meal not found' })
      }

      return reply.send({ meal })
    },
  )

  app.put(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const paramsSchema = z.object({ id: z.string().uuid() })

      const { id } = paramsSchema.parse(request.params)

      const meal = await knex('meals')
        .where({ id, user_id: request.user?.id })
        .first()

      if (!meal) {
        return reply.status(404).send({ error: 'Meal not found' })
      }

      const createMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        isOnDiet: z.boolean(),
      })

      const { name, description, isOnDiet } = createMealBodySchema.parse(
        request.body,
      )

      const updatedDate = new Date()

      await knex('meals')
        .where({ id, user_id: request.user?.id })
        .update({
          name,
          description,
          is_diet: isOnDiet,
          updated_at: `${updatedDate.getUTCFullYear()}-${(updatedDate.getUTCMonth() + 1).toString().padStart(2, '0')}-${updatedDate.getUTCDate().toString().padStart(2, '0')} ${updatedDate.getUTCHours().toString().padStart(2, '0')}:${updatedDate.getUTCMinutes().toString().padStart(2, '0')}:${updatedDate.getUTCSeconds().toString().padStart(2, '0')}`,
        })

      return reply.status(204).send()
    },
  )
  app.delete(
    '/:mealId',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const paramsSchema = z.object({ mealId: z.string().uuid() })

      const { mealId } = paramsSchema.parse(request.params)

      const meal = await knex('meals')
        .where({ id: mealId, user_id: request.user?.id })
        .first()

      if (!meal) {
        return reply.status(404).send({ error: 'Meal not found' })
      }

      await knex('meals').where({ id: mealId }).delete()

      return reply.status(204).send()
    },
  )

  app.get(
    '/metrics',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const totalDietMeals = await knex('meals')
        .where({ user_id: request.user?.id, is_diet: true })
        .count('id', { as: 'total' })
        .first()

      const totalNotDietMeals = await knex('meals')
        .where({ user_id: request.user?.id, is_diet: false })
        .count('id', { as: 'total' })
        .first()

      const totalMeals = await knex('meals')
        .where({
          user_id: request.user?.id,
        })
        .orderBy('created_at', 'desc')

      const { bestOnDietSequence } = totalMeals.reduce(
        (accumulator, meal) => {
          if (meal.is_diet) {
            accumulator.currentSequence += 1
          } else {
            accumulator.currentSequence = 0
          }

          if (accumulator.currentSequence > accumulator.bestOnDietSequence) {
            accumulator.bestOnDietSequence = accumulator.currentSequence
          }

          return accumulator
        },
        { bestOnDietSequence: 0, currentSequence: 0 },
      )

      return reply.send({
        totalMeals: totalMeals.length,
        totalDietMeals: totalDietMeals?.total,
        totalNotDietMeals: totalNotDietMeals?.total,
        bestOnDietSequence,
      })
    },
  )
}
