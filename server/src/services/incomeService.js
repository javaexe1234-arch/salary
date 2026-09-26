import db from '../db/connection.js';
import { randomUUID } from 'crypto';
import { createError } from '../middleware/errorHandler.js';

/**
 * Получить список доходов с пагинацией и фильтрацией
 * @param {Object} options - { page, limit, category, dateFrom, dateTo }
 * @returns {Object} { data: Array, total: number, page: number, limit: number }
 */
export const getAllIncomes = (options = {}) => {
  const { page = 1, limit = 50, category, dateFrom, dateTo } = options;
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

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Запрос для получения общего количества записей
  const countQuery = `SELECT COUNT(*) as total FROM incomes ${whereClause}`;
  const countResult = db.prepare(countQuery).get(...params);
  const total = countResult.total;

  // Запрос для получения данных с пагинацией
  const dataQuery = `
    SELECT id, amount, date, category, comment, created_at, updated_at 
    FROM incomes 
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return { data, total, page: Number(page), limit: Number(limit) };
};

/**
 * Получить доход по ID
 * @param {string} id - идентификатор дохода
 * @returns {Object|null} объект дохода или null
 */
export const getIncomeById = (id) => {
  const row = db.prepare('SELECT id, amount, date, category, comment, created_at, updated_at FROM incomes WHERE id = ?').get(id);
  
  if (!row) return null;

  return {
    id: row.id,
    amount: Number(row.amount),
    date: row.date,
    category: row.category,
    comment: row.comment || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

/**
 * Создать новый доход
 * @param {Object} incomeData - { amount, date, category, comment }
 * @returns {Object} созданный доход
 */
export const createIncome = (incomeData) => {
  const id = randomUUID();
  const amount = Number(incomeData.amount);
  const date = incomeData.date;
  const category = incomeData.category;
  const comment = incomeData.comment || '';

  const query = `
    INSERT INTO incomes (id, amount, date, category, comment, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `;

  db.prepare(query).run(id, amount, date, category, comment);

  return getIncomeById(id);
};

/**
 * Обновить существующий доход
 * @param {string} id - идентификатор дохода
 * @param {Object} incomeData - новые данные { amount, date, category, comment }
 * @returns {Object} обновлённый доход
 */
export const updateIncome = (id, incomeData) => {
  const existing = getIncomeById(id);
  if (!existing) {
    throw createError('Доход не найден', 404, 'NOT_FOUND');
  }

  const amount = incomeData.amount !== undefined ? Number(incomeData.amount) : existing.amount;
  const date = incomeData.date !== undefined ? incomeData.date : existing.date;
  const category = incomeData.category !== undefined ? incomeData.category : existing.category;
  const comment = incomeData.comment !== undefined ? incomeData.comment : existing.comment;

  const query = `
    UPDATE incomes 
    SET amount = ?, date = ?, category = ?, comment = ?, updated_at = datetime('now')
    WHERE id = ?
  `;

  db.prepare(query).run(amount, date, category, comment, id);

  return getIncomeById(id);
};

/**
 * Удалить доход по ID
 * @param {string} id - идентификатор дохода
 * @returns {boolean} true, если удалено
 */
export const deleteIncome = (id) => {
  const existing = getIncomeById(id);
  if (!existing) {
    throw createError('Доход не найден', 404, 'NOT_FOUND');
  }

  db.prepare('DELETE FROM incomes WHERE id = ?').run(id);
  return true;
};