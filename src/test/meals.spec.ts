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
})
