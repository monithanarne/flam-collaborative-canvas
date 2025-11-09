// server/drawing-state.js
function applyStroke(room, action) {
  room.strokes.push(action);
  room.undone = [];
}

function undoAction(room) {
  if (room.strokes.length === 0) return null;
  const last = room.strokes.pop();
  room.undone.push(last);
  return last;
}

function redoAction(room) {
  if (room.undone.length === 0) return null;
  const redo = room.undone.pop();
  room.strokes.push(redo);
  return redo;
}

module.exports = { applyStroke, undoAction, redoAction };
