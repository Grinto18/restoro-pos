import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { Pool as PgPool, PoolConfig } from 'pg';
import pg from 'pg';
import * as schema from './schema.ts';

const { Pool } = pg;

declare global {
  var _postgresPool: PgPool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    const config: PoolConfig = {
      max: 10,
      connectionTimeoutMillis: 15000,
    };

    // Prioritize Cloud SQL Unix domain socket if present in environment
    if (process.env.SQL_HOST && process.env.SQL_HOST.startsWith('/')) {
      config.host = process.env.SQL_HOST;
      config.user = process.env.SQL_USER;
      config.password = process.env.SQL_PASSWORD;
      config.database = process.env.SQL_DB_NAME;
    } else if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('YOUR_PASSWORD')) {
      config.connectionString = process.env.DATABASE_URL;
    } else {
      config.host = process.env.SQL_HOST || '127.0.0.1';
      if (process.env.SQL_PORT) config.port = Number(process.env.SQL_PORT);
      config.user = process.env.SQL_USER || 'postgres';
      config.password = process.env.SQL_PASSWORD || '';
      config.database = process.env.SQL_DB_NAME || 'goldenpalace';
    }

    global._postgresPool = new Pool(config);

    global._postgresPool.on('error', (err: any) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();

export const db = drizzle(pool, { schema });
