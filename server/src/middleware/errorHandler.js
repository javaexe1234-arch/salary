/**
 * Централизованный обработчик ошибок Express
 * Перехватывает все ошибки и возвращает единый формат ответа
 * @param {Error} err - объект ошибки
 * @param {Object} req - объект запроса Express
 * @param {Object} res - объект ответа Express
 * @param {Function} next - следующая middleware-функция
 */
export const errorHandler = (err, req, res, next) => {
  // Логируем ошибку в консоль для отладки
  console.error('❌ Ошибка сервера:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Определяем HTTP-статус (по умолчанию 500 - внутренняя ошибка сервера)
  const statusCode = err.statusCode || err.status || 500;

  // Определяем код ошибки для клиента
  const errorCode = err.code || 'INTERNAL_ERROR';

  // Определяем сообщение об ошибке
  const message = err.message || 'Произошла внутренняя ошибка сервера';

  // Формируем единый формат ответа
  res.status(statusCode).json({
    error: {
      code: errorCode,
      message: message,
    },
  });
};

/**
 * Обработчик для несуществующих маршрутов (404)
 * Должен быть подключён после всех роутов
 * @param {Object} req - объект запроса Express
 * @param {Object} res - объект ответа Express
 * @param {Function} next - следующая middleware-функция
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Маршрут ${req.method} ${req.path} не найден`,
    },
  });
};

/**
 * Функция для создания кастомных ошибок с дополнительными свойствами
 * @param {string} message - сообщение об ошибке
 * @param {number} statusCode - HTTP-статус
 * @param {string} code - код ошибки
 * @returns {Error} объект ошибки с дополнительными свойствами
 */
export const createError = (message, statusCode = 500, code = 'INTERNAL_ERROR') => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};