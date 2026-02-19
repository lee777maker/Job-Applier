import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from '@/context/AppContext';
import { Toaster } from '@/components/ui/sonner';

// Pages
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import CVUploadPage from '@/pages/CVUploadPage';
import JobPreferencesPage from '@/pages/JobPreferencesPage';
import PastApplicationsPage from '@/pages/PastApplicationsPage';
import HomePage from '@/pages/HomePage';
import DashboardPage from '@/pages/DashboardPage';
import AssistancePage from '@/pages/AssistancePage';
import ProfilePage from '@/pages/ProfilePage';
import JobApplicationHistoryPage from '@/pages/JobApplicationHistoryPage';

// Loading component
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}

// Auth Guard - handles login state checking
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useApp();
  
  if (isLoading) return <LoadingScreen />;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

// Onboarding Guard 
function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, profile, jobPreferences, isLoading } = useApp();
  const location = useLocation();
  
  if (isLoading) return <LoadingScreen />;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  const currentPath = location.pathname;
  
  
  // 1. Check if CV uploaded
  const hasCV = !!profile?.resumeFileName || !!profile?.resumeText;
  
  // 2. Check if preferences completed
  const hasPreferences = !!jobPreferences?.preferredRole && 
                         jobPreferences?.contractTypes?.length > 0;
  
  // If no CV and trying to access anything except upload-cv, redirect to upload
  if (!hasCV && currentPath !== '/upload-cv') {
    return <Navigate to="/upload-cv" replace />;
  }
  
  // If has CV but no preferences, and trying to access past-apps or home, redirect to preferences
  if (hasCV && !hasPreferences && 
      (currentPath === '/past-applications' || currentPath === '/home' || currentPath === '/dashboard')) {
    return <Navigate to="/preferences" replace />;
  }
  
  // If has CV and preferences, allow access to everything
  return <>{children}</>;
}

// Post-Login Router - decides where to send user after login
function PostLoginRouter() {
  const { profile, jobPreferences, isLoading } = useApp();
  
  if (isLoading) return <LoadingScreen />;
  
  const hasCV = !!profile?.resumeFileName || !!profile?.resumeText;
  const hasPreferences = !!jobPreferences?.preferredRole;
  
  if (!hasCV) {
    return <Navigate to="/upload-cv" replace />;
  }
  
  if (!hasPreferences) {
    return <Navigate to="/preferences" replace />;
  }
  
  // All onboarding complete - go to home
  return <Navigate to="/home" replace />;
}

function AppRoutes() {
  const { isAuthenticated, profile, jobPreferences, isLoading } = useApp();
  
  if (isLoading) return <LoadingScreen />;
  
  // Check onboarding status
  const hasCV = !!profile?.resumeFileName || !!profile?.resumeText;
  const hasPreferences = !!jobPreferences?.preferredRole;
  const onboardingComplete = hasCV && hasPreferences;

  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/login" element={
        isAuthenticated 
          ? (onboardingComplete ? <Navigate to="/home" replace /> : <PostLoginRouter />)
          : <LoginPage />
      } />
      
      <Route path="/signup" element={
        isAuthenticated 
          ? (onboardingComplete ? <Navigate to="/home" replace /> : <PostLoginRouter />)
          : <SignupPage />
      } />
  
      {/* ONBOARDING ROUTES - Strict workflow */}
      
      {/* Step 1: CV Upload (can skip) */}
      <Route 
        path="/upload-cv" 
        element={
          <AuthGuard>
            <CVUploadPage />
          </AuthGuard>
        } 
      />
      
      {/* Step 2: Preferences (MUST complete) */}
      <Route 
        path="/preferences" 
        element={
          <OnboardingGuard>
            <JobPreferencesPage />
          </OnboardingGuard>
        } 
      />

      {/* Step 3: Past Applications (optional, can skip) */}
      <Route 
        path="/past-applications" 
        element={
          <OnboardingGuard>
            <PastApplicationsPage />
          </OnboardingGuard>
        } 
      />
      
      {/* Alternative past applications route */}
      <Route
        path="/job-history"
        element={
          <OnboardingGuard>
            <JobApplicationHistoryPage />
          </OnboardingGuard>
        }
      />
      
      {/* MAIN APP ROUTES - Only accessible after full onboarding */}
      
      <Route 
        path="/home" 
        element={
          <OnboardingGuard>
            <HomePage />
          </OnboardingGuard>
        } 
      />
      
      <Route 
        path="/dashboard" 
        element={
          <OnboardingGuard>
            <DashboardPage />
          </OnboardingGuard>
        } 
      />
      
      <Route 
        path="/assistance" 
        element={
          <OnboardingGuard>
            <AssistancePage />
          </OnboardingGuard>
        } 
      />
      
      <Route 
        path="/profile" 
        element={
          <OnboardingGuard>
            <ProfilePage />
          </OnboardingGuard>
        } 
      />
      
      {/* Default redirects */}
      <Route path="/" element={
        isAuthenticated 
          ? (onboardingComplete ? <Navigate to="/home" replace /> : <PostLoginRouter />)
          : <Navigate to="/login" replace />
      } />
      
      <Route path="*" element={
        isAuthenticated 
          ? (onboardingComplete ? <Navigate to="/home" replace /> : <PostLoginRouter />)
          : <Navigate to="/login" replace />
      } />
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