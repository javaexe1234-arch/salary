import { BrowserRouter, Routes, Route } from 'react-router-dom';
import styles from './App.module.css';

// Временные заглушки для страниц (будут заменены на настоящие компоненты)
const DashboardPlaceholder = () => <div style={{ padding: '2rem' }}>Dashboard</div>;
const HistoryPlaceholder = () => <div style={{ padding: '2rem' }}>History</div>;
const AnalyticsPlaceholder = () => <div style={{ padding: '2rem' }}>Analytics</div>;

// Временная заглушка для Layout (будет заменена на настоящий компонент)
const LayoutPlaceholder = ({ children }) => <>{children}</>;

function App() {
  return (
    <BrowserRouter>
      <div className={styles.app}>
        <Routes>
          <Route 
            path="/" 
            element={
              <LayoutPlaceholder>
                <DashboardPlaceholder />
              </LayoutPlaceholder>
            } 
          />
          <Route 
            path="/history" 
            element={
              <LayoutPlaceholder>
                <HistoryPlaceholder />
              </LayoutPlaceholder>
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <LayoutPlaceholder>
                <AnalyticsPlaceholder />
              </LayoutPlaceholder>
            } 
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;