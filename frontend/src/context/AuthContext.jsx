import { createContext, useContext, useState } from "react";

// 1. Create the context
const AuthContext = createContext(null);

// 2. Provider component — wraps the entire app in main.jsx
export const AuthProvider = ({ children }) => {
  // Initialize state from localStorage so refresh doesn't log you out
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem("token"));

  // Called after login or signup — updates both state AND localStorage
  const login = (newToken, newUser) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  // Called on logout — wipes everything
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("refreshToken");
    setToken(null);
    setUser(null);
  };

  // Called by the axios interceptor when a new access token is received
  const updateToken = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateToken }}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Custom hook — components call useAuth() instead of useContext(AuthContext)
export const useAuth = () => useContext(AuthContext);
