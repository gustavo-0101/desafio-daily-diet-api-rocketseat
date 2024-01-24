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

    const id = mealsResponse.body.meals[0].id

    const mealResponse = await request(app.server)
      .get(`/meals/${id}`)
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

  it('should be able to delete a meal', async () => {
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
      .delete(`/meals/${id}`)
      .set('Cookie', userResponse.get('Set-Cookie'))
      .expect(204)
  })

  it('should be able to get metrics from a user', async () => {
    const userResponse = await request(app.server)
      .post('/users')
      .send({ name: 'Teste', email: 'teste@teste.com' })
      .expect(201)

    const cookies = userResponse.get('Set-Cookie')

    const updatedDate = new Date('2023-01-24T08:00:00')

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookies)
      .send({
        name: 'Teste 1',
        description: 'Descrição de teste 1',
        isOnDiet: true,
        updated_at: `${updatedDate.getUTCFullYear()}-${(updatedDate.getUTCMonth() + 1).toString().padStart(2, '0')}-${updatedDate.getUTCDate().toString().padStart(2, '0')} ${updatedDate.getUTCHours().toString().padStart(2, '0')}:${updatedDate.getUTCMinutes().toString().padStart(2, '0')}:${updatedDate.getUTCSeconds().toString().padStart(2, '0')}`,
      })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookies)
      .send({
        name: 'Teste 2',
        description: 'Descrição de teste 2',
        isOnDiet: false,
        updated_at: `${updatedDate.getUTCFullYear()}-${(updatedDate.getUTCMonth() + 1).toString().padStart(2, '0')}-${(updatedDate.getUTCDate() + 1).toString().padStart(2, '0')} ${updatedDate.getUTCHours().toString().padStart(2, '0')}:${updatedDate.getUTCMinutes().toString().padStart(2, '0')}:${updatedDate.getUTCSeconds().toString().padStart(2, '0')}`,
      })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookies)
      .send({
        name: 'Teste 3',
        description: 'Descrição de teste 3',
        isOnDiet: true,
        updated_at: `${updatedDate.getUTCFullYear()}-${(updatedDate.getUTCMonth() + 1).toString().padStart(2, '0')}-${(updatedDate.getUTCDate() + 2).toString().padStart(2, '0')} ${updatedDate.getUTCHours().toString().padStart(2, '0')}:${updatedDate.getUTCMinutes().toString().padStart(2, '0')}:${updatedDate.getUTCSeconds().toString().padStart(2, '0')}`,
      })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookies)
      .send({
        name: 'Teste 4',
        description: 'Descrição de teste 4',
        isOnDiet: true,
        updated_at: `${updatedDate.getUTCFullYear()}-${(updatedDate.getUTCMonth() + 1).toString().padStart(2, '0')}-${(updatedDate.getUTCDate() + 3).toString().padStart(2, '0')} ${updatedDate.getUTCHours().toString().padStart(2, '0')}:${updatedDate.getUTCMinutes().toString().padStart(2, '0')}:${updatedDate.getUTCSeconds().toString().padStart(2, '0')}`,
      })

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookies)
      .send({
        name: 'Teste 5',
        description: 'Descrição de teste 5',
        isOnDiet: true,
        updated_at: `${updatedDate.getUTCFullYear()}-${(updatedDate.getUTCMonth() + 1).toString().padStart(2, '0')}-${(updatedDate.getUTCDate() + 4).toString().padStart(2, '0')} ${updatedDate.getUTCHours().toString().padStart(2, '0')}:${updatedDate.getUTCMinutes().toString().padStart(2, '0')}:${updatedDate.getUTCSeconds().toString().padStart(2, '0')}`,
      })

    const metricsResponse = await request(app.server)
      .get('/meals/metrics')
      .set('Cookie', cookies)
      .expect(200)

    expect(metricsResponse.body).toEqual({
      totalMeals: 5,
      totalDietMeals: 4,
      totalNotDietMeals: 1,
      bestOnDietSequence: 3,
    })
  })
})
