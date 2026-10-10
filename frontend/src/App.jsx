import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy-loaded pages for optimal bundle splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const EditProfilePage = lazy(() => import('./pages/EditProfilePage'));
const PublicProfilePage = lazy(() => import('./pages/PublicProfilePage'));
const UploadVideoPage = lazy(() => import('./pages/UploadVideoPage'));
const MyVideosPage = lazy(() => import('./pages/MyVideosPage'));
const SavedVideosPage = lazy(() => import('./pages/SavedVideosPage'));
const VideoDetailsPage = lazy(() => import('./pages/VideoDetailsPage'));
const EditVideoPage = lazy(() => import('./pages/EditVideoPage'));
const DiscoverPage = lazy(() => import('./pages/DiscoverPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Sleek fallback component during route chunk loading
const PageLoader = () => (
  <div className="page-suspense-loader" aria-live="polite" aria-busy="true">
    <div className="suspense-spinner" />
    <span className="suspense-text">Loading showcase...</span>
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <Navbar />
          <main>
            <Suspense fallback={<PageLoader />}>
              <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/discover" element={<DiscoverPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/u/:username" element={<PublicProfilePage />} />
              <Route path="/v/:id" element={<VideoDetailsPage />} />

              {/* Protected Notification & Activity Routes */}
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <NotificationsPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Phase 8 Creator Analytics Route */}
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <AnalyticsPage />
                  </ProtectedRoute>
                }
              />



              {/* Protected User & Video Management Routes */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/edit"
                element={
                  <ProtectedRoute>
                    <EditProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/upload"
                element={
                  <ProtectedRoute>
                    <UploadVideoPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-videos"
                element={
                  <ProtectedRoute>
                    <MyVideosPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/saved-videos"
                element={
                  <ProtectedRoute>
                    <SavedVideosPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/v/:id/edit"
                element={
                  <ProtectedRoute>
                    <EditVideoPage />
                  </ProtectedRoute>
                }
              />

              {/* 404 Catch-All */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
