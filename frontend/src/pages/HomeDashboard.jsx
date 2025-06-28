import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";

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
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-100 min-h-screen py-10 px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h1 className="text-4xl font-bold text-blue-700 mb-2">
            👋 {greeting}, {user?.name || "Developer"}!
          </h1>
          <p className="text-gray-600 text-lg">
            Welcome to <strong>DevMeet</strong> — your personal developer connection space 🚀
          </p>
        </motion.div>

        {/* Section 1: What is DevMeet */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="mt-12 max-w-5xl mx-auto bg-white shadow-md rounded-xl p-8"
        >
          <h2 className="text-2xl font-bold text-indigo-700 mb-4">✨ What is DevMeet?</h2>
          <p className="text-gray-700 leading-relaxed">
            DevMeet is a platform where developers — students and professionals — come together to
            collaborate, learn, and grow. Whether you're prepping for interviews, exploring new
            technologies, or looking for a project partner, DevMeet helps you find and connect with
            like-minded people.
          </p>
        </motion.div>

        {/* Section 2: Why Use DevMeet */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="mt-12 max-w-5xl mx-auto bg-white shadow-md rounded-xl p-8"
        >
          <h2 className="text-2xl font-bold text-green-700 mb-4">🌟 Why Use DevMeet?</h2>
          <ul className="list-disc list-inside text-gray-700 leading-loose">
            <li>🤝 Match with devs based on skills and interests</li>
            <li>💬 Chat with your connections in real time</li>
            <li>🧑‍💻 Pair program inside the chat interface</li>
            <li>📨 Send and accept connection requests</li>
            <li>🔔 Stay informed with smart notifications</li>
            <li>📝 Create your unique dev profile</li>
            <li>🧭 Easy to use, modern, and clean interface</li>
          </ul>
        </motion.div>

        {/* Section 3: Dev Impact */}
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-12 max-w-5xl mx-auto bg-white shadow-md rounded-xl p-8"
        >
          <h2 className="text-2xl font-bold text-purple-700 mb-4">🚀 The Impact</h2>
          <p className="text-gray-700 leading-relaxed">
            DevMeet is not just a platform — it's a community. It brings together curious learners,
            experienced developers, and passionate coders to form a vibrant tech ecosystem.
            Developers have used DevMeet to collaborate on open-source, prepare for interviews, and
            even launch startups together!
          </p>
        </motion.div>

        {/* Final Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 max-w-xl mx-auto text-center"
        >
          <p className="text-lg text-gray-600">
            🌐 <strong>Ready to build. Ready to grow. Ready to connect.</strong> <br />
            That's DevMeet.
          </p>
        </motion.div>
      </div>
    </>
  );
};

export default HomeDashboard;
