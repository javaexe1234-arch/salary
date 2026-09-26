import path from 'path';
import { fileURLToPath } from 'url';

// Получаем путь к текущей директории (аналог __dirname для ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const config = {
  // Порт, на котором будет работать сервер
  port: process.env.PORT || 3001,
  
  // Настройки CORS для разрешения запросов с фронтенда
  corsOptions: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },

  // Путь к файлу базы данных SQLite (в корне папки server)
  dbPath: path.join(__dirname, '..', '..', 'salary_tracker.db'),
};