export const errorHandler = (err, req, res, next) => {
  console.error('❌ Ошибка сервера:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  const statusCode = err.statusCode || err.status || 500;
  const errorCode = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'Произошла внутренняя ошибка сервера';

  res.status(statusCode).json({
    error: {
      code: errorCode,
      message: message,
    },
  });
};

export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Маршрут ${req.method} ${req.path} не найден`,
    },
  });
};

export const createError = (message, statusCode = 500, code = 'INTERNAL_ERROR') => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};