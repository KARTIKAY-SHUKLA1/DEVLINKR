import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import api from "../api";
import { useNavigate } from "react-router-dom";
import notifSound from "../assets/de9b387f-3cba-4a1c-b66c-44974a312ac4.mp3";

export const socket = io(import.meta.env.VITE_API_BASE_URL, {
  transports: ["websocket"],
  withCredentials: true,
});

const DevChat = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [connections, setConnections] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState("");
  const [searchContact, setSearchContact] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingStatus, setTypingStatus] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const audioRef = useRef(new Audio(notifSound));

  const formatTimestamp = (iso) => {
    const date = new Date(iso);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    const timeStr = date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
    if (isToday) return `Today ${timeStr}`;
    if (isYesterday) return `Yesterday ${timeStr}`;
    return `${date.toLocaleDateString([], { month: "short", day: "numeric" })}, ${timeStr}`;
  };

  const getFullUrl = (path) =>
    path?.startsWith("http")
      ? path
      : `${import.meta.env.VITE_API_BASE_URL}${path}`;
  const getProfilePhoto = (u) => (u?.profilePic ? getFullUrl(u.profilePic) : "/dp.png");

  useEffect(() => {
    if (!user) return;
    const fetchConnections = async () => {
      try {
        const res = await api.get(`/api/auth/notifications?email=${user.email}`);
        setConnections(res.data.connections || []);

        // ✅ Initialize unread message counts
        const counts = {};
        (res.data.connections || []).forEach(c => {
          counts[c.email] = c.unseenMessages || 0;
        });
        setUnreadCounts(counts);

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
        const res = await api.get(`/api/auth/chat-history`, {
          params: { user1: user.email, user2: selectedUser.email },
        });
        setMessages(res.data);

        const unseenMessages = res.data.filter(
          (m) => m.receiver === user.email && m.status !== "seen"
        );
        if (unseenMessages.length > 0) {
          await api.post(`/api/auth/mark-seen`, {
            sender: selectedUser.email,
            receiver: user.email,
          });
          socket.emit("markSeen", {
            sender: selectedUser.email,
            receiver: user.email,
          });
        }

        // ✅ Clear unread badge
        setUnreadCounts((prev) => ({
          ...prev,
          [selectedUser.email]: 0
        }));

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
        setMessages((prev) => {
          const alreadyExists = prev.some(
            (m) =>
              m.message === msg.message &&
              m.sender === msg.sender &&
              m.receiver === msg.receiver
          );
          if (!alreadyExists) return [...prev, msg];
          return prev;
        });

        if (msg.receiver === user.email && selectedUser?.email === msg.sender) {
          socket.emit("markSeen", { sender: msg.sender, receiver: msg.receiver });
          try {
            await api.post(`/api/auth/mark-seen`, {
              sender: msg.sender,
              receiver: msg.receiver,
            });
            audioRef.current.play().catch(() => {});
          } catch (err) {
            console.error("Mark seen API error:", err);
          }
        }
      }

      // ✅ Increment unread count for others
      if (msg.receiver === user.email && msg.sender !== selectedUser?.email) {
        setUnreadCounts((prev) => ({
          ...prev,
          [msg.sender]: (prev[msg.sender] || 0) + 1
        }));
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

    socket.on("messageSeen", ({ sender }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.sender === user.email && msg.receiver === sender && msg.status !== "seen"
            ? { ...msg, status: "seen" }
            : msg
        )
      );
    });

    return () => {
      socket.off("newMessage");
      socket.off("typing");
      socket.off("onlineUsers");
      socket.off("messageSeen");
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
      await api.post(`/api/auth/send-message`, newMsg);
      socket.emit("sendMessage", { to: selectedUser.email, messageData: newMsg });
      setMessages((prev) => [...prev, { ...newMsg, status: "sent", createdAt: new Date() }]);
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
      const res = await api.post(`/api/auth/upload-file`, formData);
      const fileUrl = res.data.url;

      const newMsg = {
        sender: user.email,
        receiver: selectedUser.email,
        message: fileUrl,
      };

      await api.post(`/api/auth/send-message`, newMsg);
      socket.emit("sendMessage", { to: selectedUser.email, messageData: newMsg });
      setMessages((prev) => [...prev, { ...newMsg, status: "sent", createdAt: new Date() }]);
    } catch (err) {
      console.error("File upload error:", err);
    }
  };

  if (!user) {
    return <div className="flex h-screen items-center justify-center text-gray-600">Please log in to access DevChat.</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="w-full bg-gray-900 text-white px-4 py-2 flex justify-between items-center shadow-md z-10">
        <div className="text-xl font-bold">DevLinkr</div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSidebar(!showSidebar)} className="md:hidden bg-gray-800 px-2 py-1 rounded">☰</button>
          <button onClick={() => navigate("/home")} className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-700 hidden sm:block">
            ⬅ Dashboard
          </button>
          <span className="text-sm">{user.name}</span>
          <img src={getProfilePhoto(user)} className="w-9 h-9 rounded-full object-cover border-2 border-white" alt="User" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={`${showSidebar ? "fixed z-50 top-12 left-0 h-full md:relative" : "hidden"} md:block w-64 bg-gray-900 text-white p-4 overflow-y-auto`}>
          <h2 className="text-xl font-bold mb-3">💬 Dev Chat</h2>
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchContact}
            onChange={(e) => setSearchContact(e.target.value)}
            className="w-full px-3 py-2 mb-4 rounded bg-gray-800 text-white placeholder-gray-400 border border-gray-600 focus:outline-none"
          />
          {connections
            .filter((c) => c.name.toLowerCase().includes(searchContact.toLowerCase()))
            .map((c) => (
              <div
                key={c.email}
                onClick={() => {
                  setSelectedUser(c);
                  setUnreadCounts((prev) => ({
                    ...prev,
                    [c.email]: 0
                  }));
                  if (window.innerWidth < 768) setShowSidebar(false);
                }}
                className={`p-2 rounded cursor-pointer mb-1 flex items-center gap-2 hover:bg-gray-700 ${
                  selectedUser?.email === c.email ? "bg-gray-700" : ""
                }`}
              >
                <img src={getProfilePhoto(c)} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                <span className="flex-1">{c.name}</span>

                {unreadCounts[c.email] > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-2">
                    +{unreadCounts[c.email]}
                  </span>
                )}

                {onlineUsers.includes(c.email) && <span className="w-2 h-2 rounded-full bg-green-400 ml-2" />}
              </div>
            ))}
        </div>

        {/* Chat Section */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {selectedUser ? (
            <>
              <div className="p-4 border-b bg-indigo-50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <img src={getProfilePhoto(selectedUser)} className="w-8 h-8 rounded-full" alt="avatar" />
                  <span className="font-semibold">{selectedUser.name}</span>
                </div>
                {onlineUsers.includes(selectedUser.email) && <span className="text-green-600 text-sm">🟢 Online</span>}
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex gap-2 items-end max-w-[75%] ${
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
                        {m.message?.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
                          <img src={getFullUrl(m.message)} alt="uploaded" className="max-w-xs rounded" />
                        ) : m.message?.match(/\.pdf$/i) ? (
                          <a href={getFullUrl(m.message)} target="_blank" rel="noreferrer" className="underline text-blue-600">
                            📎 View PDF
                          </a>
                        ) : m.message?.startsWith("http") ? (
                          <a href={m.message} target="_blank" rel="noreferrer" className="underline text-blue-600">
                            📎 View File
                          </a>
                        ) : (
                          m.message
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(m.createdAt || new Date())}
                        {m.sender === user.email && (
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
                {typingStatus && (
                  <div className="text-sm italic text-gray-500">
                    {selectedUser.name} is typing...
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input Box */}
              <div className="p-4 border-t flex flex-wrap gap-2 items-center">
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
    </div>
  );
};

export default DevChat;
