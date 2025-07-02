import { useState } from "react";
import axios from "axios";
import Select from "react-select";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;


const skillsOptions = [
  // Frontend
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "react", label: "React" },
  { value: "nextjs", label: "Next.js" },
  { value: "vue", label: "Vue.js" },
  { value: "svelte", label: "Svelte" },
  { value: "tailwind", label: "Tailwind CSS" },

  // Backend
  { value: "nodejs", label: "Node.js" },
  { value: "express", label: "Express" },
  { value: "django", label: "Django" },
  { value: "flask", label: "Flask" },
  { value: "springboot", label: "Spring Boot" },
  { value: "fastapi", label: "FastAPI" },
  { value: "ruby_on_rails", label: "Ruby on Rails" },

  // Databases
  { value: "mongodb", label: "MongoDB" },
  { value: "mysql", label: "MySQL" },
  { value: "postgresql", label: "PostgreSQL" },
  { value: "redis", label: "Redis" },
  { value: "firebase", label: "Firebase" },

  // DevOps & Tools
  { value: "docker", label: "Docker" },
  { value: "kubernetes", label: "Kubernetes" },
  { value: "jenkins", label: "Jenkins" },
  { value: "github_actions", label: "GitHub Actions" },
  { value: "terraform", label: "Terraform" },
  { value: "ansible", label: "Ansible" },
  { value: "aws", label: "AWS" },
  { value: "azure", label: "Azure" },
  { value: "gcp", label: "Google Cloud" },
  { value: "linux", label: "Linux" },

  // Programming Languages
  { value: "python", label: "Python" },
  { value: "cpp", label: "C++" },
  { value: "java", label: "Java" },
  { value: "golang", label: "Go (Golang)" },
  { value: "rust", label: "Rust" },
  { value: "csharp", label: "C#" },
  { value: "php", label: "PHP" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },

  // AI/ML & Data
  { value: "tensorflow", label: "TensorFlow" },
  { value: "pytorch", label: "PyTorch" },
  { value: "scikit_learn", label: "Scikit-learn" },
  { value: "pandas", label: "Pandas" },
  { value: "numpy", label: "NumPy" },
  { value: "sql", label: "SQL" },
  { value: "powerbi", label: "Power BI" },
  { value: "tableau", label: "Tableau" },

  // Testing
  { value: "jest", label: "Jest" },
  { value: "cypress", label: "Cypress" },
  { value: "playwright", label: "Playwright" },

  // Misc
  { value: "graphql", label: "GraphQL" },
  { value: "restapi", label: "REST API" },
  { value: "websockets", label: "WebSockets" },
  { value: "git", label: "Git" },
  { value: "figma", label: "Figma" },
  { value: "postman", label: "Postman" },
  { value: "chatgpt_api", label: "ChatGPT API" },
  { value: "langchain", label: "LangChain" },
  { value: "webrtc", label: "WebRTC" },
];
const SignupFlow = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");

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

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "profilePhoto" && files && files[0]) {
      setForm((prev) => ({ ...prev, profilePhoto: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSkillsChange = (selectedOptions) => {
    setForm((prev) => ({
      ...prev,
      skills: selectedOptions ? selectedOptions.map((opt) => opt.value) : [],
    }));
  };

  const handleStep1 = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await axios.post(`${BASE_URL}/api/auth/send-otp`, {
        email: form.email.trim().toLowerCase(),
      });
      setMessage("📨 OTP sent to your email!");
      setStep(2);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.msg || "❌ Failed to send OTP. Try again.");
    }
  };

  const handleStep2 = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await axios.post(`${BASE_URL}/api/auth/verify-otp`, {
        email: form.email.trim().toLowerCase(),
        code: form.otp.trim(),
      });
      setMessage("✅ OTP verified!");
      setStep(3);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.msg || "❌ Invalid OTP. Please try again.");
    }
  };

  const handleFinalSignup = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const formData = new FormData();
      for (const [key, value] of Object.entries(form)) {
        if (key === "skills") {
          formData.append("skills", JSON.stringify(value));
        } else if (key === "profilePhoto" && value) {
          formData.append("profilePhoto", value);
        } else {
          formData.append(key, value);
        }
      }

      await axios.post(`${BASE_URL}/api/auth/signup`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage("✅ Signup successful!");
      navigate("/home");
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.msg || "❌ Signup failed. Please try again.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex justify-center items-center p-6">
        <form
          onSubmit={
            step === 1 ? handleStep1 : step === 2 ? handleStep2 : handleFinalSignup
          }
          className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-gray-100 p-8 space-y-6 transition-all duration-300"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center text-blue-800 mb-2">
            🚀 DevLinkr Signup
          </h2>
          <p className="text-center text-sm text-gray-500 mb-4">Step {step} of 3</p>
          <div className="border-t border-gray-200"></div>

          {step === 1 && (
            <>
              <input
                name="name"
                placeholder="👤 Full Name"
                value={form.name}
                onChange={handleChange}
                className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                required
              />
              <input
                name="email"
                type="email"
                placeholder="📧 Email Address"
                value={form.email}
                onChange={handleChange}
                className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                required
              />
              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-semibold shadow hover:scale-105 transform transition"
              >
                ✉️ Send OTP
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-center text-green-700 bg-green-50 p-2 rounded">
                ✅ OTP sent to <span className="font-semibold">{form.email}</span>
              </p>
              <input
                name="otp"
                placeholder="🔑 Enter 6-digit OTP"
                value={form.otp}
                onChange={handleChange}
                className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                required
              />
              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold shadow hover:scale-105 transform transition"
              >
                ✅ Verify OTP
              </button>
            </>
          )}

          {step === 3 && (
            <>
              {form.profilePhoto && (
                <div className="flex justify-center">
                  <img
                    src={URL.createObjectURL(form.profilePhoto)}
                    alt="Profile Preview"
                    className="w-28 h-28 object-cover rounded-full shadow-lg mb-4 ring-4 ring-blue-300"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/default-profile.png";
                    }}
                  />
                </div>
              )}

              <div>
                <label className="text-sm text-gray-700 block mb-1">
                  🖼️ Profile Photo (optional)
                </label>
                <input
                  type="file"
                  name="profilePhoto"
                  accept="image/*"
                  onChange={handleChange}
                  className="w-full border rounded-lg p-3"
                />
              </div>

              <input
                name="password"
                type="password"
                placeholder="🔒 Set Password"
                value={form.password}
                onChange={handleChange}
                className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
                required
              />

              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
                required
              >
                <option value="">🎯 Select Role</option>
                <option value="student">Student</option>
                <option value="professional">Professional</option>
              </select>

              <Select
                isMulti
                name="skills"
                options={skillsOptions}
                className="w-full text-sm"
                classNamePrefix="select"
                onChange={handleSkillsChange}
                placeholder="🛠️ Select your skills"
              />

              <input
                name="github"
                placeholder="🐙 GitHub Profile URL"
                value={form.github}
                onChange={handleChange}
                className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
                required
              />

              {form.role === "student" && (
                <input
                  name="college"
                  placeholder="🎓 College Name"
                  value={form.college}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
                  required
                />
              )}

              {form.role === "professional" && (
                <>
                  <input
                    name="company"
                    placeholder="🏢 Company Name"
                    value={form.company}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
                  />
                  <input
                    name="experience"
                    placeholder="⌛ Experience (e.g., 2 years)"
                    value={form.experience}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
                  />
                </>
              )}

              <input
                name="remark"
                placeholder="📝 Remarks (optional)"
                value={form.remark}
                onChange={handleChange}
                className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
              />

              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold shadow hover:scale-105 transform transition"
              >
                🚀 Finish Signup
              </button>
            </>
          )}

          {message && (
            <p
              className={`text-center text-sm mt-2 ${
                message.startsWith("✅") || message.startsWith("📨")
                  ? "text-green-700"
                  : "text-red-600"
              }`}
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </>
  );
};

export default SignupFlow;
