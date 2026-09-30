import { INCOME_CATEGORY_IDS, EXPENSE_CATEGORY_IDS } from '../utils/categories.js';
import { createError } from './errorHandler.js';

export const validateTransaction = (data, type = 'expense') => {
  if (!data || typeof data !== 'object') {
    throw createError('Данные операции не переданы', 400, 'VALIDATION_ERROR');
  }

  const amount = Number(data.amount);
  if (isNaN(amount) || amount <= 0) {
    throw createError('Сумма должна быть числом больше 0', 400, 'VALIDATION_ERROR');
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!data.date || !dateRegex.test(data.date)) {
    throw createError('Дата должна быть в формате YYYY-MM-DD', 400, 'VALIDATION_ERROR');
  }

  const dateObj = new Date(data.date);
  if (isNaN(dateObj.getTime())) {
    throw createError('Некорректная дата', 400, 'VALIDATION_ERROR');
  }

  const validCategories = type === 'income' ? INCOME_CATEGORY_IDS : EXPENSE_CATEGORY_IDS;
  if (!data.category || !validCategories.includes(data.category)) {
    throw createError(
      `Некорректная категория. Допустимые значения: ${validCategories.join(', ')}`,
      400,
      'VALIDATION_ERROR'
    );
  }

  if (data.comment !== undefined && typeof data.comment !== 'string') {
    throw createError('Комментарий должен быть строкой', 400, 'VALIDATION_ERROR');
  }

  if (type === 'expense' && data.is_recurring !== undefined) {
    if (typeof data.is_recurring !== 'boolean' && data.is_recurring !== 0 && data.is_recurring !== 1) {
      throw createError('is_recurring должен быть boolean или 0/1', 400, 'VALIDATION_ERROR');
    }
  }
};

export const validateIncome = (req, res, next) => {
  try {
    validateTransaction(req.body, 'income');
    next();
  } catch (error) {
    next(error);
  }
};

export const validateExpense = (req, res, next) => {
  try {
    validateTransaction(req.body, 'expense');
    next();
  } catch (error) {
    next(error);
  }
};

export const validateId = (id) => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw createError('ID должен быть непустой строкой', 400, 'VALIDATION_ERROR');
  }
};

export const validateIdParam = (req, res, next) => {
  try {
    validateId(req.params.id);
    next();
  } catch (error) {
    next(error);
  }
};

export const validatePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 50));
  return { page, limit };
};

export const validateFilters = (query, type = 'expense') => {
  const filters = {};

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

  if (query.dateFrom) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(query.dateFrom)) {
      throw createError('dateFrom должна быть в формате YYYY-MM-DD', 400, 'VALIDATION_ERROR');
    }
    filters.dateFrom = query.dateFrom;
  }

  if (query.dateTo) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(query.dateTo)) {
      throw createError('dateTo должна быть в формате YYYY-MM-DD', 400, 'VALIDATION_ERROR');
    }
    filters.dateTo = query.dateTo;
  }

  return filters;
};