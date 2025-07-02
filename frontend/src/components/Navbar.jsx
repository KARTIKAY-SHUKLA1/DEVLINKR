import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import api from "../api";
import notifSound from "../assets/de9b387f-3cba-4a1c-b66c-44974a312ac4.mp3";
import io from "socket.io-client";

// ✅ Set up socket connection
const socket = io(import.meta.env.VITE_API_BASE_URL, {
  transports: ["websocket"],
  withCredentials: true,
});

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isLoggedIn = !!localStorage.getItem("token");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [newMessageCount, setNewMessageCount] = useState(0);

  const audio = useRef(new Audio(notifSound));

  const fetchNotificationCount = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.email) return;

    try {
      const res = await api.get(`/api/auth/notifications?email=${user.email}`);
      const newReqCount = res.data?.requests?.length || 0;

      const prevCount = Number(localStorage.getItem("newNotifCount") || 0);

      if (newReqCount !== prevCount) {
        setNotifCount(newReqCount);
        localStorage.setItem("newNotifCount", newReqCount.toString());

        if (newReqCount > prevCount) {
          audio.current.play().catch(err => console.error("Audio play failed:", err));
        }
      }
    } catch (err) {
      console.error("Notification fetch error:", err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  useEffect(() => {
    const stored = localStorage.getItem("newNotifCount");
    if (stored) setNotifCount(Number(stored));

    const interval = setInterval(fetchNotificationCount, 10000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Handle incoming messages via socket
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    socket.emit("register", user.email);

    socket.on("newMessage", (msg) => {
      // If you're not on /chat, increment badge and play sound
      if (!location.pathname.startsWith("/chat")) {
        setNewMessageCount(prev => prev + 1);
        audio.current.play().catch(() => {});
      }
    });

    return () => {
      socket.off("newMessage");
    };
  }, [location.pathname]);

  // ✅ Reset chat badge if on /chat
  useEffect(() => {
    if (location.pathname.startsWith("/chat")) {
      setNewMessageCount(0);
    }
  }, [location.pathname]);

  return (
    <nav className="bg-gray-900 text-white shadow-md px-6 py-3 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* 🔰 Logo */}
        <Link
          to="/"
          className="text-2xl font-bold text-blue-400 hover:text-blue-300"
        >
          DevLinkr
        </Link>

        {/* ✅ Desktop Navigation */}
        <div className="hidden md:flex space-x-6 items-center">
          {isLoggedIn ? (
            <>
              <Link to="/connect" className="hover:text-blue-400 transition">
                Let's Connect
              </Link>

              <Link to="/chat" className="relative hover:text-green-400 transition">
                Dev Chat
                {newMessageCount > 0 && (
                  <span className="absolute -top-2 -right-3 text-xs bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                    +{newMessageCount}
                  </span>
                )}
              </Link>

              <Link
                to="/notifications"
                className="relative hover:text-yellow-400 transition"
              >
                Notifications
                {notifCount > 0 && (
                  <span className="absolute -top-2 -right-3 text-xs bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                    +{notifCount}
                  </span>
                )}
              </Link>

              <Link to="/profile" className="hover:text-indigo-400 transition">
                Profile
              </Link>
              <Link to="/about" className="hover:text-pink-400 transition">
                About
              </Link>
              <button
                onClick={handleLogout}
                className="hover:text-red-400 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-blue-400 transition">
                Login
              </Link>
              <Link to="/signup" className="hover:text-blue-400 transition">
                Signup
              </Link>
            </>
          )}
        </div>

        {/* 📱 Mobile Menu Toggle */}
        <div className="md:hidden">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="focus:outline-none"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* 📱 Mobile Dropdown */}
      {menuOpen && (
        <div className="md:hidden mt-2 space-y-2 bg-gray-800 p-4 rounded-md shadow-lg">
          {isLoggedIn ? (
            <>
              <Link
                to="/connect"
                onClick={() => setMenuOpen(false)}
                className="block hover:text-blue-400"
              >
                Let's Connect
              </Link>
              <Link
                to="/chat"
                onClick={() => {
                  setMenuOpen(false);
                  setNewMessageCount(0);
                }}
                className="block relative hover:text-green-400"
              >
                Dev Chat
                {newMessageCount > 0 && (
                  <span className="absolute top-0 right-0 mt-0.5 mr-2 text-xs bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                    +{newMessageCount}
                  </span>
                )}
              </Link>
              <Link
                to="/notifications"
                onClick={() => setMenuOpen(false)}
                className="block hover:text-yellow-400 relative"
              >
                Notifications
                {notifCount > 0 && (
                  <span className="absolute top-0 right-0 mt-0.5 mr-2 text-xs bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                    +{notifCount}
                  </span>
                )}
              </Link>
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="block hover:text-indigo-400"
              >
                Profile
              </Link>
              <Link
                to="/about"
                onClick={() => setMenuOpen(false)}
                className="block hover:text-pink-400"
              >
                About
              </Link>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
                className="block w-full text-left hover:text-red-400"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="block hover:text-blue-400"
              >
                Login
              </Link>
              <Link
                to="/signup"
                onClick={() => setMenuOpen(false)}
                className="block hover:text-blue-400"
              >
                Signup
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
