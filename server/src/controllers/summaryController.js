import * as summaryService from '../services/summaryService.js';
import { createError } from '../middleware/errorHandler.js';

/**
 * Получить общий баланс (сумма доходов, расходов и разница)
 * GET /api/v1/summary/balance
 */
export const getBalance = (req, res, next) => {
  try {
    const balance = summaryService.getBalance();
    
    res.status(200).json({
      data: balance,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Получить сумму операций, сгруппированную по категориям
 * GET /api/v1/summary/by-category?type=expense&dateFrom=2026-01-01&dateTo=2026-12-31
 */
export const getByCategory = (req, res, next) => {
  try {
    // Тип операции: 'income' или 'expense' (по умолчанию 'expense')
    const type = req.query.type || 'expense';
    
    // Валидация типа
    if (type !== 'income' && type !== 'expense') {
      throw createError(
        'Параметр type должен быть "income" или "expense"',
        400,
        'VALIDATION_ERROR'
      );
    }

    // Опциональные фильтры по датам
    const filters = {};
    if (req.query.dateFrom) filters.dateFrom = req.query.dateFrom;
    if (req.query.dateTo) filters.dateTo = req.query.dateTo;

    const data = summaryService.getByCategory(type, filters);

    res.status(200).json({
      data,
      meta: {
        type,
        filters,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Получить помесячную статистику доходов и расходов
 * GET /api/v1/summary/by-month?dateFrom=2026-01-01&dateTo=2026-12-31
 */
export const getByMonth = (req, res, next) => {
  try {
    // Опциональные фильтры по датам
    const filters = {};
    if (req.query.dateFrom) filters.dateFrom = req.query.dateFrom;
    if (req.query.dateTo) filters.dateTo = req.query.dateTo;

    const data = summaryService.getByMonth(filters);

    res.status(200).json({
      data,
      meta: {
        filters,
      },
    });
  } catch (error) {
    next(error);
  }
};