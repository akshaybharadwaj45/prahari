import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from './components/layout/AppShell';
import OverviewPage from './pages/OverviewPage';
import PredictionPage from './pages/PredictionPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import ModelLabPage from './pages/ModelLabPage';
import SettingsPage from './pages/SettingsPage';
import GlobePage from './pages/GlobePage';
import FeaturesArticlePage from './pages/FeaturesArticlePage';
import { AuthProvider } from './contexts/AuthContext';

const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    if (localStorage.getItem('prahari_theme') === 'light') {
      document.documentElement.classList.add('light');
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<AppShell><OverviewPage /></AppShell>} />
            <Route path="/prediction" element={<AppShell><PredictionPage /></AppShell>} />
            <Route path="/events" element={<AppShell><EventsPage /></AppShell>} />
            <Route path="/events/:eventId" element={<AppShell><EventDetailPage /></AppShell>} />
            <Route path="/globe" element={<AppShell><GlobePage /></AppShell>} />
            <Route path="/model-lab" element={<AppShell><ModelLabPage /></AppShell>} />
            <Route path="/model-lab/features" element={<AppShell><FeaturesArticlePage /></AppShell>} />
            <Route path="/settings" element={<AppShell><SettingsPage /></AppShell>} />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
