// src/pages/About.jsx
import React from "react";
import { motion } from "framer-motion";

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-4xl font-bold mb-6 text-center">About DevMeet 🚀</h1>

        <p className="text-lg mb-6 leading-relaxed text-gray-300">
          <span className="text-white font-semibold">DevMeet</span> is a platform built to help developers <span className="text-green-400">connect, collaborate, and grow together</span>. Whether you're a student looking for guidance or a professional seeking like-minded peers, DevMeet makes it easy to match based on shared skills, interests, and goals.
        </p>

        <div className="space-y-4 text-gray-300">
          <div>
            <h2 className="text-2xl font-semibold text-white mb-2">✨ Key Features</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Role-based signup (Student / Professional)</li>
              <li>OTP-based authentication with email verification</li>
              <li>Profile setup with photo, skills, and GitHub</li>
              <li>“Let’s Connect” for matching with devs by interests</li>
              <li>Connection requests and notifications system</li>
              <li>Dev Chat (coming soon!) for messaging</li>
              <li>Profile editing and customization</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mt-6 mb-2">👨‍💻 Built By</h2>
            <p className="text-white font-medium">
              Kartikay Shukla — B.Tech ECE @ IIIT Kota
            </p>
            <p>
              Passionate Full Stack Developer (MERN) & DSA Enthusiast 🚀
            </p>
            <p>
              <a
                href="https://github.com/kartikayshukla" // change if needed
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                GitHub Profile
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default About;
