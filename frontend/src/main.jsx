import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Pages
import Home from './pages/Home.jsx';
import SignupFlow from './pages/SignupFlow.jsx';
import Login from './pages/Login.jsx';
import Profile from './pages/Profile.jsx';
import UserMatch from './pages/UserMatch.jsx';
import HomeDashboard from './pages/HomeDashboard.jsx';
import Notifications from './pages/Notifications.jsx';
import About from "./pages/About.jsx";
import ProfileView from "./pages/ProfileView.jsx";
import DevChat from "./pages/DevChat.jsx";
import PairProgramming from "./pages/PairProgramming.jsx"; // ✅ NEW PAGE

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
        <Route path="/chat" element={<DevChat />} />

        {/* Pair Programming - 🔐 Protected */}
        <Route
          path="/pair"
          element={
            <PrivateRoute>
              <PairProgramming />
            </PrivateRoute>
          }
        />

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
          path="/connect"
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
