import { createClient } from '@libsql/client';
import { DB_PATH, TURSO_DATABASE_URL, TURSO_AUTH_TOKEN } from '../config/index.js';

let db = null;
let client = null;

/**
 * Класс-адаптер для совместимости с API sqlite/sqlite3 (get, all, run, exec)
 */
class LibSqlDatabase {
  constructor(clientInstance) {
    this.client = clientInstance;
  }

  async get(sql, params = []) {
    const result = await this.client.execute({ sql, args: params });
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async all(sql, params = []) {
    const result = await this.client.execute({ sql, args: params });
    return result.rows;
  }

  async run(sql, params = []) {
    const result = await this.client.execute({ sql, args: params });
    return {
      changes: result.rowsAffected,
      lastID: result.lastInsertRowid,
    };
  }

  async exec(sql) {
    return await this.client.executeMultiple(sql);
  }
}

/**
 * Инициализация подключения к базе данных и создание таблиц
 */
export async function initDb() {
  if (db) return db;

  try {
    const isTurso = Boolean(TURSO_DATABASE_URL);
    const url = isTurso ? TURSO_DATABASE_URL : `file:${DB_PATH}`;
    const authToken = TURSO_AUTH_TOKEN;

    client = createClient({
      url,
      authToken,
    });

    db = new LibSqlDatabase(client);

    // Включаем поддержку внешних ключей
    try {
      await db.run('PRAGMA foreign_keys = ON');
    } catch {
      // Игнорируем, если не поддерживается удалённым провайдером
    }

    // Создаём таблицу пользователей
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS incomes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        category TEXT NOT NULL,
        comment TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        category TEXT NOT NULL,
        comment TEXT,
        is_recurring INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );
    `);

    console.log(`✅ База данных успешно инициализирована (${isTurso ? 'Turso' : 'Local SQLite'})`);
    return db;
  } catch (error) {
    console.error('❌ Ошибка инициализации базы данных:', error);
    throw error;
  }
}

/**
 * Получить экземпляр базы данных
 * @returns {LibSqlDatabase} Экземпляр базы данных
 */
export function getDb() {
  if (!db) {
    throw new Error('База данных ещё не инициализирована. Вызовите initDb() перед использованием.');
  }
  return db;
}