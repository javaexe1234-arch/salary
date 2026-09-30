import { useState, useEffect, useCallback } from 'react';
import styles from './Analytics.module.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import * as summaryService from '../../services/summaryService';

// Цвета для круговой диаграммы
const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

function Analytics() {
  // Состояние данных
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Состояние фильтров
  const [categoryPeriod, setCategoryPeriod] = useState('month');

  // Загрузка данных для графиков
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Загружаем данные параллельно
      const [monthly, byCategory] = await Promise.all([
        summaryService.getMonthlySummary(6),
        summaryService.getByCategory('expense', categoryPeriod),
      ]);

      setMonthlyData(monthly || []);
      setCategoryData(byCategory || []);
    } catch (err) {
      console.error('Ошибка загрузки данных Analytics:', err);
      setError('Не удалось загрузить данные. Проверьте, запущен ли сервер.');
    } finally {
      setIsLoading(false);
    }
  }, [categoryPeriod]);

  // Загружаем данные при монтировании и изменении периода
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Форматирование чисел для tooltip
  const formatAmount = (value) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Кастомный tooltip для столбчатого графика
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipLabel}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className={styles.tooltipValue} style={{ color: entry.color }}>
              {entry.name}: {formatAmount(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Кастомный tooltip для круговой диаграммы
  const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipLabel}>{data.name}</p>
          <p className={styles.tooltipValue} style={{ color: data.payload.fill }}>
            {formatAmount(data.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Состояние загрузки
  if (isLoading) {
    return (
      <div className={styles.analytics}>
        <h1 className={styles.title}>Аналитика</h1>
        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <h2 className={styles.chartTitle}>Доходы и расходы по месяцам</h2>
            <div style={{ textAlign: 'center', padding: '48px 24px', color: '#6b7280' }}>
              Загрузка данных...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Состояние ошибки
  if (error) {
    return (
      <div className={styles.analytics}>
        <h1 className={styles.title}>Аналитика</h1>
        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <div style={{ textAlign: 'center', padding: '48px 24px', color: '#ef4444' }}>
              <p>⚠️ {error}</p>
              <button
                onClick={loadData}
                style={{
                  marginTop: '16px',
                  padding: '10px 24px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Повторить
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.analytics}>
      <h1 className={styles.title}>Аналитика</h1>

      <div className={styles.chartsGrid}>
        {/* Столбчатый график: доходы и расходы по месяцам */}
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Доходы и расходы по месяцам</h2>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="income" name="Доходы" fill="#10b981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="expense" name="Расходы" fill="#ef4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className={styles.emptyState}>
              <p>Нет данных для отображения</p>
              <p className={styles.emptyHint}>Добавьте операции, чтобы увидеть статистику</p>
            </div>
          )}
        </div>

        {/* Круговая диаграмма: расходы по категориям */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>Расходы по категориям</h2>
            <select
              className={styles.periodSelect}
              value={categoryPeriod}
              onChange={(e) => setCategoryPeriod(e.target.value)}
            >
              <option value="today">Сегодня</option>
              <option value="week">Неделя</option>
              <option value="month">Месяц</option>
              <option value="year">Год</option>
              <option value="all">Всё время</option>
            </select>
          </div>

          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className={styles.emptyState}>
              <p>Нет расходов за выбранный период</p>
              <p className={styles.emptyHint}>Добавьте расходы, чтобы увидеть распределение по категориям</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Analytics;