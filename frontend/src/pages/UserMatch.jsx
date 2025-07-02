import { useEffect, useState, useRef } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { motion } from "framer-motion";
import {
  FaUserTie,
  FaUniversity,
  FaCode,
  FaGithub,
  FaRocket,
  FaUsers
} from "react-icons/fa";

const UserMatch = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const [match, setMatch] = useState(null);
  const [status, setStatus] = useState("");
  const isFetching = useRef(false);

  const BASE_URL = import.meta.env.VITE_BACKEND_URL;

  const fetchMatch = async () => {
    if (isFetching.current) return;
    isFetching.current = true;

    setStatus("🔄 Searching for your next DevMatch...");
    try {
      const res = await axios.get(`${BASE_URL}/api/auth/match`, {
        params: { email: user.email },
      });
      setMatch(res.data);
      setStatus("");
    } catch (err) {
      console.error("❌ Match error:", err);
      setMatch(null);
      setStatus("❌ No match found. Please try again.");
    } finally {
      isFetching.current = false;
    }
  };

  const handleConnect = async () => {
    if (!match?.email) return;
    try {
      await axios.post(`${BASE_URL}/api/auth/connect-request`, {
        from: user.email,
        to: match.email,
      });
      setStatus("✅ Connection request sent!");
    } catch (err) {
      console.error("❌ Connect error:", err);
      setStatus("❌ Failed to send request. Try again.");
    }
  };

  useEffect(() => {
    fetchMatch();
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") fetchMatch();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-100 to-white flex flex-col items-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-indigo-700 mb-3">
            🔍 DevMeet: Find Your Match
          </h1>
          <p className="text-gray-600 text-lg md:text-xl">
            Discover developers who share your interests. Connect. Collaborate. Build.
          </p>
        </motion.div>

        {status && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`mb-6 px-6 py-3 rounded-lg shadow ${
              status.includes("✅") ? "bg-green-100 text-green-700" :
              status.includes("❌") ? "bg-red-100 text-red-700" :
              "bg-yellow-50 text-yellow-800"
            }`}
          >
            {status}
          </motion.div>
        )}

        {match && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 text-center"
          >
            <div className="absolute -top-5 right-5 text-sm text-indigo-400">
              Press → to skip
            </div>
            <img
              src={match?.profilePic || "/default-profile.png"}
              alt="Profile"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/default-profile.png";
              }}
              className="w-28 h-28 rounded-full shadow-lg object-cover border-4 border-indigo-200 mx-auto mb-4"
            />
            <h2 className="text-2xl font-bold text-indigo-700 mb-2">{match.name}</h2>
            <div className="text-gray-700 space-y-2 mb-4">
              <p className="flex items-center justify-center gap-2">
                <FaUserTie className="text-indigo-500" /> <strong>Role:</strong> {match.role}
              </p>

              {match.role === "student" && (
                <p className="flex items-center justify-center gap-2">
                  <FaUniversity className="text-green-500" /> <strong>College:</strong> {match.college || "N/A"}
                </p>
              )}
              {match.role === "professional" && (
                <p className="flex items-center justify-center gap-2">
                  <FaUsers className="text-purple-500" /> <strong>Company:</strong> {match.company || "N/A"}
                </p>
              )}

              {match.experience && (
                <p>
                  <strong>Experience:</strong> {match.experience}
                </p>
              )}

              <p className="flex items-center justify-center gap-2">
                <FaCode className="text-pink-500" /> <strong>Skills:</strong> {match.skills?.join(", ") || "N/A"}
              </p>

              <p className="flex items-center justify-center gap-2">
                <FaGithub className="text-gray-800" /> <strong>GitHub:</strong>{" "}
                {match.github ? (
                  <a
                    href={match.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    {match.github}
                  </a>
                ) : (
                  "N/A"
                )}
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleConnect}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition mb-2"
            >
              🤝 Send Connect Request
            </motion.button>

            <div className="mt-3">
              <button
                onClick={fetchMatch}
                className="text-indigo-600 text-sm hover:underline"
              >
                ⏭️ Skip to Next Dev (or press →)
              </button>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-3xl mt-16 bg-white p-8 rounded-xl shadow-lg text-center"
        >
          <h3 className="text-2xl font-bold text-purple-700 mb-4">✨ How DevMeet Works</h3>
          <p className="text-gray-700 mb-6">
            We match you with developers who share your interests and goals. Browse, connect, and start building your next project together.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-gray-600">
            <div className="w-40 p-4 bg-indigo-50 rounded-lg shadow hover:shadow-md transition">
              🔍 Find
              <p className="text-sm mt-1">Discover new developers</p>
            </div>
            <div className="w-40 p-4 bg-green-50 rounded-lg shadow hover:shadow-md transition">
              🤝 Connect
              <p className="text-sm mt-1">Send and accept requests</p>
            </div>
            <div className="w-40 p-4 bg-purple-50 rounded-lg shadow hover:shadow-md transition">
              💬 Collaborate
              <p className="text-sm mt-1">Chat and build projects</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 max-w-xl mx-auto text-center bg-white shadow-lg rounded-xl p-8"
        >
          <h3 className="text-xl md:text-2xl font-bold text-blue-700 mb-4">🚀 Ready to expand your network?</h3>
          <p className="text-gray-700 mb-6">
            Keep discovering new developers and grow your connections with DevLinkr.
          </p>
          <button
            onClick={fetchMatch}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition"
          >
            🔄 Find Another Match
          </button>
        </motion.div>
      </div>
    </>
  );
};

export default UserMatch;
