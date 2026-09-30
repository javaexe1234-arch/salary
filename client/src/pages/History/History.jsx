import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './History.module.css';
import TransactionList from '../../components/TransactionList/TransactionList';
import Modal from '../../components/Modal/Modal';
import TransactionForm from '../../components/TransactionForm/TransactionForm';
import * as incomeService from '../../services/incomeService';
import * as expenseService from '../../services/expenseService';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../../utils/constants';

function History() {
  const location = useLocation();
  const navigate = useNavigate();

  // Состояние фильтров
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');

  // Состояние модалки
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // Состояние данных
  const [allTransactions, setAllTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Загрузка данных с сервера
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Формируем параметры фильтрации для API
      const filters = {};
      if (typeFilter !== 'all') filters.type = typeFilter;
      if (categoryFilter !== 'all') filters.category = categoryFilter;
      
      // Конвертируем период в даты
      if (periodFilter !== 'all') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let dateFrom = null;

        switch (periodFilter) {
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
        }

        if (dateFrom) {
          filters.dateFrom = dateFrom.toISOString().split('T')[0];
          filters.dateTo = today.toISOString().split('T')[0];
        }
      }

      // Загружаем доходы и расходы параллельно
      const [incomesRes, expensesRes] = await Promise.all([
        incomeService.getIncomes(filters),
        expenseService.getExpenses(filters),
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

      setAllTransactions(allTransactions);
    } catch (err) {
      console.error('Ошибка загрузки данных History:', err);
      setError('Не удалось загрузить данные. Проверьте, запущен ли сервер.');
    } finally {
      setIsLoading(false);
    }
  }, [typeFilter, categoryFilter, periodFilter]);

  // Загружаем данные при монтировании и изменении фильтров
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Проверяем, передана ли операция для редактирования через state
  useEffect(() => {
    if (location.state?.editTransaction) {
      setEditingTransaction(location.state.editTransaction);
      setIsModalOpen(true);
      // Очищаем state, чтобы не открывалась модалка при следующем переходе
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  // Получаем категории для текущего фильтра типа
  const getCategoriesForFilter = () => {
    if (typeFilter === 'income') {
      return INCOME_CATEGORIES;
    } else if (typeFilter === 'expense') {
      return EXPENSE_CATEGORIES;
    } else {
      // Все категории (доходы + расходы)
      return [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];
    }
  };

  // Открытие модалки для добавления
  const handleOpenAddModal = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  // Открытие модалки для редактирования
  const handleOpenEditModal = (transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  // Закрытие модалки
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  // Обработка отправки формы (добавление или редактирование)
  const handleSubmit = async (data) => {
    try {
      if (editingTransaction?.id) {
        // Редактирование существующей операции
        if (editingTransaction.type === 'income') {
          await incomeService.updateIncome(editingTransaction.id, data);
        } else {
          await expenseService.updateExpense(editingTransaction.id, data);
        }
      } else {
        // Добавление новой операции
        if (data.type === 'income') {
          await incomeService.addIncome(data);
        } else {
          await expenseService.addExpense(data);
        }
      }

      // Перезагружаем данные
      await loadData();
      handleCloseModal();
    } catch (err) {
      console.error('Ошибка сохранения операции:', err);
      alert(`Ошибка: ${err.message || 'Не удалось сохранить операцию'}`);
    }
  };

  // Обработка удаления операции
  const handleDelete = async (transaction) => {
    if (!transaction?.id) return;

    if (!window.confirm('Вы уверены, что хотите удалить эту операцию?')) return;

    try {
      if (transaction.type === 'income') {
        await incomeService.deleteIncome(transaction.id);
      } else {
        await expenseService.deleteExpense(transaction.id);
      }

      // Перезагружаем данные
      await loadData();
    } catch (err) {
      console.error('Ошибка удаления операции:', err);
      alert(`Ошибка: ${err.message || 'Не удалось удалить операцию'}`);
    }
  };

  // Сброс фильтров
  const handleResetFilters = () => {
    setTypeFilter('all');
    setCategoryFilter('all');
    setPeriodFilter('all');
  };

  // Смена типа фильтра — сбрасываем фильтр по категории
  const handleTypeFilterChange = (newType) => {
    setTypeFilter(newType);
    setCategoryFilter('all');
  };

  // Состояние загрузки
  if (isLoading) {
    return (
      <div className={styles.history}>
        <h1 className={styles.title}>История операций</h1>
        <div className={styles.listContainer}>
          <div style={{ textAlign: 'center', padding: '48px 24px', color: '#6b7280' }}>
            Загрузка данных...
          </div>
        </div>
      </div>
    );
  }

  // Состояние ошибки
  if (error) {
    return (
      <div className={styles.history}>
        <h1 className={styles.title}>История операций</h1>
        <div className={styles.listContainer}>
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
    );
  }

  return (
    <div className={styles.history}>
      <h1 className={styles.title}>История операций</h1>

      {/* Панель фильтров */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Тип операции</label>
          <select
            className={styles.filterInput}
            value={typeFilter}
            onChange={(e) => handleTypeFilterChange(e.target.value)}
          >
            <option value="all">Все</option>
            <option value="income">Доходы</option>
            <option value="expense">Расходы</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Категория</label>
          <select
            className={styles.filterInput}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">Все категории</option>
            {(getCategoriesForFilter() || []).map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Период</label>
          <select
            className={styles.filterInput}
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
          >
            <option value="all">Всё время</option>
            <option value="today">Сегодня</option>
            <option value="week">Неделя</option>
            <option value="month">Месяц</option>
            <option value="year">Год</option>
          </select>
        </div>

        <button
          className={styles.resetButton}
          onClick={handleResetFilters}
        >
          Сбросить фильтры
        </button>
      </div>

      {/* Список операций */}
      <div className={styles.listContainer}>
        <TransactionList
          transactions={allTransactions}
          onEdit={handleOpenEditModal}
          onDelete={handleDelete}
        />
      </div>

      {/* Модальное окно с формой */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTransaction ? 'Редактировать операцию' : 'Новая операция'}
      >
        <TransactionForm
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          editData={editingTransaction}
        />
      </Modal>
    </div>
  );
}

export default History;