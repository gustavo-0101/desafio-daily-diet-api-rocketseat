// eslint-disable-next-line
import { Knex } from "knex";

declare module 'knex/types/meals' {
  export interface Meals {
    meals: {
      id: string
      name: string
      description: string
      is_diet: boolean
      created_at: string
      session_id?: string
    }
  }
}
