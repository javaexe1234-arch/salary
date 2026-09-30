import { Router } from 'express';
import * as incomeController from '../controllers/incomeController.js';
import { validateIncome, validateIdParam } from '../middleware/validate.js';

const router = Router();

/**
 * GET /api/v1/incomes
 * Получить список всех доходов с пагинацией и фильтрацией
 */
router.get('/', incomeController.getAllIncomes);

/**
 * GET /api/v1/incomes/:id
 * Получить доход по ID
 */
router.get('/:id', validateIdParam, incomeController.getIncomeById);

/**
 * POST /api/v1/incomes
 * Создать новый доход
 */
router.post('/', validateIncome, incomeController.createIncome);

/**
 * PUT /api/v1/incomes/:id
 * Обновить существующий доход
 */
router.put('/:id', validateIdParam, validateIncome, incomeController.updateIncome);

/**
 * DELETE /api/v1/incomes/:id
 * Удалить доход по ID
 */
router.delete('/:id', validateIdParam, incomeController.deleteIncome);

export default router;