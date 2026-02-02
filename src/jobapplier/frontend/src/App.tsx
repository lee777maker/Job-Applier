import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from '@/context/AppContext';
import { Toaster } from '@/components/ui/sonner';

// Pages
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import CVUploadPage from '@/pages/CVUploadPage';
import JobPreferencesPage from '@/pages/JobPreferencesPage';
import DashboardPage from '@/pages/DashboardPage';
import ATSScorePage from '@/pages/ATSScorePage';
import ProfilePage from '@/pages/ProfilePage';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useApp();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

// Onboarding Route - redirects to preferences if not completed
function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, jobPreferences } = useApp();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!jobPreferences) {
    return <Navigate to="/preferences" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      
      {/* Protected Routes */}
      <Route 
        path="/upload-cv" 
        element={
          <ProtectedRoute>
            <CVUploadPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/preferences" 
        element={
          <ProtectedRoute>
            <JobPreferencesPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Onboarding Complete Routes */}
      <Route 
        path="/dashboard" 
        element={
          <OnboardingRoute>
            <DashboardPage />
          </OnboardingRoute>
        } 
      />
      <Route 
        path="/ats-score" 
        element={
          <OnboardingRoute>
            <ATSScorePage />
          </OnboardingRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <OnboardingRoute>
            <ProfilePage />
          </OnboardingRoute>
        } 
      />
      
      {/* Default Redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AppProvider>
      <Router>
        <AppRoutes />
      </Router>
      <Toaster position="top-center" />
    </AppProvider>
  );
}

export default App;
