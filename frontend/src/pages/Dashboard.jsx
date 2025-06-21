import Navbar from "../components/Navbar";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Dashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  // Redirect to login if no token
  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [navigate, token]);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/auth/users");
        setUsers(res.data);
      } catch (err) {
        console.error("Failed to fetch users", err);
      }
    };

    fetchUsers();
  }, []);

  // Logout
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // Find a match (excluding self)
  const findMatch = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/auth/match", {
        params: { email: user.email },
      });
      setMatch(res.data);
    } catch (err) {
      alert(err.response?.data?.msg || "Match failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 py-10 px-4">
        <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow">
          <h1 className="text-3xl font-bold mb-4 text-center">👋 Welcome, {user?.name}</h1>
          <p className="text-center mb-6">Email: {user?.email}</p>

          <button
            onClick={handleLogout}
            className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 mb-4"
          >
            Logout
          </button>

          <button
            onClick={findMatch}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 mb-6"
          >
            {loading ? "Finding Match..." : "Find Match 🎯"}
          </button>

          {match && (
            <div className="p-4 border rounded bg-green-50 mb-6 text-center">
              <h3 className="font-bold text-lg mb-1">Your Match</h3>
              <p className="text-gray-800">{match.name} — {match.email}</p>
            </div>
          )}

          <h2 className="text-xl font-semibold mb-4">All Developers on DevMeet:</h2>
          <ul className="space-y-3">
            {users.map((u, idx) => (
              <li key={idx} className="border p-3 rounded bg-gray-50">
                <strong>{u.name}</strong> — {u.email}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
