import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { motion } from "framer-motion";

const UserMatch = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const [match, setMatch] = useState(null);
  const [status, setStatus] = useState("");

  const fetchMatch = async () => {
    setStatus("🔄 Finding...");
    try {
      const res = await axios.get(
        `http://localhost:5000/api/auth/match?email=${user.email}`
      );
      setMatch(res.data);
      setStatus("");
    } catch (err) {
      console.error("Match error:", err);
      setMatch(null);
      setStatus("❌ No match found");
    }
  };

  const handleConnect = async () => {
    try {
      await axios.post("http://localhost:5000/api/auth/connect-request", {
        from: user.email,
        to: match.email,
      });
      setStatus("✅ Request sent!");
    } catch (err) {
      console.error("Connect error:", err);
      setStatus("❌ Failed to send request");
    }
  };

  useEffect(() => {
    fetchMatch();

    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") fetchMatch();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gradient-to-r from-indigo-100 to-purple-100 flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-white p-8 rounded-2xl shadow-2xl max-w-2xl w-full"
        >
          <h2 className="text-3xl font-extrabold text-center mb-6 text-indigo-700">
            🔍 DevMeet: Find Your Match
          </h2>

          {status && (
            <p className="text-center text-gray-600 font-medium mb-4">{status}</p>
          )}

          {match && (
            <div className="flex flex-col items-center gap-4 text-center">
              <img
                src={`http://localhost:5000${match.profilePic}`}
                alt="Profile"
                className="w-28 h-28 rounded-full shadow-lg object-cover border-4 border-indigo-200"
              />
              <h3 className="text-xl font-semibold">{match.name}</h3>
              <p className="text-gray-600 capitalize">
                <strong>Role:</strong> {match.role}
              </p>
              {match.role === "student" && match.college && (
                <p className="text-gray-600">
                  <strong>College:</strong> {match.college}
                </p>
              )}
              {match.role === "professional" && match.company && (
                <p className="text-gray-600">
                  <strong>Company:</strong> {match.company}
                </p>
              )}
              <p className="text-gray-600">
                <strong>Skills:</strong> {match.skills?.join(", ") || "N/A"}
              </p>
              <p className="text-gray-600">
                <strong>GitHub:</strong>{" "}
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

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleConnect}
                className="bg-green-600 text-white px-6 py-2 rounded-lg mt-4 hover:bg-green-700"
              >
                🤝 Connect
              </motion.button>
            </div>
          )}

          <div className="text-center mt-6">
            <button
              onClick={fetchMatch}
              className="text-indigo-600 text-sm hover:underline"
            >
              ⏭️ Skip to Next Dev (or press →)
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default UserMatch;
