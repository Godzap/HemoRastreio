import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Placeholder pages - to be implemented
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div style={{ padding: '24px' }}>
    <h1 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{title}</h1>
    <p style={{ color: '#666' }}>Esta página será implementada em breve.</p>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="samples" element={<PlaceholderPage title="Amostras" />} />
            <Route path="storage" element={<PlaceholderPage title="Armazenamento" />} />
            <Route path="transfers" element={<PlaceholderPage title="Transferências" />} />
            <Route path="reports" element={<PlaceholderPage title="Relatórios" />} />
            <Route path="users" element={<PlaceholderPage title="Usuários" />} />
            <Route path="settings" element={<PlaceholderPage title="Configurações" />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
