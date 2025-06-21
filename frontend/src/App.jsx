import Navbar from "./components/Navbar";

function App() {
  return (
    <>
      <Navbar />
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <h1 className="text-4xl font-bold mb-4">🚀 Welcome to DevMeet</h1>
        <p className="text-lg">Connect with other developers for pair programming!</p>
      </div>
    </>
  );
}

export default App;
