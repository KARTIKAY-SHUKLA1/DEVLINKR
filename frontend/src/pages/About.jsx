import React from "react";
import { motion } from "framer-motion";

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 md:p-12">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-5xl mx-auto space-y-12"
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-green-400">
            About DevLinkr 🚀
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
            <span className="text-white font-semibold">DevLinkr</span> is the bridge between developers who want to{" "}
            <span className="text-green-400">learn, build, and grow</span> together. We make it easy to find collaborators, mentors, and peers—no matter your level.
          </p>
        </div>

        {/* Our Mission */}
        <div className="bg-slate-800 rounded-2xl p-6 md:p-10 shadow-lg space-y-4">
          <h2 className="text-3xl font-semibold text-white mb-4">🎯 Our Mission</h2>
          <p className="text-gray-300 text-lg">
            At <span className="text-green-400 font-semibold">DevLinkr</span>, we believe that great software is built together. Our mission is to foster a collaborative developer community where <span className="text-green-300">students and professionals</span> alike can share knowledge, solve problems, and build impactful projects.
          </p>
        </div>

        {/* How it Works */}
        <div className="space-y-6">
          <h2 className="text-3xl font-semibold text-white">🛠️ How It Works</h2>
          <ol className="list-decimal pl-6 space-y-2 text-gray-300 text-lg">
            <li>Sign up with role-based paths (Student / Professional).</li>
            <li>Verify your email with secure OTP authentication.</li>
            <li>Create a detailed profile with skills, interests, and photo.</li>
            <li>Browse or search for matching developers by interest.</li>
            <li>Send connection requests and manage your network.</li>
            <li>Chat, collaborate, and even pair program in real-time!</li>
          </ol>
        </div>

        {/* Features */}
        <div className="bg-slate-800 rounded-2xl p-6 md:p-10 shadow-lg">
          <h2 className="text-3xl font-semibold text-white mb-4">✨ Key Features</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-300 text-lg">
            <li>OTP-based signup and email verification</li>
            <li>Role selection (Student or Professional) for personalized onboarding</li>
            <li>Profile setup with photo, skills, interests, and GitHub link</li>
            <li>Smart matching and connection request system</li>
            <li>Dev Chat for real-time conversations</li>
            <li>Pair Programming support with custom rooms</li>
            <li>Clean, responsive, modern UI</li>
          </ul>
        </div>

        {/* Creator Bio */}
        <div className="flex flex-col md:flex-row items-center gap-8 bg-slate-800 rounded-2xl p-6 md:p-10 shadow-lg">
          <img
            src="/default-profile.png"
            alt="Kartikay Shukla"
            className="w-32 h-32 rounded-full object-cover border-4 border-green-400 shadow-lg"
          />
          <div className="text-center md:text-left space-y-3">
            <h2 className="text-3xl font-semibold text-white">👨‍💻 Built By Kartikay Shukla</h2>
            <p className="text-gray-300 text-lg">
              B.Tech ECE @ IIIT Kota • Passionate Full Stack Developer (MERN) • DSA Enthusiast
            </p>
            <p className="text-gray-300">
              I built <span className="text-green-400 font-semibold">DevLinkr</span> to make it easier for developers to find collaborators, learn from each other, and grow their skills in a supportive community.
            </p>
            <p className="text-gray-300 mt-2">
              📧 Email: <a href="mailto:kartikayshukla4141@gmail.com" className="text-blue-400 hover:underline">kartikayshukla4141@gmail.com</a><br />
              📞 Phone: <a href="tel:+919336166298" className="text-blue-400 hover:underline">9336166298</a>
            </p>
            <a
              href="https://github.com/KARTIKAY-SHUKLA1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-blue-400 hover:underline text-lg"
            >
              🔗 My GitHub Profile
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default About;
