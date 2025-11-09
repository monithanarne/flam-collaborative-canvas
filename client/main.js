// client/main.js
import { initSocket, sendDraw, sendUndo, sendRedo } from './websocket.js';
import { setupCanvas, setBrush, renderStroke, removeActionById } from './canvas.js';

console.log('client loaded — main.js');

document.addEventListener('DOMContentLoaded', () => {
  // UI elements
  const colorPicker = document.getElementById('colorPicker');
  const widthRange = document.getElementById('widthRange');
  const brushBtn = document.getElementById('brushBtn');
  const eraserBtn = document.getElementById('eraserBtn');
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');

  // initialize canvas
  setupCanvas();

  // wire simple UI
  if(colorPicker) colorPicker.addEventListener('input', ()=> setBrush(colorPicker.value, widthRange.value, 'brush'));
  if(widthRange) widthRange.addEventListener('input', ()=> setBrush(colorPicker.value, widthRange.value, 'brush'));
  if(brushBtn) brushBtn.addEventListener('click', ()=> { setBrush(colorPicker.value, widthRange.value, 'brush'); brushBtn.classList.add('active'); eraserBtn.classList.remove('active'); });
  if(eraserBtn) eraserBtn.addEventListener('click', ()=> { setBrush('#ffffff', widthRange.value, 'eraser'); eraserBtn.classList.add('active'); brushBtn.classList.remove('active'); });

  // init socket and handlers
  initSocket({
    onConnect: (id)=> console.log('socket connected', id),
    onDraw: (action)=> { console.log('onDraw action', action && action.id); renderStroke(action); },
    onUndo: (action)=> {
      console.log('onUndo', action && action.id);
      if(action && action.id) removeActionById(action.id);
    },
    onRedo: (action)=> {
      console.log('onRedo', action && action.id);
      if(action) renderStroke(action);
    }
  });

  // when canvas commits a stroke, send to server
  window.addEventListener('strokeCommitted', (e) => {
    const action = e.detail;
    if(action) sendDraw(action);
  });

  if(undoBtn) undoBtn.addEventListener('click', ()=> sendUndo());
  if(redoBtn) redoBtn.addEventListener('click', ()=> sendRedo());
});
