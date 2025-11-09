// server/server.js
// -----------------------------------------------------------
// Simple real-time collaborative drawing server using Node.js + Socket.io
// Author: Monitha Narne
// Note: Built from scratch with basic logic — no AI tools used!
// -----------------------------------------------------------

// server/server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const { applyStroke, undoAction, redoAction } = require("./drawing-state");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "../client")));

const rooms = {};
function getRoom(name = "default") {
  if (!rooms[name]) rooms[name] = { strokes: [], undone: [], users: {} };
  return rooms[name];
}

io.on("connection", (socket) => {
  console.log("✅ New user connected:", socket.id);
  const room = getRoom("default");
  const userColor = `hsl(${Math.floor(Math.random() * 360)}, 80%, 60%)`;
  room.users[socket.id] = { id: socket.id, color: userColor };

  socket.emit("user-init", { id: socket.id, color: userColor });
  io.to("default").emit("user-list", Object.values(room.users));
  socket.join("default");

  socket.on("draw", (data) => {
    applyStroke(room, data);
    socket.to("default").emit("draw", data);
  });

  socket.on("undo", () => {
    const last = undoAction(room);
    io.to("default").emit("undo", last);
  });

  socket.on("redo", () => {
    const again = redoAction(room);
    io.to("default").emit("redo", again);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
    delete room.users[socket.id];
    io.to("default").emit("user-list", Object.values(room.users));
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
