import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const socket = io("http://localhost:5000");

const DevChat = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [connections, setConnections] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingStatus, setTypingStatus] = useState(false);
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const formatTimestamp = (iso) => {
    const date = new Date(iso);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    const timeStr = date.toLocaleTimeString([], { hour: "numeric", minute: "numeric", hour12: true });
    if (isToday) return `Today ${timeStr}`;
    if (isYesterday) return `Yesterday ${timeStr}`;
    return `${date.toLocaleDateString([], { month: "short", day: "numeric" })}, ${timeStr}`;
  };

  const getProfilePhoto = (u) =>
    u?.profilePic ? `http://localhost:5000${u.profilePic}` : "/default-profile.png";

  useEffect(() => {
    if (!user) return;
    const fetchConnections = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/auth/notifications?email=${user.email}`);
        setConnections(res.data.connections || []);
      } catch (err) {
        console.error("Error fetching connections:", err);
      }
    };
    fetchConnections();
  }, [user?.email]);

  useEffect(() => {
    if (!selectedUser?.email || !user?.email) return;

    const fetchChat = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/auth/chat-history", {
          params: { user1: user.email, user2: selectedUser.email },
        });
        setMessages(res.data);
      } catch (err) {
        console.error("Chat history fetch error:", err);
      }
    };
    fetchChat();
  }, [selectedUser?.email, user?.email]);

  useEffect(() => {
    if (!user) return;

    socket.emit("register", user.email);

    socket.on("newMessage", async (msg) => {
      const isRelevant =
        (msg.sender === selectedUser?.email && msg.receiver === user.email) ||
        (msg.sender === user.email && msg.receiver === selectedUser?.email);

      if (isRelevant) {
        setMessages((prev) => [...prev, msg]);

        if (msg.receiver === user.email && selectedUser?.email === msg.sender) {
          socket.emit("markSeen", { sender: msg.sender, receiver: msg.receiver });
          try {
            await axios.post("http://localhost:5000/api/auth/mark-seen", {
              sender: msg.sender,
              receiver: msg.receiver,
            });
          } catch (err) {
            console.error("Mark seen API error:", err);
          }
        }
      }
    });

    socket.on("typing", ({ from }) => {
      if (from === selectedUser?.email) {
        setTypingStatus(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTypingStatus(false), 1500);
      }
    });

    socket.on("onlineUsers", (online) => setOnlineUsers(online));

    return () => {
      socket.off("newMessage");
      socket.off("typing");
      socket.off("onlineUsers");
    };
  }, [selectedUser?.email, user?.email]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTyping = () => {
    if (selectedUser) socket.emit("typing", selectedUser.email);
  };

  const sendMessage = async () => {
    if (!inputMsg.trim() || !selectedUser) return;

    const newMsg = {
      sender: user.email,
      receiver: selectedUser.email,
      message: inputMsg.trim(),
    };

    try {
      await axios.post("http://localhost:5000/api/auth/send-message", newMsg);
      socket.emit("sendMessage", { to: selectedUser.email, messageData: newMsg });
      setMessages((prev) => [...prev, { ...newMsg, status: "sent" }]);
      setInputMsg("");
    } catch (err) {
      console.error("Send message error:", err);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedUser) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://localhost:5000/api/auth/upload-file", formData);
      const fileUrl = res.data.url;

      const newMsg = {
        sender: user.email,
        receiver: selectedUser.email,
        message: fileUrl,
      };

      await axios.post("http://localhost:5000/api/auth/send-message", newMsg);
      socket.emit("sendMessage", { to: selectedUser.email, messageData: newMsg });
      setMessages((prev) => [...prev, { ...newMsg, status: "sent" }]);
    } catch (err) {
      console.error("File upload error:", err);
    }
  };

  if (!user) {
    return <div className="flex h-screen items-center justify-center text-gray-600">Please log in to access DevChat.</div>;
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">💬 Dev Chat</h2>
        {connections.map((c) => (
  <div
    key={c.email}
    onClick={() => setSelectedUser(c)}
    className={`p-2 rounded cursor-pointer mb-1 flex items-center gap-2 hover:bg-gray-700 ${
      selectedUser?.email === c.email ? "bg-gray-700" : ""
    }`}
  >
    <img src={getProfilePhoto(c)} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
    <span>{c.name}</span>
    {onlineUsers.includes(c.email) && <span className="w-2 h-2 rounded-full bg-green-400 ml-auto" />}
  </div>
))}

      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedUser ? (
          <>
            <div className="p-4 border-b bg-indigo-50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <img src={getProfilePhoto(selectedUser)} className="w-8 h-8 rounded-full" alt="avatar" />
                <span className="font-semibold">{selectedUser.name}</span>
              </div>
              {onlineUsers.includes(selectedUser.email) && <span className="text-green-600 text-sm">🟢 Online</span>}
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-2">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex gap-2 items-end max-w-[70%] ${
                    m.sender === user.email ? "ml-auto justify-end" : "justify-start"
                  }`}
                >
                  <img
                    src={m.sender === user.email ? getProfilePhoto(user) : getProfilePhoto(selectedUser)}
                    className="w-6 h-6 rounded-full"
                    alt="avatar"
                  />
                  <div className="flex flex-col items-start">
                    <div
                      className={`p-2 rounded-lg text-sm break-words ${
                        m.sender === user.email ? "bg-blue-100" : "bg-gray-200"
                      }`}
                    >
                      {m.message?.startsWith("/uploads/chat/") ? (
                        m.message.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
                          <img src={`http://localhost:5000${m.message}`} alt="uploaded" className="max-w-xs rounded" />
                        ) : (
                          <a
                            href={`http://localhost:5000${m.message}`}
                            target="_blank"
                            rel="noreferrer"
                            className="underline text-blue-600"
                          >
                            📎 View File
                          </a>
                        )
                      ) : (
                        m.message
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(m.createdAt || new Date())}
                      {m.sender === user.email && m.status && (
                        <>
                          {" "}
                          •{" "}
                          {m.status === "seen"
                            ? "✔✔"
                            : m.status === "delivered"
                            ? "✔"
                            : "⏳"}
                        </>
                      )}
                    </span>
                  </div>
                </div>
              ))}
              {typingStatus && <div className="text-sm italic text-gray-500">{selectedUser.name} is typing...</div>}
              <div ref={bottomRef} />
            </div>

            <div className="p-4 border-t flex gap-2 items-center">
              <input type="file" onChange={handleFileChange} className="text-sm text-gray-500" />
              <button
                onClick={() => {
                  const roomId = [user.email, selectedUser.email].sort().join("-");
                  navigate(`/pair?room=${roomId}`);
                }}
                className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600"
              >
                👨‍💻 Pair
              </button>
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                  else handleTyping();
                }}
                placeholder="Type a message..."
                className="flex-1 border rounded px-3 py-2"
              />
              <button
                onClick={sendMessage}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a user to chat with.
          </div>
        )}
      </div>
    </div>
  );
};

export default DevChat;
