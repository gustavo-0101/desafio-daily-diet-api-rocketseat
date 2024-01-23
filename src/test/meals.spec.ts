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

  it('should be able to list all meals', async () => {
    const listMealsResponse = await request(app.server)
      .get('/meals')
      .expect(200)

    expect(listMealsResponse.body.meals).toEqual([])
  })
})
