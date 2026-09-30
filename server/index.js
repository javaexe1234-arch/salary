import app from './src/app.js';
import { config } from './src/config/index.js';

// Импортируем подключение к БД, чтобы таблицы создались при старте
import './src/db/connection.js';

/**
 * Запуск HTTP-сервера
 * better-sqlite3 использует синхронный API, поэтому не нужен async/await
 */
const startServer = () => {
  try {
    app.listen(config.port, () => {
      console.log('');
      console.log('🚀 ========================================');
      console.log(`✅ Salary Tracker API запущен`);
      console.log(`📍 Порт: ${config.port}`);
      console.log(`🌐 URL: http://localhost:${config.port}`);
      console.log(`🔗 Health-check: http://localhost:${config.port}/health`);
      console.log(`📊 API: http://localhost:${config.port}/api/v1/`);
      console.log(`🔒 CORS разрешён для: ${config.corsOptions.origin}`);
      console.log('🚀 ========================================');
      console.log('');
      console.log('Доступные эндпоинты:');
      console.log('  GET    /api/v1/incomes           — список доходов');
      console.log('  GET    /api/v1/incomes/:id       — доход по ID');
      console.log('  POST   /api/v1/incomes           — создать доход');
      console.log('  PUT    /api/v1/incomes/:id       — обновить доход');
      console.log('  DELETE /api/v1/incomes/:id       — удалить доход');
      console.log('');
      console.log('  GET    /api/v1/expenses          — список расходов');
      console.log('  GET    /api/v1/expenses/:id      — расход по ID');
      console.log('  POST   /api/v1/expenses          — создать расход');
      console.log('  PUT    /api/v1/expenses/:id      — обновить расход');
      console.log('  DELETE /api/v1/expenses/:id      — удалить расход');
      console.log('');
      console.log('  GET    /api/v1/summary/balance       — общий баланс');
      console.log('  GET    /api/v1/summary/by-category   — по категориям');
      console.log('  GET    /api/v1/summary/by-month      — по месяцам');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Ошибка при запуске сервера:', error);
    process.exit(1);
  }
};

// Обработка необработанных исключений
process.on('uncaughtException', (error) => {
  console.error('❌ Необработанное исключение:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Необработанный отказ промиса:', reason);
  process.exit(1);
});

// Обработка сигналов завершения для корректного закрытия
process.on('SIGTERM', () => {
  console.log('🛑 Получен сигнал SIGTERM. Завершаем работу сервера...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Получен сигнал SIGINT. Завершаем работу сервера...');
  process.exit(0);
});

// Запускаем сервер
startServer();