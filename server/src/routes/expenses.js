import { Router } from 'express';
import * as expenseController from '../controllers/expenseController.js';
import { validateExpense, validateIdParam } from '../middleware/validate.js';

const router = Router();

/**
 * GET /api/v1/expenses
 * Получить список всех расходов с пагинацией и фильтрацией
 */
router.get('/', expenseController.getAllExpenses);

/**
 * GET /api/v1/expenses/:id
 * Получить расход по ID
 */
router.get('/:id', validateIdParam, expenseController.getExpenseById);

/**
 * POST /api/v1/expenses
 * Создать новый расход
 */
router.post('/', validateExpense, expenseController.createExpense);

/**
 * PUT /api/v1/expenses/:id
 * Обновить существующий расход
 */
router.put('/:id', validateIdParam, validateExpense, expenseController.updateExpense);

/**
 * DELETE /api/v1/expenses/:id
 * Удалить расход по ID
 */
router.delete('/:id', validateIdParam, expenseController.deleteExpense);

export default router;