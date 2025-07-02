// ⚙️ Imports
import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import io from "socket.io-client";
import axiosInstance from "../utils/axiosInstance";
import { FaFile } from "react-icons/fa";
import EmojiPicker from "emoji-picker-react";

const socket = io(import.meta.env.VITE_API_BASE_URL, { withCredentials: true });

// ⚙️ Judge0 API Config
const JUDGE0_API =
  "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true";
const JUDGE0_HEADERS = {
  "content-type": "application/json",
  "X-RapidAPI-Key": "58a9de47d9msh9f578af9000a101p1d1d1bjsn69a77375340a",
  "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
};

const PairProgramming = () => {
  const [searchParams] = useSearchParams();
  const room = searchParams.get("room") || "default-room";

  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("// Start collaborating...");
  const [theme, setTheme] = useState("vs-dark");
  const [saveStatus, setSaveStatus] = useState("Saved");
  const [history, setHistory] = useState([]);
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [viewerImage, setViewerImage] = useState(null);
  const fileInputRef = useRef(null);

  const [usersInRoom, setUsersInRoom] = useState([]);
  const [typingUser, setTypingUser] = useState(null);

  const editorRef = useRef(null);
  const otherCursorDecoration = useRef([]);
  const isRemoteChange = useRef(false);
  const autoSaveInterval = useRef(null);

  const user = JSON.parse(localStorage.getItem("user")) || { name: "Guest" };

  useEffect(() => {
    // Join room with name and room as an object
    socket.emit("joinRoom", { room, name: user.name });

    socket.on("codeUpdate", ({ room: incomingRoom, code: newCode }) => {
      if (incomingRoom !== room) return;
      isRemoteChange.current = true;
      setCode(newCode);
    });

    socket.on("cursorMove", ({ position }) => {
      if (!editorRef.current || !window.monaco) return;
      otherCursorDecoration.current = editorRef.current.deltaDecorations(
        otherCursorDecoration.current,
        [
          {
            range: new window.monaco.Range(
              position.lineNumber,
              position.column,
              position.lineNumber,
              position.column
            ),
            options: { className: "ghost-cursor" },
          },
        ]
      );
    });

    socket.on("newMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("joinedUsers", (users) => {
      setUsersInRoom(users);
    });

    socket.on("userTyping", (name) => {
      setTypingUser(name);
      setTimeout(() => setTypingUser(null), 2000);
    });

    const loadSession = async () => {
      try {
        await axiosInstance.get("/auth/load-session", {
          params: { room },
        });
        if (res.data?.code) {
          setCode(res.data.code);
          setLanguage(res.data.language || "javascript");
        }
      } catch {
        console.log("No previous session found.");
      }
    };

    loadSession();

    autoSaveInterval.current = setInterval(() => {
      handleSave();
    }, 10000);

    return () => {
      socket.off("codeUpdate");
      socket.off("cursorMove");
      socket.off("newMessage");
      socket.off("joinedUsers");
      socket.off("userTyping");
      clearInterval(autoSaveInterval.current);
    };
  }, [room]);

  const handleEditorChange = (value) => {
    if (isRemoteChange.current) {
      isRemoteChange.current = false;
      return;
    }
    setCode(value);
    socket.emit("codeUpdate", { room, code: value });

    setSaveStatus("Saving...");
    setTimeout(() => setSaveStatus("Saved"), 1000);

    const timestamp = new Date().toLocaleTimeString();
    setHistory((prev) => [...prev, { timestamp, code: value }]);
  };

  const handleSave = async () => {
    try {
      await axiosInstance.post("/auth/save-session", {
        room,
        code,
        language,
      });
    } catch (err) {
      console.error("❌ Save failed:", err.message);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      alert("Code copied to clipboard!");
    } catch {
      alert("Failed to copy.");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code.${language}`;
    a.click();
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "vs-dark" ? "light" : "vs-dark"));
  };

  const getLanguageId = (lang) => {
    switch (lang) {
      case "javascript":
        return 63;
      case "python":
        return 71;
      case "cpp":
        return 54;
      case "java":
        return 62;
      default:
        return 63;
    }
  };

  const runCode = async () => {
    setIsRunning(true);
    setOutput("⏳ Running...");
    try {
      const res = await axios.post(
        JUDGE0_API,
        {
          source_code: code,
          language_id: getLanguageId(language),
        },
        { headers: JUDGE0_HEADERS }
      );

      const result = res.data;

      let outputText = "";
      if (result.stderr) outputText += `❌ Error:\n${result.stderr}\n`;
      if (result.compile_output) outputText += `🛠️ Compile Output:\n${result.compile_output}\n`;
      if (result.stdout) outputText += `✅ Output:\n${result.stdout}\n`;
      if (!outputText) outputText = "⚠️ No output or error received.";

      setOutput(outputText);
    } catch (err) {
      console.error("Error running code:", err.response?.data || err.message);
      setOutput(`❌ Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // UPDATED sendMessage to include room for broadcasting
  const sendMessage = () => {
    if (!message.trim()) return;
    const newMsg = {
      room, // include room
      type: "text",
      content: message,
      sender: user.name,
      timestamp: new Date().toISOString(),
      status: "Seen",
    };
    socket.emit("newMessage", newMsg);
    setMessages((prev) => [...prev, { ...newMsg, sender: "You" }]);
    setMessage("");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const type = file.type.startsWith("image/") ? "image" : "file";

    const msg = {
      room, // include room
      type,
      content: url,
      name: file.name,
      sender: user.name,
      timestamp: new Date().toISOString(),
      status: "Delivered",
    };

    socket.emit("newMessage", msg);
    setMessages((prev) => [...prev, { ...msg, sender: "You" }]);
  };

  const formatTime = (ts) => {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex h-screen bg-[#1e1e1e] text-white">
      <style>{`
        .ghost-cursor {
          border-left: 2px solid #ff4081;
          margin-left: -1px;
          pointer-events: none;
          animation: blink 1s step-start 0s infinite;
        }
        @keyframes blink {
          50% { opacity: 0; }
        }
      `}</style>

      {/* Left Side */}
      <div className="w-12 bg-[#252526] flex flex-col items-center py-4 space-y-6">
        <FaFile size={20} />
      </div>

      {/* Main Area */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <div className="bg-[#2d2d2d] h-10 flex items-center px-4 justify-between text-sm">
          <span>📄 index.{language}</span>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-300">👨‍💻 {usersInRoom.join(", ")}</div>
            <button onClick={toggleTheme} className="bg-gray-600 px-2 py-1 rounded">Toggle Theme</button>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="bg-black px-2 py-1 rounded">
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
            </select>
            <button onClick={handleCopy} className="bg-yellow-600 px-2 py-1 rounded">📋</button>
            <button onClick={handleDownload} className="bg-green-600 px-2 py-1 rounded">⬇</button>
            <button onClick={handleSave} className="bg-blue-600 px-2 py-1 rounded">💾</button>
            <button onClick={runCode} className="bg-red-600 px-2 py-1 rounded">▶ {isRunning ? "Running..." : "Run"}</button>
            <button
              onClick={() => {
                const link = `${window.location.origin}/pair?room=${room}`;
                navigator.clipboard.writeText(link);
                alert("Invite link copied!");
              }}
              className="bg-pink-600 px-2 py-1 rounded"
            >
              🔗 Invite
            </button>
          </div>
        </div>

        {/* Editor + Chat */}
        <div className="flex flex-1 overflow-hidden">
          {/* Editor */}
          <div className="w-3/4 flex flex-col">
            <Editor
              height="100%"
              language={language}
              theme={theme}
              value={code}
              onChange={handleEditorChange}
              onMount={(editor) => {
                editorRef.current = editor;
                editor.onDidChangeCursorPosition((e) => {
                  socket.emit("cursorMove", {
                    room,
                    position: e.position,
                  });
                });
              }}
            />
            <div className="bg-black text-green-400 p-2 h-32 overflow-y-auto text-sm font-mono border-t border-gray-600">
              <strong>Output:</strong>
              <pre>{output}</pre>
            </div>
          </div>

          {/* Chat */}
          <div className="w-1/4 bg-[#1f1f1f] flex flex-col border-l border-gray-700">
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`px-2 py-1 rounded relative group max-w-[90%] ${
                    msg.sender === "You"
                      ? "bg-blue-600 self-end text-right"
                      : "bg-gray-700 self-start text-left"
                  }`}
                >
                  <div className="text-xs text-gray-300">
                    {msg.sender === "You" ? "You" : msg.sender}
                  </div>
                  {msg.type === "text" && <span>{msg.content}</span>}
                  {msg.type === "image" && (
                    <img
                      src={msg.content}
                      alt=""
                      className="rounded max-w-[150px] cursor-pointer"
                      onClick={() => setViewerImage(msg.content)}
                    />
                  )}
                  {msg.type === "file" && (
                    <a href={msg.content} download className="text-blue-400 underline">
                      📎 {msg.name}
                    </a>
                  )}
                  <div className="text-[10px] text-gray-400 mt-1">
                    {formatTime(msg.timestamp)} {msg.status === "Seen" ? "✔✔" : "✔"}
                  </div>
                </div>
              ))}
            </div>

            {typingUser && (
              <div className="text-xs text-gray-400 italic px-2 pb-1">
                {typingUser} is typing...
              </div>
            )}

            <div className="p-2 flex items-center gap-1 border-t border-gray-700">
              <input ref={fileInputRef} type="file" hidden onChange={handleFileUpload} />
              <button onClick={() => fileInputRef.current.click()}>📎</button>
              <div className="relative">
                <button onClick={() => setShowEmojiPicker(!showEmojiPicker)}>😄</button>
                {showEmojiPicker && (
                  <div className="absolute bottom-10 right-0 z-50">
                    <EmojiPicker onEmojiClick={(e) => setMessage((prev) => prev + e.emoji)} theme="dark" />
                  </div>
                )}
              </div>
              <input
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  socket.emit("typing", { room, name: user.name });
                }}
                className="flex-1 px-2 py-1 rounded bg-[#2e2e2e] text-white"
                placeholder="Type..."
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button onClick={sendMessage} className="bg-purple-600 px-2 py-1 rounded">Send</button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#007acc] h-6 text-xs flex items-center px-4 justify-between">
          <span>Lang: {language}</span>
          <span>Room: {room}</span>
          <span>Status: {saveStatus}</span>
        </div>

        {/* Image Viewer */}
        {viewerImage && (
          <div
            onClick={() => setViewerImage(null)}
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          >
            <img src={viewerImage} alt="preview" className="max-w-[90%] max-h-[90%] rounded" />
          </div>
        )}
      </div>
    </div>
  );
};

export default PairProgramming;
