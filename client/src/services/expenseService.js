import * as api from './api';

/**
 * Получить все расходы с опциональной пагинацией и фильтрацией
 * @param {Object} filters - { page, limit, category, dateFrom, dateTo, isRecurring }
 * @returns {Promise<Object>} { data: [...], pagination: {...} }
 */
export const getExpenses = async (filters = {}) => {
  try {
    const result = await api.get('/expenses', filters);
    return {
      data: result.data || [],
      pagination: result.pagination || null,
    };
  } catch (error) {
    console.error('Ошибка получения расходов:', error);
    throw error;
  }
};

/**
 * Получить расход по ID
 * @param {string} id - идентификатор расхода
 * @returns {Promise<Object|null>} объект расхода или null
 */
export const getExpenseById = async (id) => {
  if (!id) return null;
  try {
    const result = await api.get(`/expenses/${id}`);
    return result.data || null;
  } catch (error) {
    console.error('Ошибка получения расхода по ID:', error);
    return null;
  }
};

/**
 * Добавить новый расход
 * @param {Object} expenseData - данные расхода (category, amount, date, comment, isRecurring)
 * @returns {Promise<Object>} созданный расход
 */
export const addExpense = async (expenseData) => {
  if (!expenseData) {
    console.error('addExpense: данные не переданы');
    return null;
  }
  try {
    // Приводим данные к формату backend
    const payload = {
      amount: Number(expenseData.amount) || 0,
      date: expenseData.date || new Date().toISOString().split('T')[0],
      category: expenseData.category || 'other',
      comment: expenseData.comment || '',
      isRecurring: Boolean(expenseData.isRecurring) || false,
    };
    
    const result = await api.post('/expenses', payload);
    return result.data;
  } catch (error) {
    console.error('Ошибка добавления расхода:', error);
    throw error;
  }
};

/**
 * Обновить существующий расход
 * @param {string} id - идентификатор расхода
 * @param {Object} expenseData - новые данные расхода
 * @returns {Promise<Object|null>} обновлённый расход или null
 */
export const updateExpense = async (id, expenseData) => {
  if (!id || !expenseData) {
    console.error('updateExpense: id или данные не переданы');
    return null;
  }
  try {
    // Приводим данные к формату backend
    const payload = {
      amount: expenseData.amount !== undefined ? Number(expenseData.amount) : undefined,
      date: expenseData.date,
      category: expenseData.category,
      comment: expenseData.comment,
      isRecurring: expenseData.isRecurring !== undefined ? Boolean(expenseData.isRecurring) : undefined,
    };
    
    // Удаляем undefined поля
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });
    
    const result = await api.put(`/expenses/${id}`, payload);
    return result.data;
  } catch (error) {
    console.error('Ошибка обновления расхода:', error);
    throw error;
  }
};

/**
 * Удалить расход по ID
 * @param {string} id - идентификатор расхода
 * @returns {Promise<boolean>} true, если удаление успешно
 */
export const deleteExpense = async (id) => {
  if (!id) {
    console.error('deleteExpense: id не передан');
    return false;
  }
  try {
    await api.del(`/expenses/${id}`);
    return true;
  } catch (error) {
    console.error('Ошибка удаления расхода:', error);
    return false;
  }
};