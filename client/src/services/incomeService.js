import * as api from './api';

/**
 * Получить все доходы с опциональной пагинацией и фильтрацией
 * @param {Object} filters - { page, limit, category, dateFrom, dateTo }
 * @returns {Promise<Object>} { data: [...], pagination: {...} }
 */
export const getIncomes = async (filters = {}) => {
  try {
    const result = await api.get('/incomes', filters);
    return {
      data: result.data || [],
      pagination: result.pagination || null,
    };
  } catch (error) {
    console.error('Ошибка получения доходов:', error);
    throw error;
  }
};

/**
 * Получить доход по ID
 * @param {string} id - идентификатор дохода
 * @returns {Promise<Object|null>} объект дохода или null
 */
export const getIncomeById = async (id) => {
  if (!id) return null;
  try {
    const result = await api.get(`/incomes/${id}`);
    return result.data || null;
  } catch (error) {
    console.error('Ошибка получения дохода по ID:', error);
    return null;
  }
};

/**
 * Добавить новый доход
 * @param {Object} incomeData - данные дохода (category, amount, date, comment)
 * @returns {Promise<Object>} созданный доход
 */
export const addIncome = async (incomeData) => {
  if (!incomeData) {
    console.error('addIncome: данные не переданы');
    return null;
  }
  try {
    // Приводим данные к формату backend
    const payload = {
      amount: Number(incomeData.amount) || 0,
      date: incomeData.date || new Date().toISOString().split('T')[0],
      category: incomeData.category || 'other',
      comment: incomeData.comment || '',
    };
    
    const result = await api.post('/incomes', payload);
    return result.data;
  } catch (error) {
    console.error('Ошибка добавления дохода:', error);
    throw error;
  }
};

/**
 * Обновить существующий доход
 * @param {string} id - идентификатор дохода
 * @param {Object} incomeData - новые данные дохода
 * @returns {Promise<Object|null>} обновлённый доход или null
 */
export const updateIncome = async (id, incomeData) => {
  if (!id || !incomeData) {
    console.error('updateIncome: id или данные не переданы');
    return null;
  }
  try {
    // Приводим данные к формату backend
    const payload = {
      amount: incomeData.amount !== undefined ? Number(incomeData.amount) : undefined,
      date: incomeData.date,
      category: incomeData.category,
      comment: incomeData.comment,
    };
    
    // Удаляем undefined поля
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });
    
    const result = await api.put(`/incomes/${id}`, payload);
    return result.data;
  } catch (error) {
    console.error('Ошибка обновления дохода:', error);
    throw error;
  }
};

/**
 * Удалить доход по ID
 * @param {string} id - идентификатор дохода
 * @returns {Promise<boolean>} true, если удаление успешно
 */
export const deleteIncome = async (id) => {
  if (!id) {
    console.error('deleteIncome: id не передан');
    return false;
  }
  try {
    await api.del(`/incomes/${id}`);
    return true;
  } catch (error) {
    console.error('Ошибка удаления дохода:', error);
    return false;
  }
};