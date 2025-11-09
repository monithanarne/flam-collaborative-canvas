// server/rooms.js
// Simple in-memory room management (single default room)
// Exports: initRoom(roomId) and getRoom(roomId)

const rooms = {};

function initRoom(roomId = 'default') {
  if (!rooms[roomId]) {
    rooms[roomId] = {
      id: roomId,
      users: {},
      strokes: [],
      undone: []
    };
  }
  return rooms[roomId];
}

function getRoom(roomId = 'default') {
  return rooms[roomId];
}

module.exports = { initRoom, getRoom };
