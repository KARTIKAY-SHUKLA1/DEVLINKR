import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Pages
import Home from './pages/Home.jsx';                    // Landing page
import SignupFlow from './pages/SignupFlow.jsx';        // Signup with OTP + Profile setup
import Login from './pages/Login.jsx';                  // Login
import Profile from './pages/Profile.jsx';              // View/Edit Profile
import UserMatch from './pages/UserMatch.jsx';          // Dev Matching Page
import HomeDashboard from './pages/HomeDashboard.jsx';  // Post-login Landing Page
import Notifications from './pages/Notifications.jsx';
import About from "./pages/About";
import ProfileView from "./pages/ProfileView"; // 👈 import it

// Auth
import PrivateRoute from './components/PrivateRoute.jsx';

// Styles
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* 🔓 Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<SignupFlow />} />
        <Route path="/login" element={<Login />} />
        <Route path="/about" element={<About />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile/:email" element={<ProfileView />} />

        {/* 🔐 Protected Routes */}
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <HomeDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/connect"  // ✅ Changed from /dashboard to /connect
          element={
            <PrivateRoute>
              <UserMatch />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
