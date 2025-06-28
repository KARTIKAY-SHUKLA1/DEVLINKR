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
    profilePic: "",
  });

  const [preview, setPreview] = useState("/default-profile.png");
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/auth/profile?email=${user.email}`);
        const profile = res.data;

        setFormData({
          ...profile,
          skills: profile.skills?.join(", ") || "",
          interests: profile.interests?.join(", ") || "",
        });

        setPreview(
          profile.profilePic
            ? `http://localhost:5000${profile.profilePic}`
            : "/default-profile.png"
        );
      } catch (err) {
        console.error("Failed to load profile", err);
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
          data.append(key, value.split(",").map((v) => v.trim()));
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
          className="bg-white p-6 rounded shadow-md w-full max-w-xl space-y-4"
        >
          {/* Profile Photo */}
          <div className="flex justify-center">
            <img
              src={preview}
              alt="Profile"
              className="w-32 h-32 object-cover rounded-full shadow mb-2"
            />
          </div>
          <input type="file" accept="image/*" onChange={handleImageChange} />

          {/* Common Fields */}
          <input
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />
          <input
            name="role"
            placeholder="Role"
            value={formData.role}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />

          {/* Conditionally show College / Company+Experience */}
          {formData.role === "student" && (
            <input
              name="college"
              placeholder="College"
              value={formData.college}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
          )}

          {formData.role === "professional" && (
            <>
              <input
                name="company"
                placeholder="Company"
                value={formData.company}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
              />
              <input
                name="experience"
                placeholder="Experience"
                value={formData.experience}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
              />
            </>
          )}

          {/* Other Fields */}
          <input
            name="github"
            placeholder="GitHub"
            value={formData.github}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />
          <input
            name="bio"
            placeholder="Bio"
            value={formData.bio}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />
          <input
            name="skills"
            placeholder="Skills (comma-separated)"
            value={formData.skills}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />
          <input
            name="availability"
            placeholder="Availability"
            value={formData.availability}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Save Changes
          </button>

          {message && <p className="text-center text-sm mt-2 text-green-700">{message}</p>}
        </form>
      </div>
    </>
  );
};

export default Profile;
