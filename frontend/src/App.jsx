import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Investments from './pages/Investments';
import Goals from './pages/Goals';
import Planner from './pages/Planner';
import Coach from './pages/Coach';
import CommerceAgent from './pages/CommerceAgent';
import { ErrorBoundary } from './components/ErrorBoundary';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <ErrorBoundary>{children}</ErrorBoundary>;
};

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />

      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="budgets" element={<Budgets />} />
        <Route path="investments" element={<Investments />} />
        <Route path="goals" element={<Goals />} />
        <Route path="planner" element={<Planner />} />
        <Route path="coach" element={<Coach />} />
        <Route path="commerce" element={<CommerceAgent />} />
      </Route>
    </Routes>
  );
}