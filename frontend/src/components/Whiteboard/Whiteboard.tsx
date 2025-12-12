import React from "react";
import { Stage, Layer, Line, Circle, Text } from "react-konva";
import { useEffect, useState, useRef } from "react";
import { useUser } from "../../context/UserContext";
import socket from "../../socket/socket";
import jsPDF from "jspdf";
import { useWhiteboardSessions } from "../../hooks/useWhiteboardSessions";
import SessionSidebar from "../SessionSidebar/SessionSidebar";

interface Point { x: number; y: number; }
interface Stroke {
  points: Point[];
  color: string;
  width: number;
}
interface RemoteCursor {
  id: string;
  username?: string;
  x: number;
  y: number;
  color?: string;
}
interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: number;
}

function Whiteboard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { username } = useUser();
  const {
    sessions,
    currentSessionId,
    currentSession,
    saveSession,
    saveChatMessage,
    createNewSession,
    deleteSession,
    switchSession,
    renameSession,
  } = useWhiteboardSessions();

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [lines, setLines] = useState<Stroke[]>([]);
  const [redoLines, setRedoLines] = useState<Stroke[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("black");
  const [brushWidth, setBrushWidth] = useState(2);
  const [cursorPosition, setCursorPosition] = useState<Point | null>(null);
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursor[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userCount, setUserCount] = useState(1);
  const [roomId] = useState("default");
  const [showSidebar, setShowSidebar] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const cursorThrottleRef = useRef<number | null>(null);
  const autoSaveTimeoutRef = useRef<number | null>(null);

  const updateDimensions = () => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
    }
  };

  useEffect(() => {
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    if (currentSession) {
      console.log("📋 Loading session:", currentSession.name);
      console.log("💬 Chat messages:", currentSession.chatMessages?.length || 0);
      setLines(currentSession.strokes || []);
      setMessages(currentSession.chatMessages || []);
      setRedoLines([]);
      setUnreadCount(0);
    }
  }, [currentSessionId, currentSession]);

  useEffect(() => {
    if (showChat && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, showChat]);

  useEffect(() => {
    if (showChat) {
      setUnreadCount(0);
    }
  }, [showChat]);

  useEffect(() => {
    if (!currentSessionId || lines.length === 0) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = window.setTimeout(() => {
      const thumbnail = stageRef.current?.toDataURL({ pixelRatio: 0.2 });
      saveSession(currentSessionId, lines, thumbnail);
      console.log("✅ Auto-saved drawings");
    }, 2000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [lines, currentSessionId, saveSession]);

  useEffect(() => {
    socket.emit("join-room", { roomId, username });

    socket.on("load-drawing", (strokes: Stroke[]) => {
      console.log("Received drawing from server (using local session instead)");
    });

    socket.on("user-joined", (data: { userId: string; username: string; userCount: number }) => {
      setUserCount(data.userCount);
      console.log(`👥 ${data.username} joined. Total users: ${data.userCount}`);
    });

    socket.on("user-left", (data: { userId: string; username: string; userCount: number }) => {
      setUserCount(data.userCount);
      console.log(`👋 ${data.username} left. Total users: ${data.userCount}`);
    });

    socket.on("user-count-updated", (data: { userCount: number }) => {
      setUserCount(data.userCount);
      console.log(`👥 Connected! Total users: ${data.userCount}`);
    });

    return () => {
      socket.off("load-drawing");
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("user-count-updated");
    };
  }, [roomId, username]);

  const handleMouseDown = (e: any) => {
    setIsDrawing(true);
    const pos = e.target.getStage().getPointerPosition();
    if (pos) {
      const newStroke: Stroke = { points: [{ x: pos.x, y: pos.y }], color: brushColor, width: brushWidth };
      setLines([...lines, newStroke]);
      setRedoLines([]);
      socket.emit("draw-start", newStroke);
    }
  };

  const handleMouseMove = (e: any) => {
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    if (!point) return;

    setCursorPosition(point);

    if (cursorThrottleRef.current) {
      clearTimeout(cursorThrottleRef.current);
    }
    cursorThrottleRef.current = window.setTimeout(() => {
      socket.emit("cursor-move", {
        id: socket.id,
        username: username,
        x: point.x,
        y: point.y,
      });
    }, 50);

    if (!isDrawing) return;
    const newLines = [...lines];
    const lastLine = { ...newLines[newLines.length - 1] };
    lastLine.points = [...lastLine.points, { x: point.x, y: point.y }];
    newLines[newLines.length - 1] = lastLine;
    setLines(newLines);
    socket.emit("draw-point", point);
  };

  const handleMouseUp = () => {
    if (isDrawing) socket.emit("draw-end");
    setIsDrawing(false);
  };

  const handleMouseLeave = () => {
    setCursorPosition(null);
    socket.emit("cursor-leave");
    if (isDrawing) socket.emit("draw-end");
    setIsDrawing(false);
  };

  const handleTouchStart = (e: any) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (pos) {
      setIsDrawing(true);
      const newStroke: Stroke = { points: [{ x: pos.x, y: pos.y }], color: brushColor, width: brushWidth };
      setLines([...lines, newStroke]);
      setRedoLines([]);
      socket.emit("draw-start", newStroke);
    }
  };

  const handleTouchMove = (e: any) => {
    if (!isDrawing) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    if (!point) return;

    const newLines = [...lines];
    const lastLine = { ...newLines[newLines.length - 1] };
    lastLine.points = [...lastLine.points, { x: point.x, y: point.y }];
    newLines[newLines.length - 1] = lastLine;
    setLines(newLines);
    socket.emit("draw-point", point);
  };

  const handleTouchEnd = () => {
    if (isDrawing) socket.emit("draw-end");
    setIsDrawing(false);
  };

  const handleUndo = () => {
    if (!lines.length) return;
    const newLines = [...lines];
    const undoneLine = newLines.pop()!;
    setLines(newLines);
    setRedoLines([...redoLines, undoneLine]);
  };

  const handleRedo = () => {
    if (!redoLines.length) return;
    const newRedo = [...redoLines];
    const restoredLine = newRedo.pop()!;
    setRedoLines(newRedo);
    setLines([...lines, restoredLine]);
  };

  const handleClear = () => {
    setLines([]);
    setRedoLines([]);
    socket.emit("clear-drawing");
  };

  const saveWhiteboardAsImage = () => {
    if (!stageRef.current) return;
    const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
    const link = document.createElement("a");
    link.download = `${currentSession?.name || "whiteboard"}.png`;
    link.href = uri;
    link.click();
  };

  const saveWhiteboardAsPDF = () => {
    if (!stageRef.current) return;
    const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
    const width = stageRef.current.width();
    const height = stageRef.current.height();
    const pdf = new jsPDF({
      orientation: width > height ? "landscape" : "portrait",
      unit: "px",
      format: [width, height],
    });
    pdf.addImage(uri, "PNG", 0, 0, width, height);
    pdf.save(`${currentSession?.name || "whiteboard"}.pdf`);
  };

  const generateCursorColor = (id: string) => {
    if (!id || typeof id !== "string") return "#FF6B6B";
    const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F"];
    const index = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const handleSendMessage = (message: string) => {
    if (!message.trim() || !currentSessionId) return;
    
    socket.emit("send-message", { username, message: message.trim() });
    
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random()}`,
      username: username,
      message: message.trim(),
      timestamp: Date.now(),
    };
    
    setMessages((prev) => [...prev, newMessage]);
    saveChatMessage(currentSessionId, newMessage);
  };

  useEffect(() => {
    socket.on("drawing-start", (stroke: Stroke) => setLines((prev) => [...prev, stroke]));

    socket.on("drawing-point", (point: Point) => {
      setLines((prev) => {
        if (!prev.length) return prev;
        const newLines = [...prev];
        const lastLine = { ...newLines[newLines.length - 1] };
        lastLine.points = [...lastLine.points, point];
        newLines[newLines.length - 1] = lastLine;
        return newLines;
      });
    });

    socket.on("drawing-end", () => {});

    socket.on("drawing-cleared", () => {
      setLines([]);
      setRedoLines([]);
    });

    socket.on("cursor-update", (data: { id: string; username?: string; x: number; y: number }) => {
      if (!data || !data.id || typeof data.x !== "number" || typeof data.y !== "number") {
        return;
      }

      setRemoteCursors((prev) => {
        const filtered = prev.filter((c) => c.id !== data.id);
        return [...filtered, { ...data, color: generateCursorColor(data.id) }];
      });
    });

    socket.on("cursor-removed", (id: string) => {
      if (!id) return;
      setRemoteCursors((prev) => prev.filter((c) => c.id !== id));
    });

    socket.on("chat-message", (data: { username: string; message: string }) => {
      if (!currentSessionId) return;
      
      const newMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random()}`,
        username: data.username,
        message: data.message,
        timestamp: Date.now(),
      };
      
      console.log("💬 Received message:", newMessage);
      
      setMessages((prev) => [...prev, newMessage]);
      
      saveChatMessage(currentSessionId, newMessage);
      
      if (!showChat) {
        setUnreadCount((prev) => prev + 1);
      }
    });

    return () => {
      socket.off("drawing-start");
      socket.off("drawing-point");
      socket.off("drawing-end");
      socket.off("drawing-cleared");
      socket.off("cursor-update");
      socket.off("cursor-removed");
      socket.off("chat-message");
    };
  }, [currentSessionId, saveChatMessage, showChat]);

  const handleNewSession = () => {
    if (currentSessionId) {
      const thumbnail = stageRef.current?.toDataURL({ pixelRatio: 0.2 });
      saveSession(currentSessionId, lines, thumbnail);
    }
    createNewSession();
  };

  return (
    <div className="d-flex h-100 w-100">
      {showSidebar && (
        <SessionSidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onCreateNew={handleNewSession}
          onSwitch={switchSession}
          onDelete={deleteSession}
          onRename={renameSession}
        />
      )}

      <div ref={containerRef} className="flex-grow-1 position-relative bg-white">
        <button
          className="btn btn-light position-absolute top-0 start-0 m-2 shadow-sm"
          style={{ zIndex: 11 }}
          onClick={() => setShowSidebar(!showSidebar)}
          title={showSidebar ? "Hide Sessions" : "Show Sessions"}
        >
          {showSidebar ? "◀️" : "▶️"}
        </button>

<div
  className="position-absolute top-0 start-50 translate-middle-x m-2 m-md-3 d-flex flex-wrap gap-1 bg-white shadow-sm rounded p-2"
  style={{ zIndex: 10, maxWidth: "95vw" }}
>
  <div className="badge bg-primary" style={{ height: 32, display: "flex", alignItems: "center", padding: "0 8px", fontSize: "0.85rem" }}>
    👥 {userCount} user{userCount !== 1 ? "s" : ""}
  </div>

  <div className="d-flex gap-1 border-end pe-1">
    <button className={`btn btn-sm ${brushColor === "black" ? "btn-dark" : "btn-outline-dark"}`} onClick={() => setBrushColor("black")} style={{ width: 32, height: 32 }} title="Black" />
    <button className={`btn btn-sm ${brushColor === "red" ? "btn-danger" : "btn-outline-danger"}`} onClick={() => setBrushColor("red")} style={{ width: 32, height: 32 }} title="Red" />
    <button className={`btn btn-sm ${brushColor === "blue" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setBrushColor("blue")} style={{ width: 32, height: 32 }} title="Blue" />
    <button className={`btn btn-sm ${brushColor === "green" ? "btn-success" : "btn-outline-success"}`} onClick={() => setBrushColor("green")} style={{ width: 32, height: 32 }} title="Green" />
  </div>

  <div className="d-flex gap-1">
    <button className={`btn btn-sm ${brushWidth === 2 ? "btn-secondary" : "btn-outline-secondary"}`} onClick={() => setBrushWidth(2)} style={{ width: 32, height: 32 }} title="Small">S</button>
    <button className={`btn btn-sm ${brushWidth === 5 ? "btn-secondary" : "btn-outline-secondary"}`} onClick={() => setBrushWidth(5)} style={{ width: 32, height: 32 }} title="Medium">M</button>
    <button className={`btn btn-sm ${brushWidth === 8 ? "btn-secondary" : "btn-outline-secondary"}`} onClick={() => setBrushWidth(8)} style={{ width: 32, height: 32 }} title="Large">L</button>
  </div>

  <div className="d-flex gap-1 border-start ps-1">
    <button className="btn btn-sm btn-outline-warning" style={{ height: 32, minWidth: 50, padding: "0 8px" }} onClick={handleUndo}>Undo</button>
    <button className="btn btn-sm btn-outline-info" style={{ height: 32, minWidth: 50, padding: "0 8px" }} onClick={handleRedo}>Redo</button>
  </div>

  <button className="btn btn-sm btn-outline-danger" onClick={handleClear} style={{ height: 32, minWidth: 50, padding: "0 8px" }}>Clear</button>
  <button className="btn btn-sm btn-outline-success" onClick={saveWhiteboardAsImage} style={{ height: 32, minWidth: 45, padding: "0 8px" }}>PNG</button>
  <button className="btn btn-sm btn-outline-primary" onClick={saveWhiteboardAsPDF} style={{ height: 32, minWidth: 45, padding: "0 8px" }}>PDF</button>
</div>

        {dimensions.width > 0 && dimensions.height > 0 && (
          <Stage
            ref={stageRef}
            width={dimensions.width}
            height={dimensions.height}
            className="position-absolute top-0 start-0"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Layer>
              {lines.map((line, i) => (
                <Line key={i} points={line.points.flatMap((p) => [p.x, p.y])} stroke={line.color} strokeWidth={line.width} tension={0.5} lineCap="round" lineJoin="round" />
              ))}

              {cursorPosition && (
                <React.Fragment>
                  <Circle x={cursorPosition.x} y={cursorPosition.y} radius={6} fill="rgba(0, 123, 255, 0.5)" stroke="blue" strokeWidth={2} />
                  <Text x={cursorPosition.x + 10} y={cursorPosition.y - 10} text="You" fontSize={12} fill="blue" fontStyle="bold" />
                </React.Fragment>
              )}

              {remoteCursors.map((cursor) => (
                <React.Fragment key={cursor.id}>
                  <Circle x={cursor.x} y={cursor.y} radius={8} fill={cursor.color || "rgba(255, 0, 0, 0.5)"} stroke={cursor.color || "red"} strokeWidth={2} />
                  <Text x={cursor.x + 10} y={cursor.y - 10} text={cursor.username || `User ${cursor.id.substring(0, 4)}`} fontSize={12} fill={cursor.color || "red"} fontStyle="bold" />
                </React.Fragment>
              ))}
            </Layer>
          </Stage>
        )}

        {showChat && (
          <div 
            className="position-absolute bottom-0 end-0 m-3 bg-white border rounded shadow"
            style={{ width: "320px", height: "400px", zIndex: 12, display: "flex", flexDirection: "column" }}
          >
            <div className="bg-primary text-white p-2 d-flex justify-content-between align-items-center">
              <strong>💬 Chat</strong>
              <button className="btn btn-sm btn-light" onClick={() => setShowChat(false)}>✕</button>
            </div>
            
            <div className="flex-grow-1 overflow-auto p-2" style={{ maxHeight: "300px" }}>
              {messages.length === 0 ? (
                <div className="text-center text-muted mt-4">
                  <small>No messages yet. Start chatting!</small>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`mb-2 ${msg.username === username ? "text-end" : ""}`}>
                    <small className="text-muted">{msg.username}:</small>
                    <div className={`text-break p-2 rounded ${msg.username === username ? "bg-primary text-white" : "bg-light"}`}>
                      {msg.message}
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
            
            <div className="p-2 border-top">
              <form onSubmit={(e) => {
                e.preventDefault();
                const input = e.currentTarget.elements.namedItem("chatInput") as HTMLInputElement;
                handleSendMessage(input.value);
                input.value = "";
              }}>
                <div className="input-group">
                  <input 
                    type="text" 
                    name="chatInput"
                    className="form-control" 
                    placeholder="Type a message..." 
                    autoComplete="off"
                  />
                  <button className="btn btn-primary" type="submit">Send</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Whiteboard;