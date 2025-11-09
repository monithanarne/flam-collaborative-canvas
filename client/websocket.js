// client/websocket.js
// minimal socket client API used by main.js
let socket = null;

export function initSocket(handlers = {}){
  socket = io(); // assumes /socket.io/socket.io.js is loaded in index.html
  socket.on('connect', ()=> handlers.onConnect?.(socket.id));
  socket.on('draw', (action)=> handlers.onDraw?.(action));
  socket.on('undo', (action)=> handlers.onUndo?.(action));
  socket.on('redo', (action)=> handlers.onRedo?.(action));
  return socket;
}

export function sendDraw(action){
  if(!socket || !socket.connected) { console.warn('socket not connected'); return; }
  socket.emit('draw', action);
}

export function sendUndo(){ if(socket && socket.connected) socket.emit('undo'); }
export function sendRedo(){ if(socket && socket.connected) socket.emit('redo'); }
