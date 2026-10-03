import app from '../server/src/app.js';
import { initDb } from '../server/src/db/connection.js';

let isDbInitialized = false;

/**
 * Serverless function entrypoint for Vercel
 * Инициализирует подключение к базе данных Turso и передаёт запрос в Express
 */
export default async function handler(req, res) {
  if (!isDbInitialized) {
    try {
      await initDb();
      isDbInitialized = true;
    } catch (error) {
      console.error('❌ Ошибка инициализации БД в Vercel Serverless:', error);
      return res.status(500).json({
        error: {
          code: 'DB_INIT_ERROR',
          message: 'Ошибка подключения к базе данных',
        },
      });
    }
  }

  return app(req, res);
}
