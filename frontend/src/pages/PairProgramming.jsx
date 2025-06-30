import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import io from "socket.io-client";
import axios from "axios";
import { FaFile } from "react-icons/fa"; // ✅ Kept only this icon, or remove if unwanted

const socket = io("http://localhost:5000");

const PairProgramming = () => {
  const [searchParams] = useSearchParams();
  const room = searchParams.get("room") || "default-room";

  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("// Start collaborating...");
  const isRemoteChange = useRef(false);
  const autoSaveInterval = useRef(null);

  useEffect(() => {
    socket.emit("joinRoom", room);
    socket.on("codeUpdate", (newCode) => {
      isRemoteChange.current = true;
      setCode(newCode);
    });

    const loadSession = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/auth/load-session", {
          params: { room },
        });
        if (res.data?.code) {
          setCode(res.data.code);
          setLanguage(res.data.language || "javascript");
        }
      } catch (err) {
        console.log("No previous session found.");
      }
    };

    loadSession();

    autoSaveInterval.current = setInterval(() => {
      handleSave();
    }, 10000);

    return () => {
      socket.off("codeUpdate");
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
  };

  const handleSave = async () => {
    try {
      await axios.post("http://localhost:5000/api/auth/save-session", {
        room,
        code,
        language,
      });
    } catch (err) {
      console.error("❌ Save failed:", err.message);
    }
  };

  return (
    <div className="flex h-screen text-white bg-[#1e1e1e]">
      {/* Sidebar (optional) */}
      <div className="w-12 bg-[#252526] flex flex-col items-center py-4 space-y-6">
        <FaFile size={20} />
      </div>

      {/* Main Editor Area */}
      <div className="flex flex-col flex-1">
        {/* Top Bar */}
        <div className="bg-[#2d2d2d] h-10 flex items-center px-4 text-sm justify-between">
          <span className="text-white">📄 index.{language}</span>
          <div className="flex items-center gap-2">
            <select
              className="bg-[#1e1e1e] text-white px-2 py-1 rounded border border-gray-600"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
              <option value="html">HTML</option>
            </select>
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              💾 Save
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1">
          <Editor
            height="100%"
            language={language}
            theme="vs-dark"
            value={code}
            onChange={handleEditorChange}
          />
        </div>

        {/* Bottom Status Bar */}
        <div className="bg-[#007acc] h-6 text-xs flex items-center px-4 justify-between">
          <span>Language: {language}</span>
          <span>Room: {room}</span>
        </div>
      </div>
    </div>
  );
};

export default PairProgramming;
