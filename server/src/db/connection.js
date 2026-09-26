import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/index.js';

// Получаем путь к текущей директории (аналог __dirname для ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Создаём подключение к базе данных
// better-sqlite3 использует синхронный API — это быстрее для локальных операций
const db = new Database(config.dbPath);

// Включаем WAL-режим для лучшей производительности при параллельных запросах
db.pragma('journal_mode = WAL');

// Включаем строгий режим внешних ключей
db.pragma('foreign_keys = ON');

// Читаем SQL-скрипт для создания таблиц
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf-8');

// Выполняем скрипт инициализации (CREATE TABLE IF NOT EXISTS)
// Это безопасно запускать многократно — таблицы не пересоздадутся, если уже существуют
db.exec(schema);

console.log('✅ База данных инициализирована:', config.dbPath);

// Экспортируем инстанс базы данных для использования в сервисах
export default db;