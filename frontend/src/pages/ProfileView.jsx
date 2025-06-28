import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";

const ProfileView = () => {
  const { email } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/auth/profile?email=${email}`);
      setProfile(res.data);
    } catch (err) {
      console.error("Profile fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [email]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center h-screen text-xl font-semibold">
          ⏳ Loading profile...
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center h-screen text-xl font-semibold text-red-600">
          ❌ Profile not found
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-white to-indigo-50 py-12 px-4 flex justify-center">
        <div className="bg-white shadow-xl p-8 rounded-2xl w-full max-w-2xl">
          <div className="flex flex-col items-center gap-4">
            <img
              src={`http://localhost:5000${profile.profilePic}`}
              alt="Profile"
              className="w-28 h-28 rounded-full object-cover border-4 border-indigo-300 shadow-lg"
            />
            <h2 className="text-2xl font-bold text-indigo-800">{profile.name}</h2>
            <p className="text-gray-700"><strong>Role:</strong> {profile.role}</p>
            {profile.role === "student" && profile.college && (
              <p className="text-gray-700"><strong>College:</strong> {profile.college}</p>
            )}
            {profile.role === "professional" && profile.company && (
              <p className="text-gray-700"><strong>Company:</strong> {profile.company}</p>
            )}
            {profile.experience && (
              <p className="text-gray-700"><strong>Experience:</strong> {profile.experience}</p>
            )}
            {profile.skills && (
              <p className="text-gray-700"><strong>Skills:</strong> {profile.skills.join(", ")}</p>
            )}
            {profile.github && (
              <p>
                <a
                  href={profile.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  GitHub Profile
                </a>
              </p>
            )}
            {profile.bio && (
              <p className="text-gray-600 italic mt-2">{profile.bio}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileView;
