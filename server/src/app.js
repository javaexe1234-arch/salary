import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Импорт роутов
import incomesRouter from './routes/incomes.js';
import expensesRouter from './routes/expenses.js';
import summaryRouter from './routes/summary.js';

// Создаём экземпляр Express-приложения
const app = express();

// Подключаем middleware для обработки CORS (разрешаем запросы с фронтенда)
app.use(cors(config.corsOptions));

// Подключаем middleware для парсинга JSON в теле запроса
app.use(express.json());

// Подключаем middleware для парсинга URL-encoded данных (для форм)
app.use(express.urlencoded({ extended: true }));

// Подключаем роуты с префиксом /api/v1/
app.use('/api/v1/incomes', incomesRouter);
app.use('/api/v1/expenses', expensesRouter);
app.use('/api/v1/summary', summaryRouter);

// Простой health-check эндпоинт для проверки работоспособности сервера
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Сервер Salary Tracker работает',
    timestamp: new Date().toISOString(),
  });
});

// Обработчик для несуществующих маршрутов (404) — должен быть после всех роутов
app.use(notFoundHandler);

// Централизованный обработчик ошибок — должен быть самым последним middleware
app.use(errorHandler);

// Экспортируем приложение для использования в index.js
export default app;