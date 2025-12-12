import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Backend running");
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

interface Stroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
}

interface Room {
  strokes: Stroke[];
  users: Map<string, string>;
  chatHistory: ChatMessage[];
}

const rooms = new Map<string, Room>();

const getRoom = (roomId: string): Room => {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { strokes: [], users: new Map(), chatHistory: [] });
  }
  return rooms.get(roomId)!;
};

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);
  
  let currentRoom: string | null = null;
  let currentUsername: string | null = null;

  socket.on("join-room", (data: { roomId: string; username: string }) => {
    currentRoom = data.roomId || "default";
    currentUsername = data.username || `User_${socket.id.substring(0, 4)}`;
    
    socket.join(currentRoom);
    
    const room = getRoom(currentRoom);
    room.users.set(socket.id, currentUsername);
    
    console.log(`✅ ${currentUsername} joined room: ${currentRoom} (Total users: ${room.users.size})`);
    
    socket.emit("load-drawing", room.strokes);
    socket.emit("load-chat-history", room.chatHistory);
    
    socket.emit("user-count-updated", {
      userCount: room.users.size,
    });
    
    socket.to(currentRoom).emit("user-joined", {
      userId: socket.id,
      username: currentUsername,
      userCount: room.users.size,
    });
  });

  socket.on("draw-start", (stroke: Stroke) => {
    if (!currentRoom) return;
    
    if (!stroke || !stroke.points || !Array.isArray(stroke.points)) {
      console.warn("Invalid stroke data received");
      return;
    }
    
    const room = getRoom(currentRoom);
    room.strokes.push(stroke);
    
    socket.to(currentRoom).emit("drawing-start", stroke);
  });

  socket.on("draw-point", (point: { x: number; y: number }) => {
    if (!currentRoom) return;
    
    if (!point || typeof point.x !== "number" || typeof point.y !== "number") {
      console.warn("Invalid point data received");
      return;
    }
    
    const room = getRoom(currentRoom);
    if (room.strokes.length > 0) {
      const lastStroke = room.strokes[room.strokes.length - 1];
      lastStroke.points.push(point);
    }
    
    socket.to(currentRoom).emit("drawing-point", point);
  });

  socket.on("draw-end", () => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit("drawing-end");
  });

  socket.on("clear-drawing", () => {
    if (!currentRoom) return;
    
    const room = getRoom(currentRoom);
    room.strokes = [];
    
    io.to(currentRoom).emit("drawing-cleared");
  });

  socket.on("chat-send-message", (messageText: string) => {
    if (!currentRoom || !messageText || !messageText.trim()) return;

    const room = getRoom(currentRoom);
    
    console.log(`📝 Sending message - Username: ${currentUsername}, SocketID: ${socket.id}`);
    
    const message: ChatMessage = {
      id: `${socket.id}-${Date.now()}`,
      userId: socket.id,
      username: currentUsername || "Anonymous",
      message: messageText.trim(),
      timestamp: Date.now(),
    };

    room.chatHistory.push(message);

    console.log(`💬 ${message.username}: ${message.message}`);

    io.to(currentRoom).emit("chat-new-message", message);
  });

  socket.on("chat-typing", () => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit("chat-user-typing", {
      userId: socket.id,
      username: currentUsername,
    });
  });

  socket.on("chat-stop-typing", () => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit("chat-user-stopped-typing", {
      userId: socket.id,
    });
  });

  socket.on("cursor-move", (data: { id: string; username?: string; x: number; y: number }) => {
    if (!currentRoom) return;
    
    if (!data || !data.id || typeof data.x !== "number" || typeof data.y !== "number") {
      console.warn("Invalid cursor data received");
      return;
    }
    
    socket.to(currentRoom).emit("cursor-update", {
      id: data.id,
      username: currentUsername || data.username,
      x: data.x,
      y: data.y,
    });
  });

  socket.on("cursor-leave", () => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit("cursor-removed", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
    
    if (currentRoom) {
      const room = getRoom(currentRoom);
      room.users.delete(socket.id);
      
      socket.to(currentRoom).emit("cursor-removed", socket.id);
      socket.to(currentRoom).emit("user-left", {
        userId: socket.id,
        username: currentUsername,
        userCount: room.users.size,
      });
      
      console.log(`❌ ${currentUsername} left room: ${currentRoom} (Remaining users: ${room.users.size})`);
      
      if (room.users.size === 0) {
        rooms.delete(currentRoom);
        console.log(`🗑️ Room ${currentRoom} deleted (empty)`);
      }
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});