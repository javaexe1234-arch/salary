import * as api from './api';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../utils/constants';
import { getMonthNameShort } from '../utils/formatters';

/**
 * Конвертирует период ('today', 'week', 'month', 'year', 'all')
 * в объект { dateFrom, dateTo } для backend
 * @param {string} period - период
 * @returns {Object} { dateFrom, dateTo } или пустой объект для 'all'
 */
const periodToDates = (period) => {
  if (!period || period === 'all') return {};

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let dateFrom = null;

  switch (period) {
    case 'today':
      dateFrom = today;
      break;
    case 'week': {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 6);
      dateFrom = weekAgo;
      break;
    }
    case 'month': {
      dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    }
    case 'year': {
      dateFrom = new Date(now.getFullYear(), 0, 1);
      break;
    }
    default:
      return {};
  }

  const formatDate = (d) => d.toISOString().split('T')[0];
  return {
    dateFrom: formatDate(dateFrom),
    dateTo: formatDate(today),
  };
};

/**
 * Получить общий баланс (сумма доходов, расходов и разницу)
 * @param {string} period - период ('all', 'today', 'week', 'month', 'year')
 * @returns {Promise<Object>} { totalIncome, totalExpense, balance }
 */
export const getBalance = async (period = 'all') => {
  try {
    // Если период не 'all' — фильтруем по датам, иначе получаем общий баланс
    const dates = periodToDates(period);
    const hasFilter = Object.keys(dates).length > 0;

    if (hasFilter) {
      // Получаем доходы и расходы за период через пагинацию (большой limit)
      const [incomesRes, expensesRes] = await Promise.all([
        api.get('/incomes', { ...dates, limit: 10000 }),
        api.get('/expenses', { ...dates, limit: 10000 }),
      ]);

      const incomes = incomesRes.data || [];
      const expenses = expensesRes.data || [];

      const totalIncome = incomes.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
      const totalExpense = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      return {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
      };
    }

    // Без фильтра — используем эндпоинт /summary/balance
    const result = await api.get('/summary/balance');
    return result.data || { totalIncome: 0, totalExpense: 0, balance: 0 };
  } catch (error) {
    console.error('Ошибка получения баланса:', error);
    return { totalIncome: 0, totalExpense: 0, balance: 0 };
  }
};

/**
 * Получить все операции (доходы + расходы), отсортированные по дате
 * @param {number} limit - максимальное количество операций
 * @returns {Promise<Array>} массив операций
 */
export const getAllTransactions = async (limit = null) => {
  try {
    // Запрашиваем доходы и расходы параллельно
    const [incomesRes, expensesRes] = await Promise.all([
      api.get('/incomes', { limit: 10000 }),
      api.get('/expenses', { limit: 10000 }),
    ]);

    const incomes = (incomesRes.data || []).map((i) => ({ ...i, type: 'income' }));
    const expenses = (expensesRes.data || []).map((e) => ({ ...e, type: 'expense' }));

    const allTransactions = [...incomes, ...expenses];

    // Сортировка по дате (новые сначала)
    allTransactions.sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || 0);
      const dateB = new Date(b.date || b.createdAt || 0);
      return dateB - dateA;
    });

    if (limit && limit > 0) {
      return allTransactions.slice(0, limit);
    }
    return allTransactions;
  } catch (error) {
    console.error('Ошибка получения списка операций:', error);
    return [];
  }
};

/**
 * Получить сумму по категориям (для круговой диаграммы)
 * @param {string} type - тип операции ('income' или 'expense')
 * @param {string} period - период ('all', 'today', 'week', 'month', 'year')
 * @returns {Promise<Array>} массив объектов { name, value } для recharts
 */
export const getByCategory = async (type = 'expense', period = 'all') => {
  try {
    const dates = periodToDates(period);
    const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    // Используем эндпоинт /summary/by-category
    const result = await api.get('/summary/by-category', { type, ...dates });
    const data = result.data || [];

    // Преобразуем формат backend в формат recharts
    return data
      .map((item) => {
        const category = (categories || []).find((c) => c.id === item.category);
        return {
          name: category?.label || 'Прочее',
          value: Number(item.total) || 0,
        };
      })
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  } catch (error) {
    console.error('Ошибка получения данных по категориям:', error);
    return [];
  }
};

/**
 * Получить помесячную статистику (для столбчатого графика)
 * @param {number} monthsCount - количество последних месяцев (по умолчанию 6)
 * @returns {Promise<Array>} массив объектов { month, income, expense } для recharts
 */
export const getMonthlySummary = async (monthsCount = 6) => {
  try {
    // Используем эндпоинт /summary/by-month
    const result = await api.get('/summary/by-month');
    const data = result.data || [];

    // Генерируем список последних N месяцев для отображения (даже если данных нет)
    const now = new Date();
    const months = [];
    for (let i = monthsCount - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.push({
        key,
        label: getMonthNameShort(date.getMonth()),
      });
    }

    // Создаём карту данных из ответа backend
    const dataMap = {};
    (data || []).forEach((item) => {
      dataMap[item.month] = {
        income: Number(item.income) || 0,
        expense: Number(item.expense) || 0,
      };
    });

    // Собираем итоговый массив, подставляя нули для месяцев без данных
    return months.map((m) => ({
      month: m.label,
      income: dataMap[m.key]?.income || 0,
      expense: dataMap[m.key]?.expense || 0,
    }));
  } catch (error) {
    console.error('Ошибка получения помесячной статистики:', error);
    return [];
  }
};

/**
 * Получить операцию по ID (из доходов или расходов)
 * @param {string} id - идентификатор операции
 * @returns {Promise<Object|null>} объект операции или null
 */
export const getTransactionById = async (id) => {
  if (!id) return null;
  try {
    // Пробуем найти в доходах
    const incomeResult = await api.get(`/incomes/${id}`);
    if (incomeResult.data) {
      return { ...incomeResult.data, type: 'income' };
    }
  } catch (e) {
    // Не нашли в доходах — ищем в расходах
  }

  try {
    const expenseResult = await api.get(`/expenses/${id}`);
    if (expenseResult.data) {
      return { ...expenseResult.data, type: 'expense' };
    }
  } catch (e) {
    // Не нашли нигде
  }

  return null;
};