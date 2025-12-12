import React, { useState, useEffect, useRef } from "react";
import { useUser } from "../../context/UserContext";
import socket from "../../socket/socket";

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
}

interface ChatProps {
  roomId: string;
  onClose: () => void;
}

function Chat({ roomId, onClose }: ChatProps) {
  const { username, userId } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    socket.on("load-chat-history", (chatHistory: ChatMessage[]) => {
      setMessages(chatHistory);
    });

    socket.on("chat-new-message", (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("chat-user-typing", (data: { userId: string; username: string }) => {
      if (data.userId === socket.id) return;

      setIsTyping((prev) => {
        if (!prev.includes(data.username)) {
          return [...prev, data.username];
        }
        return prev;
      });

      setTimeout(() => {
        setIsTyping((prev) => prev.filter((u) => u !== data.username));
      }, 3000);
    });

    socket.on("chat-user-stopped-typing", (data: { userId: string }) => {
      setIsTyping((prev) => prev.filter((_, i) => i !== 0));
    });

    return () => {
      socket.off("load-chat-history");
      socket.off("chat-new-message");
      socket.off("chat-user-typing");
      socket.off("chat-user-stopped-typing");
    };
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    socket.emit("chat-send-message", inputMessage.trim());
    setInputMessage("");
    socket.emit("chat-stop-typing");

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleTyping = () => {
    socket.emit("chat-typing");

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      socket.emit("chat-stop-typing");
    }, 2000);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="d-flex flex-column h-100 bg-white">
      <div className="bg-primary text-white p-3 d-flex justify-content-between align-items-center border-bottom">
        <div className="d-flex align-items-center gap-2">
          <span style={{ fontSize: "1.5rem" }}>💬</span>
          <div>
            <h6 className="mb-0 fw-bold">Chat</h6>
            <small className="opacity-75">Room: {roomId}</small>
          </div>
        </div>
        <button
          className="btn btn-light btn-sm rounded-circle d-flex align-items-center justify-content-center"
          onClick={onClose}
          style={{ width: "32px", height: "32px", padding: "0", fontSize: "18px" }}
          title="Close Chat"
        >
          ✕
        </button>
      </div>

      <div
        className="flex-grow-1 overflow-auto p-3 bg-light"
        style={{ maxHeight: "calc(100vh - 180px)" }}
      >
        {messages.length === 0 ? (
          <div className="text-center text-muted mt-5">
            <div style={{ fontSize: "3rem" }}>💭</div>
            <p className="mt-3 fw-bold">No messages yet</p>
            <small>Start the conversation!</small>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.userId === socket.id;

            return (
              <div
                key={msg.id}
                className={`mb-3 d-flex ${
                  isOwnMessage ? "justify-content-end" : "justify-content-start"
                }`}
              >
                <div
                  className={`${
                    isOwnMessage ? "bg-primary text-white" : "bg-white border"
                  } rounded-3 p-3 shadow-sm`}
                  style={{ maxWidth: "75%" }}
                >
                  <div className="d-flex align-items-center gap-2 mb-2">
                    {!isOwnMessage && (
                      <span
                        className="badge bg-secondary rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: "28px", height: "28px", fontSize: "12px" }}
                      >
                        {msg.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <small className="fw-bold">
                      {isOwnMessage ? "You" : msg.username}
                    </small>
                  </div>
                  <p className="mb-2" style={{ wordWrap: "break-word", lineHeight: "1.5" }}>
                    {msg.message}
                  </p>
                  <small
                    className={`${
                      isOwnMessage ? "text-white-50" : "text-muted"
                    }`}
                    style={{ fontSize: "0.7rem" }}
                  >
                    {formatTime(msg.timestamp)}
                  </small>
                </div>
              </div>
            );
          })
        )}

        {isTyping.length > 0 && (
          <div className="text-muted fst-italic mb-2">
            <small>
              <span className="spinner-grow spinner-grow-sm me-2"></span>
              {isTyping.join(", ")} {isTyping.length === 1 ? "is" : "are"} typing...
            </small>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-3 bg-white border-top">
        <div className="d-flex gap-2 align-items-stretch">
          <input
            type="text"
            className="form-control"
            placeholder="Type a message..."
            value={inputMessage}
            onChange={(e) => {
              setInputMessage(e.target.value);
              handleTyping();
            }}
            autoFocus
            style={{ flex: 1 }}
          />
          <button
            type="submit"
            className="btn btn-primary px-4"
            disabled={!inputMessage.trim()}
            style={{ minWidth: "80px" }}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

export default Chat;