import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import { FaHandshake, FaComments, FaLaptopCode, FaBell, FaUserPlus, FaRocket, FaUsers, FaHeart, FaLightbulb } from "react-icons/fa";

const HomeDashboard = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  return (
    <>
      <Navbar />
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-100 min-h-screen py-10 px-4">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-blue-700 mb-3">
            👋 {greeting}, {user?.name || "Developer"}!
          </h1>
          <p className="text-gray-600 text-lg md:text-xl">
            Welcome to <strong>DevLinkr</strong> — your personal developer connection space 🚀
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto grid gap-6 md:grid-cols-3 mb-16"
        >
          {[
            {
              icon: <FaHandshake className="text-indigo-600 text-4xl mb-3" />,
              title: "Connect with Devs",
              desc: "Match with developers based on shared skills and interests.",
            },
            {
              icon: <FaComments className="text-green-600 text-4xl mb-3" />,
              title: "Real-time Chat",
              desc: "Chat and pair program seamlessly inside the app.",
            },
            {
              icon: <FaLaptopCode className="text-purple-600 text-4xl mb-3" />,
              title: "Build Projects",
              desc: "Collaborate on projects, share ideas, and grow together.",
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition"
            >
              {feature.icon}
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* What is DevLinkr */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto bg-white shadow-md rounded-xl p-8 mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-indigo-700 mb-4">✨ What is DevLinkr?</h2>
          <p className="text-gray-700 leading-relaxed">
            DevLinkr is a platform where developers — students and professionals — come together to
            collaborate, learn, and grow. Whether you're prepping for interviews, exploring new
            technologies, or looking for a project partner, DevLinkr helps you find and connect with
            like-minded people.
          </p>
        </motion.div>

        {/* Why Use DevLinkr */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto bg-white shadow-md rounded-xl p-8 mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-green-700 mb-4">🌟 Why Use DevLinkr?</h2>
          <ul className="grid gap-4 md:grid-cols-2 text-gray-700 leading-relaxed list-none">
            <li className="flex items-start gap-3"><FaUserPlus className="text-indigo-500 mt-1" /> 🤝 Match with devs based on skills and interests</li>
            <li className="flex items-start gap-3"><FaComments className="text-green-500 mt-1" /> 💬 Chat with your connections in real time</li>
            <li className="flex items-start gap-3"><FaLaptopCode className="text-purple-500 mt-1" /> 🧑‍💻 Pair program in the chat interface</li>
            <li className="flex items-start gap-3"><FaBell className="text-yellow-500 mt-1" /> 🔔 Stay informed with smart notifications</li>
            <li className="flex items-start gap-3"><FaRocket className="text-pink-500 mt-1" /> 🚀 Grow your developer network effortlessly</li>
            <li className="flex items-start gap-3"><FaLightbulb className="text-orange-500 mt-1" /> 💡 Learn and share new tech ideas</li>
          </ul>
        </motion.div>

        {/* Community Impact */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto bg-white shadow-md rounded-xl p-8 mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-purple-700 mb-4">🚀 The Community Impact</h2>
          <p className="text-gray-700 leading-relaxed">
            DevLinkr is not just a platform — it's a community. We bring together curious learners,
            experienced developers, and passionate coders to form a vibrant tech ecosystem. Devs have
            used DevLinkr to collaborate on open-source, prepare for interviews, and even launch
            startups together!
          </p>
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto text-center mb-16"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-pink-600 mb-6">💬 What Developers Say</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                text: "DevLinkr helped me find the perfect partner for my project. It's so easy to use!",
                name: "Aarav S.",
              },
              {
                text: "The chat and pair programming features are game changers for remote teams.",
                name: "Priya K.",
              },
              {
                text: "I love how I can connect with like-minded devs and share ideas instantly.",
                name: "Rahul M.",
              },
            ].map((t, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
                <FaHeart className="text-red-500 text-3xl mb-3 mx-auto" />
                <p className="text-gray-700 mb-3 italic">"{t.text}"</p>
                <p className="text-sm font-semibold text-gray-800">— {t.name}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-xl mx-auto text-center bg-white shadow-lg rounded-xl p-8"
        >
          <h3 className="text-xl md:text-2xl font-bold text-blue-700 mb-4">🌐 Ready to connect and grow?</h3>
          <p className="text-gray-700 mb-6">Start discovering developers, chatting in real time, and collaborating on projects today with DevLinkr.</p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
          >
            Let’s Get Started
          </button>
        </motion.div>
      </div>
    </>
  );
};

export default HomeDashboard;
