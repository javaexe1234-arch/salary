import { INCOME_CATEGORY_IDS, EXPENSE_CATEGORY_IDS } from '../utils/categories.js';
import { createError } from './errorHandler.js';

/**
 * Валидация данных операции (доход или расход)
 * @param {Object} data - данные операции
 * @param {string} type - тип операции ('income' или 'expense')
 * @throws {Error} если данные невалидны
 */
export const validateTransaction = (data, type = 'expense') => {
  // Проверка наличия данных
  if (!data || typeof data !== 'object') {
    throw createError('Данные операции не переданы', 400, 'VALIDATION_ERROR');
  }

  // Проверка суммы
  const amount = Number(data.amount);
  if (isNaN(amount) || amount <= 0) {
    throw createError('Сумма должна быть числом больше 0', 400, 'VALIDATION_ERROR');
  }

  // Проверка даты (формат YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!data.date || !dateRegex.test(data.date)) {
    throw createError('Дата должна быть в формате YYYY-MM-DD', 400, 'VALIDATION_ERROR');
  }

  // Проверка валидности даты
  const dateObj = new Date(data.date);
  if (isNaN(dateObj.getTime())) {
    throw createError('Некорректная дата', 400, 'VALIDATION_ERROR');
  }

  // Проверка категории
  const validCategories = type === 'income' ? INCOME_CATEGORY_IDS : EXPENSE_CATEGORY_IDS;
  if (!data.category || !validCategories.includes(data.category)) {
    throw createError(
      `Некорректная категория. Допустимые значения: ${validCategories.join(', ')}`,
      400,
      'VALIDATION_ERROR'
    );
  }

  // Проверка комментария (опциональное поле, но если есть — должно быть строкой)
  if (data.comment !== undefined && typeof data.comment !== 'string') {
    throw createError('Комментарий должен быть строкой', 400, 'VALIDATION_ERROR');
  }

  // Проверка is_recurring для расходов (опциональное поле)
  if (type === 'expense' && data.is_recurring !== undefined) {
    if (typeof data.is_recurring !== 'boolean' && data.is_recurring !== 0 && data.is_recurring !== 1) {
      throw createError('is_recurring должен быть boolean или 0/1', 400, 'VALIDATION_ERROR');
    }
  }
};

/**
 * Middleware для валидации дохода
 */
export const validateIncome = (req, res, next) => {
  try {
    validateTransaction(req.body, 'income');
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware для валидации расхода
 */
export const validateExpense = (req, res, next) => {
  try {
    validateTransaction(req.body, 'expense');
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Валидация ID в параметрах запроса
 * @param {string} id - идентификатор
 * @throws {Error} если ID невалиден
 */
export const validateId = (id) => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw createError('ID должен быть непустой строкой', 400, 'VALIDATION_ERROR');
  }
};

/**
 * Middleware для валидации ID в параметрах
 */
export const validateIdParam = (req, res, next) => {
  try {
    validateId(req.params.id);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Валидация query-параметров для пагинации
 * @param {Object} query - query-параметры запроса
 * @returns {Object} валидированные параметры { page, limit }
 */
export const validatePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 50));
  
  return { page, limit };
};

/**
 * Валидация query-параметров для фильтров
 * @param {Object} query - query-параметры запроса
 * @param {string} type - тип операции ('income' или 'expense')
 * @returns {Object} валидированные фильтры
 */
export const validateFilters = (query, type = 'expense') => {
  const filters = {};

  // Фильтр по категории
  if (query.category) {
    const validCategories = type === 'income' ? INCOME_CATEGORY_IDS : EXPENSE_CATEGORY_IDS;
    if (!validCategories.includes(query.category)) {
      throw createError(
        `Некорректная категория. Допустимые значения: ${validCategories.join(', ')}`,
        400,
        'VALIDATION_ERROR'
      );
    }
    filters.category = query.category;
  }

  // Фильтр по дате начала
  if (query.dateFrom) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(query.dateFrom)) {
      throw createError('dateFrom должна быть в формате YYYY-MM-DD', 400, 'VALIDATION_ERROR');
    }
    filters.dateFrom = query.dateFrom;
  }

  // Фильтр по дате окончания
  if (query.dateTo) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(query.dateTo)) {
      throw createError('dateTo должна быть в формате YYYY-MM-DD', 400, 'VALIDATION_ERROR');
    }
    filters.dateTo = query.dateTo;
  }

  return filters;
};