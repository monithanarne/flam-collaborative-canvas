# ARCHITECTURE — Real-Time Collaborative Drawing Canvas

## Overview
This app is a minimal real-time drawing board that synchronizes strokes between connected clients using Socket.io (WebSockets). The server acts as the authoritative event broadcaster and maintains a simple in-memory canvas state.

## Components
- **Client (browser)**: `client/index.html`, `client/canvas.js`, `client/websocket.js`, `client/main.js`
  - Handles pointer events, local rendering, and UI (toolbar + user list).
  - Sends drawing events (strokes) to server and applies incoming strokes.
- **Server (Node.js + Socket.io)**: `server/server.js`, `server/rooms.js`, `server/drawing-state.js`
  - Maintains per-room user list and drawing state.
  - Broadcasts draw/undo/redo events to room participants.

## Data flow (high level)
1. User draws on canvas (pointerdown -> pointermove -> pointerup) → client constructs a `stroke` object (color, width, path points, id, author).
2. Client renders stroke locally (optimistic/predictive UI) and emits `draw` event to server with serialized stroke.
3. Server receives `draw`, calls `applyStroke(room, stroke)` (append to room history) and broadcasts the stroke to other clients in same room (`socket.to(room).emit('draw', stroke)`).
4. Clients receive remote `draw` events and render them via `renderStroke(stroke)`.

## WebSocket protocol (messages)
- `user-init` — server → client: initial assigned id/color and user list.
  - payload: `{ id, color }`
- `user-list` — server → clients: broadcast list of users in room.
  - payload: `[{id, color}, ...]`
- `draw` — client → server: a new stroke created locally.
  - payload: `{ id, author, color, width, points: [{x,y}, ...], timestamp }`
- `draw` — server → clients: broadcast stroke to other clients.
- `undo` — client → server: request to undo last action.
  - payload: `{}` (server chooses last stroke)
- `undo` — server → clients: broadcast last stroke id removed
  - payload: `{ id }`
- `redo` — client → server: request redo
  - payload: `{}` or `{ stroke }`
- `cursor-move` — client → server: user cursor position for live pointer indicator
  - payload: `{ x, y }`
- `cursor-move` — server → clients: broadcast positions

## Undo/Redo strategy (global)
- Server maintains a `strokes[]` array per room (append-only timeline).
- `undoAction(room)` pops the last stroke (if any) into `redoStack`.
- `redoAction(room)` pops from `redoStack` back into `strokes`.
- When undo/redo occurs server emits events to all clients to re-render canvas from the authoritative strokes array.
- **Rationale**: Simple to implement and ensures consistent state across clients.
- **Conflict notes**: If multiple users issue undo simultaneously, server serializes them — users may see other users' actions undone. This is acceptable for demo; production systems would use CRDTs or operation transforms.

## Performance decisions
- **Serialized strokes**: points are sent as arrays of small `{x,y}` objects. For heavy traffic you can batch points or compress with delta encoding.
- **Client rendering**: immediate local rendering (optimistic UI) then server broadcast ensures smooth UX.
- **Redraw strategy**: on undo/redo the client clears canvas and redraws the `strokes[]` timeline. This is simpler and fast enough for demo-sized canvases.

## Conflict resolution
- Server authoritative timeline reduces divergence.
- Each operation (draw/undo/redo) is applied in server order, then broadcast.
- For production-scale concurrency, add per-stroke vector clocks, locking, or operational transforms.

## Scale & improvement ideas
- Persist strokes using a DB (e.g., Redis or MongoDB) for session restore.
- Use binary formats or protobuf for stroke payloads to reduce bandwidth.
- Implement optimistic merging per user to reduce undo collisions.
- Offload rendering heavy work to Web Worker or use OffscreenCanvas.
