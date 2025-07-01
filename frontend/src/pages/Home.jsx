import { Link } from "react-router-dom";
import { useState } from "react";

const Home = () => {
  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (i) => {
    setOpenFaq(openFaq === i ? null : i);
  };

  return (
    <div className="min-h-screen font-sans">

      {/* Header */}
      <header className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur shadow z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="DevLinkr Logo" className="h-10 w-10" />
            <h1 className="text-xl md:text-2xl font-extrabold text-blue-800">DevLinkr</h1>
          </div>
          <nav className="hidden md:flex space-x-6">
            <a href="#features" className="hover:text-blue-700 transition">Features</a>
            <a href="#how-it-works" className="hover:text-blue-700 transition">How It Works</a>
            <a href="#testimonials" className="hover:text-blue-700 transition">Testimonials</a>
            <a href="#faq" className="hover:text-blue-700 transition">FAQ</a>
            <a href="#contact" className="hover:text-blue-700 transition">Contact</a>
          </nav>
          <div className="flex space-x-3">
            <Link to="/login" className="px-4 py-2 rounded-full border border-blue-600 text-blue-600 hover:bg-blue-50 transition">Login</Link>
            <Link to="/signup" className="px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition">Get Started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative text-center pt-32 pb-24 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/30 to-transparent animate-pulse"></div>
        <div className="relative z-10 max-w-3xl mx-auto px-4">
          <h2 className="text-5xl md:text-6xl font-bold mb-4 leading-tight">Build Your Dev Network Like Never Before</h2>
          <p className="text-xl md:text-2xl mb-8">Connect with passionate developers through smart matching, real-time chats, and collaborative pair programming.</p>
          <div className="space-x-4">
            <Link to="/signup" className="bg-yellow-400 text-black px-6 py-3 font-semibold rounded-full shadow hover:scale-105 transition">Get Started Free</Link>
            <Link to="/login" className="bg-white text-blue-700 px-6 py-3 font-semibold rounded-full shadow hover:scale-105 transition">Login</Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-gray-50 px-6 md:px-20">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">✨ Key Features</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            { icon: "🔍", title: "Smart Matching", desc: "Find developers with shared skills and goals." },
            { icon: "💬", title: "Real-time Chat", desc: "Integrated messaging and code collaboration." },
            { icon: "📈", title: "Grow Together", desc: "Work on meaningful open-source projects." },
            { icon: "👨‍💻", title: "Pair Programming", desc: "Live coding sessions with your match." },
            { icon: "🌐", title: "Global Network", desc: "Meet developers from around the world." },
            { icon: "🧠", title: "Learn & Upskill", desc: "Explore new tech stacks with partners." },
          ].map((f, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow hover:shadow-xl transition text-center">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white px-6 md:px-20 border-t">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">🛠️ How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            { step: "1️⃣ Create Profile", desc: "Add your skills, interests, and availability to get matched." },
            { step: "2️⃣ Get Matched", desc: "We suggest connections based on shared interests." },
            { step: "3️⃣ Start Collaborating", desc: "Chat, share code, and build projects together in real-time." },
          ].map((s, i) => (
            <div key={i} className="bg-gray-50 p-6 rounded-lg shadow hover:shadow-lg transition">
              <h3 className="text-xl font-bold mb-2">{s.step}</h3>
              <p className="text-gray-700">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-gray-50 px-6 md:px-20">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">💬 What Developers Say</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <p className="text-lg italic mb-4">“DevLinkr helped me find my perfect coding partner. We’ve built 3 projects together!”</p>
            <span className="block font-semibold">— Alex, Full-Stack Developer</span>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <p className="text-lg italic mb-4">“Love the smart matching. Made it so easy to meet people who share my interests.”</p>
            <span className="block font-semibold">— Priya, Frontend Engineer</span>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-white px-6 md:px-20 border-t">
        <h2 className="text-4xl font-bold text-center mb-10 text-gray-800">❓ Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto space-y-4">
          {[
            { q: "Is DevLinkr free to use?", a: "Yes! We offer a free plan with full matching and chat features." },
            { q: "How do you match developers?", a: "We match based on shared skills, interests, and your profile." },
            { q: "Can I work on real projects?", a: "Absolutely. Connect, chat, and collaborate on anything you want." },
          ].map((item, i) => (
            <div key={i} className="border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleFaq(i)}
                className="w-full text-left px-6 py-4 bg-gray-50 hover:bg-gray-100 font-semibold flex justify-between items-center"
              >
                {item.q}
                <span>{openFaq === i ? "−" : "+"}</span>
              </button>
              {openFaq === i && (
                <div className="px-6 py-4 text-gray-700 bg-white">{item.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center">
        <h2 className="text-4xl font-bold mb-4">🚀 Ready to Find Your Coding Partner?</h2>
        <p className="text-xl mb-8">Join thousands of developers growing together on DevLinkr.</p>
        <Link to="/signup" className="bg-yellow-400 text-black px-8 py-4 font-semibold rounded-full shadow hover:scale-105 transition">
          Get Started Free
        </Link>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-gray-300 py-8 text-center">
        <p>Made with ❤️ by Kartikay Shukla | © {new Date().getFullYear()} DevLinkr</p>
        <div className="mt-4 space-x-4">
          <a href="#" className="hover:text-white">Privacy</a>
          <a href="#" className="hover:text-white">Terms</a>
          <a href="#" className="hover:text-white">Contact</a>
        </div>
      </footer>
    </div>
  );
};

export default Home;
