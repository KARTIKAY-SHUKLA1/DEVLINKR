import { useState } from "react";
import axios from "axios";
import Select from "react-select";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar"; // ✅ Add header

const skillsOptions = [
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "javascript", label: "JavaScript" },
  { value: "react", label: "React" },
  { value: "nodejs", label: "Node.js" },
  { value: "express", label: "Express" },
  { value: "mongodb", label: "MongoDB" },
  { value: "cpp", label: "C++" },
  { value: "python", label: "Python" },
];

const SignupFlow = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    otp: "",
    password: "",
    role: "",
    github: "",
    skills: [],
    college: "",
    company: "",
    experience: "",
    remark: "",
    profilePhoto: null,
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "profilePhoto") {
      setForm((prev) => ({ ...prev, profilePhoto: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSkillsChange = (selectedOptions) => {
    setForm((prev) => ({
      ...prev,
      skills: selectedOptions.map((opt) => opt.value),
    }));
  };

  const handleStep1 = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await axios.post("http://localhost:5000/api/auth/send-otp", {
        email: form.email,
        name: form.name,
      });
      setMessage("📨 OTP sent to email");
      setStep(2);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to send OTP");
    }
  };

  const handleStep2 = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await axios.post("http://localhost:5000/api/auth/verify-otp", {
        email: form.email,
        code: form.otp,
      });
      setMessage("✅ OTP verified");
      setStep(3);
    } catch (err) {
      console.error(err);
      setMessage("❌ Invalid OTP");
    }
  };

  const handleFinalSignup = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === "skills") {
          value.forEach((v) => formData.append("skills", v));
        } else if (key === "profilePhoto" && value) {
          formData.append("profilePhoto", value);
        } else {
          formData.append(key, value);
        }
      });

      await axios.post("http://localhost:5000/api/auth/signup", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage("✅ Signup successful!");
      navigate("/");
    } catch (err) {
      console.error(err);
      setMessage("❌ Signup failed: " + (err.response?.data?.msg || err.message));
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
        <form
          onSubmit={
            step === 1 ? handleStep1 : step === 2 ? handleStep2 : handleFinalSignup
          }
          className="bg-white p-6 rounded shadow-md space-y-4 w-full max-w-lg"
        >
          <h2 className="text-2xl font-bold text-center">🚀 DevMeet Signup</h2>

          {step === 1 && (
            <>
              <input
                name="name"
                placeholder="Name"
                value={form.name}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
              <input
                name="email"
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                Send OTP
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-sm text-gray-600 mb-2">
                ✅ Email: <span className="font-semibold">{form.email}</span>
              </p>
              <input
                name="otp"
                placeholder="Enter 6-digit OTP"
                value={form.otp}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
              <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
                Verify OTP
              </button>
            </>
          )}

          {step === 3 && (
            <>
              {/* 🧠 Photo Preview should be at the very top of step 3 */}
{form.profilePhoto && (
  <div className="flex justify-center">
    <img
      src={URL.createObjectURL(form.profilePhoto)}
      alt="Profile Preview"
      className="w-28 h-28 object-cover rounded-full mb-4 shadow-md"
    />
  </div>
)}

{/* 📤 File upload input */}
<div>
  <label className="text-sm text-gray-700 block mb-1">Profile Photo (optional)</label>
  <input
    type="file"
    name="profilePhoto"
    accept="image/*"
    onChange={handleChange}
    className="w-full border p-2 rounded"
  />
</div>

              <input
                name="password"
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />

              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              >
                <option value="">Select Role</option>
                <option value="student">Student</option>
                <option value="professional">Professional</option>
              </select>

              <Select
                isMulti
                name="skills"
                options={skillsOptions}
                className="w-full"
                classNamePrefix="select"
                onChange={handleSkillsChange}
                placeholder="Select skills"
              />

              <input
                name="github"
                placeholder="GitHub ID"
                value={form.github}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />

              {form.role === "student" && (
                <input
                  name="college"
                  placeholder="College Name"
                  value={form.college}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                  required
                />
              )}

              {form.role === "professional" && (
                <>
                  <input
                    name="company"
                    placeholder="Company Name"
                    value={form.company}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                  />
                  <input
                    name="experience"
                    placeholder="Experience (e.g., 2 yrs)"
                    value={form.experience}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                  />
                </>
              )}

              <input
                name="remark"
                placeholder="Remarks (optional)"
                value={form.remark}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />

              <button
                type="submit"
                className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
              >
                Finish Signup
              </button>
            </>
          )}

          {message && (
            <p className="text-center text-sm mt-2 text-red-600">{message}</p>
          )}
        </form>
      </div>
    </>
  );
};

export default SignupFlow;
