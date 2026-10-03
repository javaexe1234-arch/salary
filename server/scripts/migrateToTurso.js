import { createClient } from '@libsql/client';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '../salary_tracker.db');
const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

async function migrate() {
  if (!TURSO_DATABASE_URL) {
    console.error('❌ Переменная окружения TURSO_DATABASE_URL не задана.');
    console.log('Пример: TURSO_DATABASE_URL="libsql://your-db.turso.io" TURSO_AUTH_TOKEN="your-token" node server/scripts/migrateToTurso.js');
    process.exit(1);
  }

  console.log('🔄 Подключение к локальной базе данных:', DB_PATH);
  const localClient = createClient({ url: `file:${DB_PATH}` });

  console.log('🔄 Подключение к Turso:', TURSO_DATABASE_URL);
  const tursoClient = createClient({
    url: TURSO_DATABASE_URL,
    authToken: TURSO_AUTH_TOKEN,
  });

  try {
    // 1. Создаём таблицы в Turso
    console.log('📦 Создание таблиц в Turso...');
    await tursoClient.executeMultiple(`
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

    // 2. Миграция пользователей
    const usersRes = await localClient.execute('SELECT * FROM users');
    console.log(`👤 Найдено пользователей для переноса: ${usersRes.rows.length}`);
    for (const user of usersRes.rows) {
      await tursoClient.execute({
        sql: `INSERT OR REPLACE INTO users (id, email, name, password_hash, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [user.id, user.email, user.name, user.password_hash, user.created_at, user.updated_at],
      });
    }

    // 3. Миграция доходов
    const incomesRes = await localClient.execute('SELECT * FROM incomes');
    console.log(`💰 Найдено доходов для переноса: ${incomesRes.rows.length}`);
    for (const inc of incomesRes.rows) {
      await tursoClient.execute({
        sql: `INSERT OR REPLACE INTO incomes (id, user_id, amount, date, category, comment, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [inc.id, inc.user_id, inc.amount, inc.date, inc.category, inc.comment, inc.created_at, inc.updated_at],
      });
    }

    // 4. Миграция расходов
    const expensesRes = await localClient.execute('SELECT * FROM expenses');
    console.log(`💸 Найдено расходов для переноса: ${expensesRes.rows.length}`);
    for (const exp of expensesRes.rows) {
      await tursoClient.execute({
        sql: `INSERT OR REPLACE INTO expenses (id, user_id, amount, date, category, comment, is_recurring, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [exp.id, exp.user_id, exp.amount, exp.date, exp.category, exp.comment, exp.is_recurring, exp.created_at, exp.updated_at],
      });
    }

    console.log('✅ Все данные успешно перенесены в Turso!');
  } catch (error) {
    console.error('❌ Ошибка миграции:', error);
  }
}

migrate();
