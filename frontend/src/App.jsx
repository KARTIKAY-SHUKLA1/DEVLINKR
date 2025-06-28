import Navbar from "./components/Navbar";

function App() {
  return (
    <>
      <Navbar />
      <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 text-center">
        {/* 🚀 Logo from public */}
        <img
          src="/logo.png"
          alt="DevMeet Logo"
          className="w-24 h-24 mb-4 rounded-full shadow-md"
        />

        {/* 🔥 Title */}
        <h1 className="text-5xl font-bold mb-4 text-blue-700">Welcome to DevMeet</h1>

        {/* 🧠 Description */}
        <p className="text-lg text-gray-700 max-w-xl mb-8">
          DevMeet is a platform to help developers connect for pair programming, real-time chat,
          and tech collaboration. Whether you're a student or professional, find your coding buddy here.
        </p>

        {/* ✅ Features List */}
        <section className="bg-white p-6 rounded-lg shadow-md max-w-2xl w-full">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">🌟 Features:</h2>
          <ul className="space-y-2 text-gray-600 text-left list-disc list-inside">
            <li>🔍 Match with devs based on skills & interests</li>
            <li>💬 Real-time Dev Chat & Pair Programming</li>
            <li>📬 Notifications for requests & matches</li>
            <li>📝 Maintain and edit your Dev Profile</li>
            <li>🎯 Student & Professional modes</li>
          </ul>
        </section>
      </main>
    </>
  );
}

export default App;
