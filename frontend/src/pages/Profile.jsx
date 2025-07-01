import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

const Profile = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    college: "",
    company: "",
    github: "",
    experience: "",
    bio: "",
    skills: "",
    interests: "",
    availability: "",
  });

  const [preview, setPreview] = useState("/default-profile.png");
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/auth/profile?email=${user.email}`
        );
        const profile = res.data;

        setFormData({
          ...profile,
          skills: Array.isArray(profile.skills)
            ? profile.skills.join(", ")
            : "",
          interests: Array.isArray(profile.interests)
            ? profile.interests.join(", ")
            : "",
        });

        setPreview(
          profile.profilePic
            ? profile.profilePic.startsWith("http")
              ? profile.profilePic
              : `http://localhost:5000${profile.profilePic}`
            : "/default-profile.png"
        );
      } catch (err) {
        console.error("❌ Failed to load profile", err);
      }
    };

    fetchProfile();
  }, [user.email]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (["skills", "interests"].includes(key)) {
          data.append(
            key,
            JSON.stringify(
              value
                .split(",")
                .map((v) => v.trim())
                .filter((v) => v)
            )
          );
        } else {
          data.append(key, value);
        }
      });

      data.append("email", user.email);
      if (selectedFile) data.append("profilePic", selectedFile);

      await axios.put("http://localhost:5000/api/auth/profile", data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage("✅ Profile updated successfully!");
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to update profile");
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 py-10 flex justify-center px-4">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-xl shadow-lg w-full max-w-xl space-y-4 animate-fade-in"
        >
          {/* Profile Picture */}
          <div className="flex flex-col items-center">
            <img
              src={preview}
              alt="Profile"
              className="w-32 h-32 object-cover rounded-full shadow mb-2 border-2 border-blue-500 transition-transform hover:scale-105"
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="text-sm"
            />
          </div>

          <hr className="border-t border-gray-300" />

          <p className="text-sm font-semibold text-gray-700">Basic Information</p>
          <input
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition"
            required
          />
          <input
            name="email"
            value={formData.email}
            readOnly
            className="w-full border px-3 py-2 rounded bg-gray-100 text-gray-600 cursor-not-allowed"
          />
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition"
            required
          >
            <option value="">Select Role</option>
            <option value="student">Student</option>
            <option value="professional">Professional</option>
          </select>

          {formData.role === "student" && (
            <input
              name="college"
              placeholder="College Name"
              value={formData.college}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition"
              required
            />
          )}

          {formData.role === "professional" && (
            <>
              <input
                name="company"
                placeholder="Company Name"
                value={formData.company}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition"
                required
              />
              <input
                name="experience"
                placeholder="Experience (in years)"
                value={formData.experience}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition"
              />
            </>
          )}

          <hr className="border-t border-gray-300" />

          <p className="text-sm font-semibold text-gray-700">More Details</p>
          <input
            name="github"
            placeholder="GitHub Profile Link"
            value={formData.github}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition"
          />
          <input
            name="bio"
            placeholder="Short Bio"
            value={formData.bio}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition"
          />
          <input
            name="skills"
            placeholder="Skills (comma separated)"
            value={formData.skills}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition"
          />
          <input
            name="interests"
            placeholder="Interests (comma separated)"
            value={formData.interests}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition"
          />
          <input
            name="availability"
            placeholder="Availability (e.g. Weekends)"
            value={formData.availability}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition"
          />

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium shadow-md transition duration-300"
          >
            Save Profile
          </button>

          {message && (
            <div
              className={`mt-2 text-center text-sm px-4 py-2 rounded ${
                message.startsWith("✅")
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {message}
            </div>
          )}
        </form>
      </div>
    </>
  );
};

export default Profile;
