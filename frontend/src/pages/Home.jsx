import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white text-center font-sans">
      
      {/* Logo & Name Header */}
      <header className="flex items-center justify-center gap-3 py-4 bg-white shadow-md sticky top-0 z-10">
        {/* Replace with your actual logo */}
        <img src="/logo.png" alt="DevMeet Logo" className="h-12 w-12" />
        <h1 className="text-2xl md:text-3xl font-extrabold text-blue-800">DevMeet</h1>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-6 md:px-20 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-700 text-white">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
          Build Your Dev Network Like Never Before
        </h2>
        <p className="text-lg md:text-xl max-w-3xl mx-auto mb-8">
          DevMeet connects passionate developers through skill-based matching, real-time chats, and collaborative pair programming.
        </p>
        <div className="space-x-4">
          <Link to="/login" className="bg-white text-blue-700 px-6 py-3 font-semibold rounded shadow hover:scale-105 transition">
            Login
          </Link>
          <Link to="/signup" className="bg-yellow-400 text-black px-6 py-3 font-semibold rounded shadow hover:scale-105 transition">
            Signup
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 md:px-20 bg-gray-100">
        <h2 className="text-3xl font-bold mb-8 text-gray-800">✨ Key Features</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-xl transition">
            <h3 className="text-xl font-semibold mb-2">🔍 Smart Matching</h3>
            <p>Connect with developers who share your skills and goals. No more aimless networking.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-xl transition">
            <h3 className="text-xl font-semibold mb-2">💬 Dev Chat</h3>
            <p>Real-time messaging with integrated code collaboration and pair programming.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-xl transition">
            <h3 className="text-xl font-semibold mb-2">📈 Grow Together</h3>
            <p>Track your growth, share insights, and collaborate on impactful open-source projects.</p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-6 md:px-20 bg-white border-t">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">📚 Why DevMeet?</h2>
        <p className="max-w-4xl mx-auto text-gray-700 text-lg leading-relaxed">
          DevMeet is a tech-first platform built for developers who want to learn, connect, and build — together.
          Whether you're a student looking to join your first team project or a professional eager to mentor or
          collaborate on exciting side projects, DevMeet has something for you. Our intelligent matching system,
          paired with intuitive chat and profile tools, makes finding your ideal dev partner easier than ever.
        </p>
      </section>

      {/* Footer */}
      <footer className="bg-blue-800 text-white py-6 mt-10">
        <p>Made with ❤️ by Kartikay Shukla | © {new Date().getFullYear()} DevMeet</p>
      </footer>
    </div>
  );
};

export default Home;
