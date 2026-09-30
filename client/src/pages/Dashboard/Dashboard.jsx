import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Dashboard.module.css';
import BalanceCard from '../../components/BalanceCard/BalanceCard';
import TransactionList from '../../components/TransactionList/TransactionList';
import Modal from '../../components/Modal/Modal';
import TransactionForm from '../../components/TransactionForm/TransactionForm';
import EmptyState from '../../components/EmptyState/EmptyState';
import * as summaryService from '../../services/summaryService';
import * as incomeService from '../../services/incomeService';
import * as expenseService from '../../services/expenseService';

function Dashboard() {
  const navigate = useNavigate();

  // Состояние данных
  const [balance, setBalance] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Состояние модалки
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Загрузка данных с сервера
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Загружаем баланс и последние операции параллельно
      const [balanceData, transactions] = await Promise.all([
        summaryService.getBalance('all'),
        summaryService.getAllTransactions(5),
      ]);

      setBalance(balanceData);
      setRecentTransactions(transactions);
    } catch (err) {
      console.error('Ошибка загрузки данных Dashboard:', err);
      setError('Не удалось загрузить данные. Проверьте, запущен ли сервер.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Загружаем данные при монтировании компонента
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Обработчик добавления операции
  const handleSubmit = async (transactionData) => {
    try {
      if (transactionData.type === 'income') {
        await incomeService.addIncome(transactionData);
      } else {
        await expenseService.addExpense(transactionData);
      }

      // Закрываем модалку и перезагружаем данные
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Ошибка добавления операции:', err);
      alert(`Ошибка: ${err.message || 'Не удалось добавить операцию'}`);
    }
  };

  // Обработчик удаления операции
  const handleDelete = async (transaction) => {
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

  // Обработчик редактирования — переходим на страницу истории
  const handleEdit = (transaction) => {
    navigate('/history', { state: { editTransaction: transaction } });
  };

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  // Состояние загрузки
  if (isLoading) {
    return (
      <div className={styles.dashboard}>
        <h1 className={styles.title}>Главная</h1>
        <div className={styles.loading}>
          <p>Загрузка данных...</p>
        </div>
      </div>
    );
  }

  // Состояние ошибки
  if (error) {
    return (
      <div className={styles.dashboard}>
        <h1 className={styles.title}>Главная</h1>
        <div className={styles.error}>
          <p>⚠️ {error}</p>
          <button onClick={loadData} className={styles.retryButton}>
            Повторить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <h1 className={styles.title}>Главная</h1>

      {/* Карточки баланса */}
      <div className={styles.balanceGrid}>
        <BalanceCard
          title="Доходы"
          amount={balance.totalIncome}
          type="income"
        />
        <BalanceCard
          title="Расходы"
          amount={balance.totalExpense}
          type="expense"
        />
        <BalanceCard
          title="Баланс"
          amount={balance.balance}
          type="balance"
        />
      </div>

      {/* Последние операции */}
      <div className={styles.recentSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Последние операции</h2>
          <button
            className={styles.viewAllButton}
            onClick={() => navigate('/history')}
          >
            Все операции →
          </button>
        </div>

        {recentTransactions.length > 0 ? (
          <TransactionList
            transactions={recentTransactions}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <EmptyState
            title="Нет операций"
            description="Добавьте первую операцию, чтобы начать отслеживание финансов"
            actionLabel="Добавить операцию"
            onAction={handleOpenModal}
          />
        )}
      </div>

      {/* Плавающая кнопка добавления */}
      <button
        className={styles.addButton}
        onClick={handleOpenModal}
        title="Добавить операцию"
      >
        +
      </button>

      {/* Модальное окно с формой */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Новая операция"
      >
        <TransactionForm
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
}

export default Dashboard;