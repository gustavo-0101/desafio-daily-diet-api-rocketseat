import { it, describe, expect, beforeEach, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '../app'
import { execSync } from 'child_process'

describe('Meals routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('should be able to create a new meal', async () => {
    const userResponse = await request(app.server)
      .post('/users')
      .send({ name: 'Test Name', email: 'example@example.com' })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userResponse.get('Set-Cookie'))
      .send({
        name: 'Test meal',
        description: 'Meal created to test',
        isOnDiet: true,
      })
      .expect(201)
  })

  it('should be able to list all meals from a user', async () => {
    const userResponse = await request(app.server)
      .post('/users')
      .send({ name: 'Test Name', email: 'example@example.com' })
      .expect(201)

    const cookies = userResponse.get('Set-Cookie')

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookies)
      .send({
        name: 'Test meal',
        description: 'Meal created to test',
        isOnDiet: true,
      })
      .expect(201)

    const mealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)
      .expect(200)

    expect(mealsResponse.body.meals).toEqual([
      expect.objectContaining({
        name: 'Test meal',
        description: 'Meal created to test',
        is_diet: 1, // sqlite returns a 1 as true and 0 as false,
      }),
    ])
  })

  it('should be able to show a single meal', async () => {
    const userResponse = await request(app.server)
      .post('/users')
      .send({ name: 'Teste', email: 'teste@teste.com' })
      .expect(201)

    const cookies = userResponse.get('Set-Cookie')

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookies)
      .send({
        name: 'Teste',
        description: 'Descrição de teste',
        isOnDiet: true,
      })
      .expect(201)

    const mealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)
      .expect(200)

    const mealId = mealsResponse.body.meals[0].id

    const mealResponse = await request(app.server)
      .get(`/meals/${mealId}`)
      .set('Cookie', cookies)
      .expect(200)

    expect(mealResponse.body).toEqual({
      meal: expect.objectContaining({
        name: 'Teste',
        description: 'Descrição de teste',
        is_diet: 1,
      }),
    })
  })

  it('should be able to update a meal', async () => {
    const userResponse = await request(app.server)
      .post('/users')
      .send({ name: 'Teste', email: 'teste@teste.com' })
      .expect(201)

    const cookies = userResponse.get('Set-Cookie')

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookies)
      .send({
        name: 'Teste',
        description: 'Descrição de teste',
        isOnDiet: true,
      })
      .expect(201)

    const mealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)
      .expect(200)

    const id = mealsResponse.body.meals[0].id

    await request(app.server)
      .put(`/meals/${id}`)
      .set('Cookie', cookies)
      .send({
        name: 'Teste modificação',
        description: 'Descrição de teste modificação',
        isOnDiet: false,
      })
      .expect(204)

    const mealNewResponse = await request(app.server)
      .get(`/meals/${id}`)
      .set('Cookie', cookies)
      .expect(200)

    expect(mealNewResponse.body).toEqual({
      meal: expect.objectContaining({
        name: 'Teste modificação',
        description: 'Descrição de teste modificação',
        is_diet: 0,
      }),
    })
  })
})
