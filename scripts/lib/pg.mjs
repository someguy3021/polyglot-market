// Фабрика pg-клиентов для раннера миграций и сидов.
import pg from "pg";
import { config } from "./config.mjs";

export function makePool(overrides = {}) {
  return new pg.Pool({
    host: config.db.host,
    port: config.db.port,
    database: config.db.database,
    user: config.db.user,
    password: config.db.password,
    ...overrides,
  });
}
