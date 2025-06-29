import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/home");
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", form);
      const { token, user } = res.data;

      // ✅ Save full user info to localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      console.log("✅ Login successful. User stored:", user);

      setMessage("✅ Login successful!");
      setTimeout(() => navigate("/home"), 800);
    } catch (err) {
      setMessage(err.response?.data?.msg || "❌ Login failed.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-blue-700">Welcome Back!</h2>
            <p className="text-sm text-gray-600">Login to your DevMeet account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition duration-200"
            >
              Log In
            </button>

            {message && (
              <p className="text-center text-sm mt-2 text-red-600">{message}</p>
            )}
          </form>
        </div>
      </div>
    </>
  );
};

export default Login;
