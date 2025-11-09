// client/canvas.js
// Simple reliable canvas drawing with pointer events and small API used by main.js/websocket.js

let canvas, ctx;
let drawing = false;
let last = null;
let brushColor = '#000000';
let brushSize = 3;
let tool = 'brush';
export let committedActions = []; // list of committed strokes (used by websocket replay)

export function setBrush(color, size, t='brush'){
  brushColor = color;
  brushSize = Number(size) || 3;
  tool = t;
}

export function setupCanvas(){
  canvas = document.getElementById('drawCanvas');
  if(!canvas) { console.error('setupCanvas: canvas not found'); return; }
  ctx = canvas.getContext('2d');

  // set canvas pixel size to match CSS size
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  canvas.style.touchAction = 'none';
  canvas.addEventListener('pointerdown', pointerStart);
  canvas.addEventListener('pointermove', pointerMove);
  window.addEventListener('pointerup', pointerEnd);
}

function resizeCanvas(){
  if(!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
  ctx = canvas.getContext('2d');
  ctx.setTransform(1,0,0,1,0,0); // reset transforms
  ctx.scale(1,1);
  // redraw any committed actions
  redrawAll();
}

function getPos(e){
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

let currentAction = null; // collecting points for the stroke

function pointerStart(e){
  drawing = true;
  last = getPos(e);
  currentAction = { id: `a-${Date.now()}`, color: (tool==='eraser'?'#ffffff':brushColor), width: brushSize, tool, points: [last] };
}

function pointerMove(e){
  if(!drawing) return;
  const p = getPos(e);
  drawSegment(last, p, (tool==='eraser'?'#ffffff':brushColor), brushSize);
  currentAction.points.push(p);
  last = p;
}

function pointerEnd(){
  if(!drawing) return;
  drawing = false;
  // commit action to local list and return it via callback (main will send to server)
  if(currentAction && currentAction.points && currentAction.points.length){
    committedActions.push(currentAction);
    // main.js will call sendDraw(action) if wired
    const ev = new CustomEvent('strokeCommitted', { detail: currentAction });
    window.dispatchEvent(ev);
  }
  currentAction = null;
  last = null;
}

function drawSegment(a,b,color,width){
  if(!ctx) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.restore();
}

export function renderStroke(action){
  if(!action || !action.points) return;
  // draw all segments
  for(let i=1;i<action.points.length;i++){
    drawSegment(action.points[i-1], action.points[i], action.color, action.width);
  }
  // save if not already present
  if(!committedActions.find(a=>a.id===action.id)) committedActions.push(action);
}

export function clearAndRedraw(){
  if(!ctx || !canvas) return;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  redrawAll();
}

function redrawAll(){
  if(!ctx) return;
  for(const a of committedActions){
    for(let i=1;i<a.points.length;i++){
      drawSegment(a.points[i-1], a.points[i], a.color, a.width);
    }
  }
}

export function removeActionById(id){
  committedActions = committedActions.filter(a=>a.id !== id);
  clearAndRedraw();
}
