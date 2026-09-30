import db from '../db/connection.js';
import { randomUUID } from 'crypto';
import { createError } from '../middleware/errorHandler.js';

/**
 * Получить список расходов с пагинацией и фильтрацией
 * @param {Object} options - { page, limit, category, dateFrom, dateTo, isRecurring }
 * @returns {Object} { data: Array, total: number, page: number, limit: number }
 */
export const getAllExpenses = (options = {}) => {
  const { page = 1, limit = 50, category, dateFrom, dateTo, isRecurring } = options;
  const offset = (page - 1) * limit;

  // Формируем условия WHERE динамически
  const conditions = [];
  const params = [];

  if (category) {
    conditions.push('category = ?');
    params.push(category);
  }
  if (dateFrom) {
    conditions.push('date >= ?');
    params.push(dateFrom);
  }
  if (dateTo) {
    conditions.push('date <= ?');
    params.push(dateTo);
  }
  if (isRecurring !== undefined) {
    // Приводим к 0/1 для SQLite
    conditions.push('is_recurring = ?');
    params.push(isRecurring ? 1 : 0);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Запрос для получения общего количества записей
  const countQuery = `SELECT COUNT(*) as total FROM expenses ${whereClause}`;
  const countResult = db.prepare(countQuery).get(...params);
  const total = countResult.total;

  // Запрос для получения данных с пагинацией
  const dataQuery = `
    SELECT id, amount, date, category, comment, is_recurring, created_at, updated_at 
    FROM expenses 
    ${whereClause} 
    ORDER BY date DESC, created_at DESC 
    LIMIT ? OFFSET ?
  `;
  
  const rows = db.prepare(dataQuery).all(...params, limit, offset);

  // Маппинг snake_case -> camelCase
  const data = rows.map(row => ({
    id: row.id,
    amount: Number(row.amount),
    date: row.date,
    category: row.category,
    comment: row.comment || '',
    isRecurring: Boolean(row.is_recurring),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return { data, total, page: Number(page), limit: Number(limit) };
};

/**
 * Получить расход по ID
 * @param {string} id - идентификатор расхода
 * @returns {Object|null} объект расхода или null
 */
export const getExpenseById = (id) => {
  const row = db.prepare(
    'SELECT id, amount, date, category, comment, is_recurring, created_at, updated_at FROM expenses WHERE id = ?'
  ).get(id);
  
  if (!row) return null;

  return {
    id: row.id,
    amount: Number(row.amount),
    date: row.date,
    category: row.category,
    comment: row.comment || '',
    isRecurring: Boolean(row.is_recurring),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

/**
 * Создать новый расход
 * @param {Object} expenseData - { amount, date, category, comment, isRecurring }
 * @returns {Object} созданный расход
 */
export const createExpense = (expenseData) => {
  const id = randomUUID();
  const amount = Number(expenseData.amount);
  const date = expenseData.date;
  const category = expenseData.category;
  const comment = expenseData.comment || '';
  // Приводим isRecurring к 0/1 для SQLite
  const isRecurring = expenseData.isRecurring ? 1 : 0;

  const query = `
    INSERT INTO expenses (id, amount, date, category, comment, is_recurring, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `;

  db.prepare(query).run(id, amount, date, category, comment, isRecurring);

  return getExpenseById(id);
};

/**
 * Обновить существующий расход
 * @param {string} id - идентификатор расхода
 * @param {Object} expenseData - новые данные { amount, date, category, comment, isRecurring }
 * @returns {Object} обновлённый расход
 */
export const updateExpense = (id, expenseData) => {
  const existing = getExpenseById(id);
  if (!existing) {
    throw createError('Расход не найден', 404, 'NOT_FOUND');
  }

  const amount = expenseData.amount !== undefined ? Number(expenseData.amount) : existing.amount;
  const date = expenseData.date !== undefined ? expenseData.date : existing.date;
  const category = expenseData.category !== undefined ? expenseData.category : existing.category;
  const comment = expenseData.comment !== undefined ? expenseData.comment : existing.comment;
  const isRecurring = expenseData.isRecurring !== undefined 
    ? (expenseData.isRecurring ? 1 : 0) 
    : (existing.isRecurring ? 1 : 0);

  const query = `
    UPDATE expenses 
    SET amount = ?, date = ?, category = ?, comment = ?, is_recurring = ?, updated_at = datetime('now')
    WHERE id = ?
  `;

  db.prepare(query).run(amount, date, category, comment, isRecurring, id);

  return getExpenseById(id);
};

/**
 * Удалить расход по ID
 * @param {string} id - идентификатор расхода
 * @returns {boolean} true, если удалено
 */
export const deleteExpense = (id) => {
  const existing = getExpenseById(id);
  if (!existing) {
    throw createError('Расход не найден', 404, 'NOT_FOUND');
  }

  db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
  return true;
};