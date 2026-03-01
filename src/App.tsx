import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SessionRoom from './pages/SessionRoom';
import DashboardLayout from './components/DashboardLayout';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function AppContent() {
  const { user, loading, session } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0A0A0A]">
        <div className="text-white font-mono text-sm animate-pulse tracking-widest uppercase">
          Initializing Jumbotron...
        </div>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        } />
        <Route path="/session/:sessionId" element={<SessionRoom />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
