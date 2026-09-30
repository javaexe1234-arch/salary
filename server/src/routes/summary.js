import { Router } from 'express';
import * as summaryController from '../controllers/summaryController.js';

const router = Router();

/**
 * GET /api/v1/summary/balance
 * Получить общий баланс (сумма доходов, расходов и разница)
 */
router.get('/balance', summaryController.getBalance);

/**
 * GET /api/v1/summary/by-category
 * Получить сумму операций, сгруппированную по категориям
 * Query params: type (income/expense), dateFrom, dateTo
 */
router.get('/by-category', summaryController.getByCategory);

/**
 * GET /api/v1/summary/by-month
 * Получить помесячную статистику доходов и расходов
 * Query params: dateFrom, dateTo
 */
router.get('/by-month', summaryController.getByMonth);

export default router;