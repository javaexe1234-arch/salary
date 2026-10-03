import path from 'path';
import { fileURLToPath } from 'url';

// Получаем директорию текущего модуля
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Порт сервера
export const PORT = process.env.PORT || 3001;

// Путь к файлу базы данных SQLite (для локального использования)
export const DB_PATH = path.join(__dirname, '../../salary_tracker.db');

// Подключение к Turso / LibSQL
export const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || process.env.LIBSQL_URL;
export const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN;

// Секретный ключ для JWT-токенов
// В production используйте переменную окружения JWT_SECRET
export const SECRET_KEY = process.env.JWT_SECRET || 'salary-tracker-secret-key-2026-change-in-production';

// Настройки CORS
export const CORS_OPTIONS = {
  origin: process.env.CLIENT_URL ? [process.env.CLIENT_URL, 'http://localhost:5173'] : true,
  credentials: true,
};