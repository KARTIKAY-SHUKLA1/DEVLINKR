import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

const Notifications = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const [requests, setRequests] = useState([]);
  const [connections, setConnections] = useState([]);
  const [soundPlayed, setSoundPlayed] = useState(false);

  const fetchNotifications = async () => {
  try {
    const res = await axios.get(`http://localhost:5000/api/auth/notifications?email=${user.email}`);
    const reqs = res.data.requests || [];
    const cons = res.data.connections || [];

    setRequests(reqs);
    setConnections(cons);

    // ✅ Save new request count to localStorage
    localStorage.setItem("newNotifCount", reqs.length.toString());
  } catch (err) {
    console.error("Notification fetch error:", err);
  }
};


  const handleAccept = async (fromEmail) => {
    try {
      await axios.post("http://localhost:5000/api/auth/accept-request", {
        from: fromEmail,
        to: user.email,
      });
      fetchNotifications();
    } catch (err) {
      console.error("Accept error:", err);
    }
  };

  useEffect(() => {
  fetchNotifications();

  // ✅ Clear notif count in localStorage when viewing
  localStorage.setItem("newNotifCount", "0");
}, []);


  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 py-10 px-4">
        <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-xl p-8">
          <h2 className="text-2xl font-bold text-indigo-700 mb-6">🔔 Notifications</h2>

          {/* Incoming Requests */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Incoming Connection Requests:</h3>
            {requests.length === 0 ? (
              <p className="text-gray-500">No new requests</p>
            ) : (
              requests.map((req) => (
                <div key={req.email} className="flex items-center justify-between bg-indigo-50 p-3 rounded-lg mb-2">
                  <Link
                    to={`/profile/${req.email}`}
                    className="text-blue-700 font-medium underline hover:text-blue-900"
                  >
                    {req.name}
                  </Link>
                  <button
                    onClick={() => handleAccept(req.email)}
                    className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
                  >
                    ✅ Accept
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Connections */}
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Your Connections:</h3>
            {connections.length === 0 ? (
              <p className="text-gray-500">You have no connections yet</p>
            ) : (
              <ul className="space-y-1">
                {connections.map((conn) => (
                  <li key={conn.email} className="text-gray-700 bg-gray-100 px-4 py-2 rounded">
                    <Link
                      to={`/profile/${conn.email}`}
                      className="text-blue-700 font-medium underline hover:text-blue-900"
                    >
                      {conn.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Notifications;
