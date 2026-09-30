import db from '../db/connection.js';

/**
 * Получить общий баланс (сумма всех доходов минус сумма всех расходов)
 * @returns {Object} { totalIncome, totalExpense, balance }
 */
export const getBalance = () => {
  const incomeResult = db.prepare('SELECT SUM(amount) as total FROM incomes').get();
  const expenseResult = db.prepare('SELECT SUM(amount) as total FROM expenses').get();

  const totalIncome = Number(incomeResult.total) || 0;
  const totalExpense = Number(expenseResult.total) || 0;

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
  };
};

/**
 * Получить сумму операций, сгруппированную по категориям
 * @param {string} type - 'income' или 'expense'
 * @param {Object} filters - { dateFrom, dateTo } (опционально)
 * @returns {Array} массив объектов { category, total }
 */
export const getByCategory = (type, filters = {}) => {
  const tableName = type === 'income' ? 'incomes' : 'expenses';
  const conditions = [];
  const params = [];

  if (filters.dateFrom) {
    conditions.push('date >= ?');
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    conditions.push('date <= ?');
    params.push(filters.dateTo);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const query = `
    SELECT category, SUM(amount) as total
    FROM ${tableName}
    ${whereClause}
    GROUP BY category
    ORDER BY total DESC
  `;

  const rows = db.prepare(query).all(...params);

  return rows.map(row => ({
    category: row.category,
    total: Number(row.total),
  }));
};

/**
 * Получить помесячную статистику доходов и расходов
 * @param {Object} filters - { dateFrom, dateTo } (опционально)
 * @returns {Array} массив объектов { month, income, expense }
 */
export const getByMonth = (filters = {}) => {
  const conditions = [];
  const params = [];

  if (filters.dateFrom) {
    conditions.push('date >= ?');
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    conditions.push('date <= ?');
    params.push(filters.dateTo);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Используем UNION ALL для объединения доходов и расходов по месяцам
  const query = `
    WITH monthly_data AS (
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(amount) as income,
        0 as expense
      FROM incomes
      ${whereClause}
      GROUP BY strftime('%Y-%m', date)
      
      UNION ALL
      
      SELECT 
        strftime('%Y-%m', date) as month,
        0 as income,
        SUM(amount) as expense
      FROM expenses
      ${whereClause}
      GROUP BY strftime('%Y-%m', date)
    )
    SELECT 
      month,
      SUM(income) as total_income,
      SUM(expense) as total_expense
    FROM monthly_data
    GROUP BY month
    ORDER BY month ASC
  `;

  const rows = db.prepare(query).all(...params);

  return rows.map(row => ({
    month: row.month,
    income: Number(row.total_income),
    expense: Number(row.total_expense),
  }));
};