import * as incomeService from '../services/incomeService.js';
import { validatePagination, validateFilters } from '../middleware/validate.js';
import { createError } from '../middleware/errorHandler.js';

/**
 * Получить список всех доходов с пагинацией и фильтрацией
 * GET /api/v1/incomes
 */
export const getAllIncomes = (req, res, next) => {
  try {
    // Валидация и извлечение параметров пагинации и фильтров
    const { page, limit } = validatePagination(req.query);
    const filters = validateFilters(req.query, 'income');

    // Получение данных из сервиса
    const result = incomeService.getAllIncomes({ page, limit, ...filters });

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
 * Получить доход по ID
 * GET /api/v1/incomes/:id
 */
export const getIncomeById = (req, res, next) => {
  try {
    const { id } = req.params;
    const income = incomeService.getIncomeById(id);

    if (!income) {
      throw createError('Доход не найден', 404, 'NOT_FOUND');
    }

    res.status(200).json({ data: income });
  } catch (error) {
    next(error);
  }
};

/**
 * Создать новый доход
 * POST /api/v1/incomes
 */
export const createIncome = (req, res, next) => {
  try {
    // req.body уже провалидирован middleware validateIncome
    const newIncome = incomeService.createIncome(req.body);
    
    res.status(201).json({ 
      message: 'Доход успешно создан',
      data: newIncome 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Обновить существующий доход
 * PUT /api/v1/incomes/:id
 */
export const updateIncome = (req, res, next) => {
  try {
    const { id } = req.params;
    // req.body уже провалидирован middleware
    const updatedIncome = incomeService.updateIncome(id, req.body);
    
    res.status(200).json({ 
      message: 'Доход успешно обновлён',
      data: updatedIncome 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Удалить доход по ID
 * DELETE /api/v1/incomes/:id
 */
export const deleteIncome = (req, res, next) => {
  try {
    const { id } = req.params;
    incomeService.deleteIncome(id);
    
    res.status(200).json({ 
      message: 'Доход успешно удалён' 
    });
  } catch (error) {
    next(error);
  }
};