import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import PublicProfilePage from './pages/PublicProfilePage';
import UploadVideoPage from './pages/UploadVideoPage';
import MyVideosPage from './pages/MyVideosPage';
import VideoDetailsPage from './pages/VideoDetailsPage';
import EditVideoPage from './pages/EditVideoPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <Navbar />
          <main>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/u/:username" element={<PublicProfilePage />} />
              <Route path="/v/:id" element={<VideoDetailsPage />} />

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
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
