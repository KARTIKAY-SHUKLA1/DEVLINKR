import { useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

const Notifications = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const [notifications, setNotifications] = useState([]);
  const [connections, setConnections] = useState([]);

  const fetchNotifications = async () => {
    try {
      const res = await axiosInstance.get(`/api/auth/notifications?email=${user.email}`);
      const notifs = res.data?.notifications || [];
      const cons = res.data?.connections || [];

      setNotifications(notifs);
      setConnections(cons);

      const newReqCount = notifs.filter((n) => n.type === "request").length;
      localStorage.setItem("newNotifCount", newReqCount.toString());
    } catch (err) {
      console.error("Notification fetch error:", err);
    }
  };

  const handleAccept = async (fromEmail) => {
    try {
      await axiosInstance.post("/api/auth/accept-request", {
        from: fromEmail,
        to: user.email,
      });
      fetchNotifications();
    } catch (err) {
      console.error("Accept error:", err);
    }
  };

  const handleDismiss = (email, type) => {
    setNotifications((prev) => prev.filter((n) => !(n.from === email && n.type === type)));
    // Optional: send a dismiss update to backend
  };

  useEffect(() => {
    fetchNotifications();
    localStorage.setItem("newNotifCount", "0");
  }, []);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-10 px-4">
        <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl p-6 md:p-10">
          <h2 className="text-2xl md:text-3xl font-bold text-indigo-700 mb-6 flex items-center gap-2">
            🔔 DevLinkr Notifications
          </h2>

          <div className="mb-10">
            <h3 className="text-lg md:text-xl font-semibold mb-4 text-gray-800">
              Connection Notifications
            </h3>
            {notifications.length === 0 ? (
              <div className="text-gray-500 italic">✨ No new notifications at the moment</div>
            ) : (
              <div className="space-y-4">
                {notifications.map((n) => (
                  <div
                    key={n.from + n.type}
                    className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-xl p-4 shadow-sm hover:shadow-md transition"
                  >
                    <Link to={`/profile/${n.from}`} className="flex items-center gap-3">
                      <img
                        src={n.profilePic && n.profilePic.trim() !== "" ? n.profilePic : "/dp.png"}
                        alt={n.name}
                        className="w-10 h-10 rounded-full object-cover border border-indigo-200"
                      />
                      <div className="flex flex-col">
                        <span className="text-indigo-800 font-medium hover:underline">{n.name}</span>
                        <span className="text-sm text-gray-500">
                          {n.type === "request"
                            ? "sent you a connection request"
                            : "accepted your connection request 🎉"}
                        </span>
                      </div>
                    </Link>

                    <div className="flex items-center gap-2">
                      {n.type === "request" && (
                        <button
                          onClick={() => handleAccept(n.from)}
                          className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition text-sm"
                        >
                          ✅ Accept
                        </button>
                      )}
                      <button
                        onClick={() => handleDismiss(n.from, n.type)}
                        className="text-red-600 text-xl font-bold hover:text-red-800"
                        title="Dismiss"
                      >
                        ❌
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg md:text-xl font-semibold mb-4 text-gray-800">
              Your DevLinkr Connections
            </h3>
            {connections.length === 0 ? (
              <div className="text-gray-500 italic">You have no connections yet. Start connecting!</div>
            ) : (
              <div className="space-y-3">
                {connections.map((conn) => (
                  <Link
                    to={`/profile/${conn.email}`}
                    key={conn.email}
                    className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 p-3 rounded-xl shadow-sm transition"
                  >
                    <img
                      src={conn.profilePic && conn.profilePic.trim() !== "" ? conn.profilePic : "/dp.png"}
                      alt={conn.name}
                      className="w-9 h-9 rounded-full object-cover border"
                    />
                    <span className="text-gray-800 font-medium">{conn.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Notifications;
