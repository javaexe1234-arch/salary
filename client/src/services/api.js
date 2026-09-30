// Базовый URL из переменных окружения или fallback по умолчанию
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

/**
 * Универсальная функция для выполнения HTTP-запросов
 * @param {string} path - путь относительно BASE_URL
 * @param {Object} options - опции для fetch (method, headers, body и т.д.)
 * @returns {Promise<Object>} - объект с полями data и pagination
 */
const request = async (path, options = {}) => {
  const url = `${BASE_URL}${path}`;
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const result = await response.json();

    if (!response.ok) {
      // Бэкенд возвращает формат { error: { code, message } }
      const errorData = result.error || { code: 'UNKNOWN_ERROR', message: 'Неизвестная ошибка сервера' };
      const error = new Error(errorData.message);
      error.code = errorData.code;
      error.status = response.status;
      throw error;
    }

    // Успешный ответ: возвращаем data и pagination (если есть)
    return {
      data: result.data,
      pagination: result.pagination || null,
    };
  } catch (error) {
    // Обработка ошибок сети или проблем с парсингом JSON
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Ошибка сети. Проверьте, запущен ли backend-сервер.');
    }
    throw error;
  }
};

/**
 * GET-запрос с поддержкой query-параметров
 * @param {string} path - путь
 * @param {Object} params - объект с query-параметрами
 */
export const get = async (path, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const url = queryString ? `${path}?${queryString}` : path;
  return request(url, { method: 'GET' });
};

/**
 * POST-запрос
 * @param {string} path - путь
 * @param {Object} body - тело запроса
 */
export const post = async (path, body) => {
  return request(path, { method: 'POST', body: JSON.stringify(body) });
};

/**
 * PUT-запрос
 * @param {string} path - путь
 * @param {Object} body - тело запроса
 */
export const put = async (path, body) => {
  return request(path, { method: 'PUT', body: JSON.stringify(body) });
};

/**
 * DELETE-запрос
 * @param {string} path - путь
 */
export const del = async (path) => {
  return request(path, { method: 'DELETE' });
};