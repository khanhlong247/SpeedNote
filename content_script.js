if (!window.hasRun) {
  window.hasRun = true;

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'toggleDrawing') {
      toggleDrawing();
      sendResponse({ drawingEnabled });
    } else if (message.action === 'addNote') {
      addNote();
    } else if (message.action === 'clearDraw') {
      clearDraw();
    } else if (message.action === 'clearNote') {
      clearNote();
    } else if (message.action === 'clearAll') {
      clearAll();
    } else if (message.action === 'ping') {
      sendResponse({ status: 'alive' });
    }
    else if (message.action === 'toggleErasing') {
      toggleErasing();
      sendResponse({ erasingEnabled });
    }
    else if (message.action === 'setDrawingState') {
      setDrawingState(message.drawingEnabled);
    }
  });

  // Drawing and Erasing State Variables
let drawingEnabled = false;
let erasingEnabled = false;
let drawing = false;
let lastX = 0;
let lastY = 0;
let canvas, ctx, overlay;
let drawings = [];
let drawColor; // Default draw color is black
let cursorCircle; // Circle for cursor in erase mode
let eraseRadius = 20; // Size of eraser
window.addEventListener('scroll', () => {
  resizeCanvas(); // Cập nhật canvas khi người dùng cuộn trang
});
// Drawing Functions
function toggleDrawing() {
  if (erasingEnabled) toggleErasing(); // Turn off erasing if drawing is enabled
  drawingEnabled = !drawingEnabled;

  // Save drawing state in chrome.storage.local
  chrome.storage.local.set({ drawingEnabled });

  drawingEnabled ? enableDrawing() : disableDrawing();
}

function enableDrawing() {
  if (!overlay) {
    createOverlay();
    setupCanvas();
  }
  overlay.style.display = 'block';

  // Thêm sự kiện chuột khi bật chế độ vẽ
  document.addEventListener('mousedown', startDrawing);
  document.addEventListener('mouseup', stopDrawing);
  document.addEventListener('mousemove', draw);
}

function disableDrawing() {
  // Chỉ gỡ bỏ các sự kiện vẽ mà không ẩn overlay
  document.removeEventListener('mousedown', startDrawing);
  document.removeEventListener('mouseup', stopDrawing);
  document.removeEventListener('mousemove', draw);
}



function startDrawing(e) {
  if (erasingEnabled) return;
  drawing = true;
  [lastX, lastY] = [e.clientX + window.scrollX, e.clientY + window.scrollY];
}

function stopDrawing() {
  drawing = false;
}

function draw(e) {
  if (!drawing || erasingEnabled) return;

  const currentX = e.clientX + window.scrollX;
  const currentY = e.clientY + window.scrollY;
  
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(currentX, currentY);
  ctx.strokeStyle = drawColor; // Use selected color
  ctx.lineWidth = 5;
  ctx.stroke();

  drawings.push({ startX: lastX, startY: lastY, endX: currentX, endY: currentY, color: drawColor });
  [lastX, lastY] = [currentX, currentY];
}


function clearDrawings() {
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawings = [];
  }
}

// Erasing Functions
function toggleErasing() {
  if (drawingEnabled) toggleDrawing(); // Turn off drawing if erasing is enabled
  erasingEnabled = !erasingEnabled;

  // Save erasing state in chrome.storage
  chrome.storage.local.set({ erasingEnabled });

  erasingEnabled ? enableErasing() : disableErasing();
}

function enableErasing() {
  createCursorCircle(); // Create cursor circle when erasing is enabled
  document.body.style.cursor = 'none'; // Hide mouse cursor
  document.addEventListener('mousedown', startErasing);
  document.addEventListener('mouseup', stopErasing);
  document.addEventListener('mousemove', erase);
  document.addEventListener('mousemove', moveCursorCircle); // Update cursor circle position
}

function disableErasing() {
  document.body.style.cursor = ''; // Restore mouse cursor
  removeCursorCircle(); // Remove cursor circle when erasing is disabled
  document.removeEventListener('mousedown', startErasing);
  document.removeEventListener('mouseup', stopErasing);
  document.removeEventListener('mousemove', erase);
  document.removeEventListener('mousemove', moveCursorCircle); // Stop moving cursor circle
}

function startErasing(e) {
  if (!erasingEnabled) return;
  drawing = true;
  erase(e);
}

function stopErasing() {
  drawing = false;
}

function erase(e) {
  if (!drawing || !erasingEnabled) return;

  const eraseX = e.clientX + window.scrollX;
  const eraseY = e.clientY + window.scrollY;

  // Check each line for intersection with erase zone
  for (let i = drawings.length - 1; i >= 0; i--) {
    const line = drawings[i];
    if (isLineInEraseZone(line, eraseX, eraseY, eraseRadius)) {
      drawings.splice(i, 1); // Remove line
    }
  }

  redraw(); // Redraw canvas
}

function isLineInEraseZone(line, eraseX, eraseY, eraseRadius) {
  const { startX, startY, endX, endY } = line;

  // Calculate distances from erase point to line endpoints
  const distStart = Math.hypot(eraseX - startX, eraseY - startY);
  const distEnd = Math.hypot(eraseX - endX, eraseY - endY);

  // Check if either endpoint is within erase radius
  if (distStart <= eraseRadius || distEnd <= eraseRadius) {
    return true;
  }

  // Check if line is close to erase point
  const distance = Math.abs((endY - startY) * eraseX - (endX - startX) * eraseY + endX * startY - endY * startX) /
                   Math.sqrt((endY - startY) ** 2 + (endX - startX) ** 2);

  // Check if erase point is between line endpoints
  const isBetweenPoints = (eraseX >= Math.min(startX, endX) && eraseX <= Math.max(startX, endX)) &&
                          (eraseY >= Math.min(startY, endY) && eraseY <= Math.max(startY, endY));

  return distance <= eraseRadius && isBetweenPoints; // Return if within erase zone
}

// Canvas Management Functions
function createOverlay() {
  overlay = document.createElement('div');
  overlay.style.position = 'absolute';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = `${document.documentElement.scrollWidth}px`;
  overlay.style.height = `${document.documentElement.scrollHeight}px`;
  overlay.style.zIndex = '1000';
  overlay.style.pointerEvents = 'auto'; // Change this to 'auto' to receive pointer events
  document.body.appendChild(overlay);
}


function setupCanvas() {
  canvas = document.createElement('canvas');
  canvas.width = document.documentElement.scrollWidth;
  canvas.height = document.documentElement.scrollHeight;
  overlay.appendChild(canvas);
  ctx = canvas.getContext('2d');
}

function setupEventListeners() {
  window.addEventListener('resize', resizeCanvas);
  const observer = new MutationObserver(resizeCanvas);
  observer.observe(document.body, { childList: true, subtree: true });

  document.addEventListener('mousedown', startDrawing);
  document.addEventListener('mouseup', stopDrawing);
  document.addEventListener('mousemove', draw);
}

// Resize and Redraw Functions
function resizeCanvas() {
  if (canvas) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0); // Save current state

    // Update canvas size
    canvas.width = document.documentElement.scrollWidth;
    canvas.height = document.documentElement.scrollHeight;

    // Redraw previous content
    ctx.drawImage(tempCanvas, 0, 0);

    // Redraw all drawings
    redraw();
  }
}

function redraw() {
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
    drawings.forEach(line => {
      ctx.beginPath();
      ctx.moveTo(line.startX, line.startY);
      ctx.lineTo(line.endX, line.endY);
      ctx.strokeStyle = line.color; // Redraw with original colors
      ctx.lineWidth = 5;
      ctx.stroke();
    });
  }
}
function createCursorCircle() {
  cursorCircle = document.createElement('div');
  cursorCircle.style.position = 'absolute';
  cursorCircle.style.width = `${eraseRadius * 2}px`;
  cursorCircle.style.height = `${eraseRadius * 2}px`;
  cursorCircle.style.borderRadius = '50%';
  cursorCircle.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
  cursorCircle.style.pointerEvents = 'none'; // Prevent interference with mouse events
  document.body.appendChild(cursorCircle);
}

function moveCursorCircle(e) {
  const x = e.clientX + window.scrollX - eraseRadius;
  const y = e.clientY + window.scrollY - eraseRadius;
  cursorCircle.style.left = `${x}px`;
  cursorCircle.style.top = `${y}px`;
}

function removeCursorCircle() {
  if (cursorCircle) {
    document.body.removeChild(cursorCircle);
    cursorCircle = null;
  }
}

// Initialize default values
chrome.storage.local.get(['drawingEnabled', 'erasingEnabled'], (data) => {
  drawingEnabled = data.drawingEnabled || false;
  erasingEnabled = data.erasingEnabled || false;

  if (drawingEnabled) {
    enableDrawing();
  }
  if (erasingEnabled) {
    enableErasing();
  }
});

  function addNote() {
    const note = document.createElement('div');
    note.contentEditable = true;
    note.className = 'note';
    note.style.position = 'absolute';
    note.style.top = '100px';
    note.style.left = '100px';
    note.style.width = '200px';
    note.style.height = '150px';
    note.style.backgroundColor = 'rgba(255, 255, 255, 0)';
    note.style.border = '2px solid #ccc';
    note.style.padding = '10px';
    note.style.zIndex = 9999;
    note.style.cursor = 'move';
    note.innerHTML = '';

    let isDragging = false;
    let offsetX, offsetY;

    note.addEventListener('mousedown', (e) => {
      isDragging = true;
      offsetX = e.clientX - note.offsetLeft;
      offsetY = e.clientY - note.offsetTop;
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        note.style.left = `${e.clientX - offsetX}px`;
        note.style.top = `${e.clientY - offsetY}px`;
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });

    document.body.appendChild(note);
  }

  function clearDraw() {
    document.querySelectorAll('#drawingCanvas').forEach(el => el.remove());
  }

  function clearNote() {
    document.querySelectorAll('.note').forEach(el => el.remove());
  }

  function clearAll() {
    clearDraw();
    clearNote();
  }
}
