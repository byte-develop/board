import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';
import * as authSchema from '../shared/auth-schema';
import config from './config';

// Создаем подключение к PostgreSQL
const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/taskflow';

if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

// Настраиваем клиент postgres
const client = postgres(connectionString, {
  ssl: config.database.ssl ? 'require' : false,
  max: config.database.maxConnections,
  idle_timeout: config.database.idleTimeout / 1000, // convert to seconds
});

// Создаем экземпляр Drizzle с схемой
export const db = drizzle(client, { 
  schema: { 
    ...schema, 
    ...authSchema 
  } 
});

// Экспортируем типы
export type Database = typeof db;