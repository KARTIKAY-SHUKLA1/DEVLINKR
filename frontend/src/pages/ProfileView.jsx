import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import { FaGithub } from "react-icons/fa";

// ✅ use environment variable
const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const ProfileView = () => {
  const { email } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`${BASE_URL}/api/auth/profile`, {
          params: { email },
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setProfile(res.data);
      } catch (err) {
        console.error("❌ Profile fetch error:", err);
        setError(err.response?.data?.message || "Failed to load profile.");
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [email, token]);

  // ✅ Render loading
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center h-screen text-xl font-semibold text-gray-600">
          ⏳ Loading profile...
        </div>
      </>
    );
  }

  // ✅ Render error
  if (error || !profile) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center h-screen text-xl font-semibold text-red-600">
          ❌ {error || "Profile not found"}
        </div>
      </>
    );
  }

  // ✅ Handle relative/absolute image
  const profileImage = profile.profilePic
    ? /^https?:\/\//.test(profile.profilePic)
      ? profile.profilePic
      : `${BASE_URL}${profile.profilePic}`
    : "/dp.png";

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-white to-indigo-50 py-12 px-4 flex justify-center">
        <div className="bg-white shadow-xl p-8 rounded-2xl w-full max-w-2xl">
          <div className="flex flex-col items-center gap-4 text-center">
            <img
              src={profileImage}
              alt="Profile"
              className="w-28 h-28 rounded-full object-cover border-4 border-indigo-300 shadow-lg"
            />

            <h2 className="text-2xl font-bold text-indigo-800">{profile.name}</h2>
            <p className="text-gray-600 text-sm">{profile.email}</p>
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

            {profile.availability && (
              <p className="text-gray-700"><strong>Availability:</strong> {profile.availability}</p>
            )}

            {profile.skills?.length > 0 && (
              <p className="text-gray-700">
                <strong>Skills:</strong> {profile.skills.join(", ")}
              </p>
            )}

            {profile.interests?.length > 0 && (
              <p className="text-gray-700">
                <strong>Interests:</strong> {profile.interests.join(", ")}
              </p>
            )}

            {profile.github && (
              <a
                href={profile.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:underline"
              >
                <FaGithub /> GitHub Profile
              </a>
            )}

            {profile.bio && (
              <p className="text-gray-600 italic mt-2 max-w-md">{profile.bio}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileView;
