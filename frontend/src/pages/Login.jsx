import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      setMessage("✅ Login successful!");
      setTimeout(() => navigate("/home"), 800);
    } catch (err) {
      setMessage(err.response?.data?.msg || "❌ Login failed.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-blue-50 to-white flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 md:p-10 space-y-6 border border-gray-100">
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-extrabold text-blue-800">Welcome Back 👋</h2>
            <p className="text-gray-500">Login to your <span className="font-semibold text-blue-700">DevLinkr</span> account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                required
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1 relative">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition pr-12"
                required
                placeholder="Your secure password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 focus:outline-none"
              >
                {showPassword ? (
  <EyeSlashIcon className="h-5 w-5" />
) : (
  <EyeIcon className="h-5 w-5" />
)}

              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-2.5 rounded-lg shadow-md transition transform hover:-translate-y-0.5"
            >
              Log In
            </button>

            {message && (
              <p className={`text-center text-sm mt-2 ${message.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>
                {message}
              </p>
            )}
          </form>
        </div>
      </div>
    </>
  );
};

export default Login;
