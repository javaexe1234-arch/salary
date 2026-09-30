import * as expenseService from '../services/expenseService.js';
import { validatePagination, validateFilters } from '../middleware/validate.js';
import { createError } from '../middleware/errorHandler.js';

/**
 * Получить список всех расходов с пагинацией и фильтрацией
 * GET /api/v1/expenses
 */
export const getAllExpenses = (req, res, next) => {
  try {
    // Валидация и извлечение параметров пагинации и фильтров
    const { page, limit } = validatePagination(req.query);
    const filters = validateFilters(req.query, 'expense');
    
    // Добавляем фильтр isRecurring, если он передан
    if (req.query.isRecurring !== undefined) {
      filters.isRecurring = req.query.isRecurring === 'true';
    }

    // Получение данных из сервиса
    const result = expenseService.getAllExpenses({ page, limit, ...filters });

    // Формирование ответа
    res.status(200).json({
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Получить расход по ID
 * GET /api/v1/expenses/:id
 */
export const getExpenseById = (req, res, next) => {
  try {
    const { id } = req.params;
    const expense = expenseService.getExpenseById(id);

    if (!expense) {
      throw createError('Расход не найден', 404, 'NOT_FOUND');
    }

    res.status(200).json({ data: expense });
  } catch (error) {
    next(error);
  }
};

/**
 * Создать новый расход
 * POST /api/v1/expenses
 */
export const createExpense = (req, res, next) => {
  try {
    // req.body уже провалидирован middleware validateExpense
    const newExpense = expenseService.createExpense(req.body);
    
    res.status(201).json({ 
      message: 'Расход успешно создан',
      data: newExpense 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Обновить существующий расход
 * PUT /api/v1/expenses/:id
 */
export const updateExpense = (req, res, next) => {
  try {
    const { id } = req.params;
    // req.body уже провалидирован middleware
    const updatedExpense = expenseService.updateExpense(id, req.body);
    
    res.status(200).json({ 
      message: 'Расход успешно обновлён',
      data: updatedExpense 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Удалить расход по ID
 * DELETE /api/v1/expenses/:id
 */
export const deleteExpense = (req, res, next) => {
  try {
    const { id } = req.params;
    expenseService.deleteExpense(id);
    
    res.status(200).json({ 
      message: 'Расход успешно удалён' 
    });
  } catch (error) {
    next(error);
  }
};