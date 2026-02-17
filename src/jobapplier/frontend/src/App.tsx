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

// Onboarding Route - checks for CV upload AND preferences completion
function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, jobPreferences, profile } = useApp();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if CV has been uploaded (profile has resume data)
  if (!profile?.resumeFileName) {
    return <Navigate to="/upload-cv" replace />;
  }
  
  // Check if preferences are set
  if (!jobPreferences?.preferredRole) {
    return <Navigate to="/preferences" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useApp();
  
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        isAuthenticated 
          ? <Navigate to="/dashboard" replace />
          : <LoginPage />
      } />
      
      <Route path="/signup" element={
        isAuthenticated 
          ? <Navigate to="/upload-cv" replace />
          : <SignupPage />
      } />
  
      {/* Protected Onboarding Routes */}
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
      
      {/* Fully Onboarded Routes - require CV AND preferences */}
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