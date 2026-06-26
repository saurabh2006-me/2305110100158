import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider } from './context/ThemeContext';
import { MainLayout } from './layouts/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Notifications } from './pages/Notifications';
import { PriorityInbox } from './pages/PriorityInbox';
import { NotificationDetail } from './pages/NotificationDetail';
import { Login } from './pages/Login';
import { NotFound } from './pages/NotFound';
import { Log } from './api/client';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      refetchOnWindowFocus: false,
      onError: (error) => {
        Log('frontend', 'error', 'state', 'Query error', { error: (error as Error).message });
      }
    }
  }
});

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="notifications/:id" element={<NotificationDetail />} />
              <Route path="priority" element={<PriorityInbox />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
