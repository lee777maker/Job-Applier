import { AppProvider, useApp } from '@/context/AppContext';
import { Navigation } from '@/components/custom/Navigation';
import { HomePage } from '@/pages/HomePage';
import { ProfilePage } from '@/pages/ProfilePage';
import { DashboardPage } from '@/pages/DashboardPage';
import { JobsPage } from '@/pages/JobsPage';
import './App.css';

function AppContent() {
  const { currentPage } = useApp();

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navigation />
      <main>
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'profile' && <ProfilePage />}
        {currentPage === 'dashboard' && <DashboardPage />}
        {currentPage === 'jobs' && <JobsPage />}
      </main>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
