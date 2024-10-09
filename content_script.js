if (!window.hasRun) {
  window.hasRun = true;

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'toggleDrawing') {
      toggleDrawing();
      sendResponse({ drawingEnabled });
    } else if (message.action === 'addNote') {
      addNote();
    } else if (message.action === 'clearDraw') {
      clearDrawings();
    } else if (message.action === 'clearNote') {
      clearNote();
    } else if (message.action === 'ping') {
      sendResponse({ status: 'alive' });
    } else if (message.action === 'toggleErasing') {
      toggleErasing();
      sendResponse({ erasingEnabled });
    } else if (message.action === 'setDrawColor') {
      drawColor = message.color;
    } else if (message.action === 'setDrawColor') {
      drawColor = message.color; // Update the draw color with the selected color
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
    canvas.style.pointerEvents = 'auto';
    // Thêm sự kiện vào canvas chứ không phải toàn bộ tài liệu
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mousemove', draw);
  }
  
  function disableDrawing() {
    // Chỉ gỡ bỏ sự kiện trên canvas
    canvas.style.pointerEvents = 'none';
    canvas.removeEventListener('mousedown', startDrawing);
    canvas.removeEventListener('mouseup', stopDrawing);
    canvas.removeEventListener('mousemove', draw);
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
    ctx.strokeStyle = drawColor; // Use selected color for drawing
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
  
  let isCanvasVisible = true; // Default is visible

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'toggleVisibility') {
        toggleCanvasVisibility();
    }
    // Other cases...
});

function toggleCanvasVisibility() {
    if (canvas) {
        isCanvasVisible = !isCanvasVisible;
        canvas.style.display = isCanvasVisible ? 'block' : 'none';
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
  
  function createOverlay() {
    overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = `${document.documentElement.scrollWidth}px`;
    overlay.style.height = `${document.documentElement.scrollHeight}px`;
    overlay.style.zIndex = '1000';
    overlay.style.pointerEvents = 'none'; // Không chặn sự kiện chuột trên trang
    document.body.appendChild(overlay);
  }
  
  function setupCanvas() {
    canvas = document.createElement('canvas');
    canvas.width = document.documentElement.scrollWidth;
    canvas.height = document.documentElement.scrollHeight;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none'; // Không chặn sự kiện chuột
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
  // Tạo container chứa ghi chú và nút tùy chọn
  const noteContainer = document.createElement('div');
  noteContainer.classList.add('note-container');
  noteContainer.style.position = 'absolute';
  noteContainer.style.top = `${window.scrollY + 100}px`; 
  noteContainer.style.left = `${window.scrollX + 100}px`;
  noteContainer.style.width = '220px';
  noteContainer.style.height = 'auto';
  noteContainer.style.backgroundColor = 'rgba(255, 255, 255, 0)';
  // noteContainer.style.border = '2px solid #ccc';
  noteContainer.style.padding = '5px';
  noteContainer.style.zIndex = 9999;
  noteContainer.style.resize = 'both';
  noteContainer.style.maxWidth = '90vw';
  noteContainer.style.maxHeight = '90vh';
  noteContainer.style.boxShadow = '0px 0px 5px rgba(0, 0, 0, 1)';

  // Tạo phần chỉnh sửa nội dung
  const noteContent = document.createElement('div');
  noteContent.contentEditable = true;
  noteContent.style.width = '100%';
  noteContent.style.minHeight = '50px';
  noteContent.style.padding = '5px';
  // noteContent.style.border = '1px solid #ddd';
  noteContent.style.boxSizing = 'border-box';

  // Tạo nút mở bảng tùy chọn
  const optionsButton = document.createElement('button');
  optionsButton.innerHTML = '⚙️'; // Nút biểu tượng cài đặt
  optionsButton.style.position = 'absolute';
  optionsButton.style.top = '-10px';
  optionsButton.style.right = '-10px';
  optionsButton.style.cursor = 'pointer';
  optionsButton.style.fontSize = '16px';
  optionsButton.style.backgroundColor = 'transparent';
  optionsButton.style.border = 'none';

  // Tạo bảng tùy chọn màu và xóa
  const optionsMenu = document.createElement('div');
  optionsMenu.style.display = 'none'; // Ẩn bảng ban đầu
  optionsMenu.style.position = 'absolute';
  optionsMenu.style.top = '-80px'; // Đặt bảng sát với note
  optionsMenu.style.left = '0';
  optionsMenu.style.padding = 'opx';
  optionsMenu.style.backgroundColor = '#161B21';
  optionsMenu.style.border = 'none';
  optionsMenu.style.boxShadow = '0px 0px 5px rgba(0, 0, 0, 1)';
  optionsMenu.style.zIndex = 10000;

  // Tạo danh sách 8 màu và màu trắng để xóa nền
  const colors = ['#F0F0F0', '#FFF9C4', '#E3F2FD', '#FFE0B2', '#FCE4EC', '#FFF8E1','#E8F5E9','#EDE7F6', '#FFFFFF'];
  colors.forEach(color => {
      const colorOption = document.createElement('div');
      colorOption.style.backgroundColor = color;
      colorOption.style.width = '25px';
      colorOption.style.height = '25px';
      // colorOption.style.border = '1px solid black'
      colorOption.style.display = 'inline-block';
      colorOption.style.margin = '0px';
      colorOption.style.cursor = 'pointer';

      // Thay đổi màu nền của ghi chú khi chọn màu
      colorOption.addEventListener('click', function() {
          if (color === '#FFFFFF') {
              // Xóa nền, đặt lại màu nền mặc định
              noteContainer.style.backgroundColor = 'transparent';
          } else {
              noteContainer.style.backgroundColor = color;
          }
      });

      optionsMenu.appendChild(colorOption);
  });

  // Tạo nút xóa
  const deleteButton = document.createElement('button');
  deleteButton.innerHTML = 'Delete';
  deleteButton.style.color = '#F4A950';
  deleteButton.style.backgroundColor = '#161B21';
  deleteButton.style.border = 'none';
  deleteButton.style.display = 'block';
  deleteButton.style.marginTop = '10px';
  deleteButton.style.cursor = 'pointer';

  // Thêm sự kiện xóa ghi chú khi nhấn nút xóa
  deleteButton.addEventListener('click', function() {
      noteContainer.remove();
  });

  optionsMenu.appendChild(deleteButton);

  // Thêm sự kiện mở/đóng bảng tùy chọn khi nhấn nút
  optionsButton.addEventListener('click', function() {
      optionsMenu.style.display = optionsMenu.style.display === 'none' ? 'block' : 'none';
  });

  // Thêm nội dung và các nút vào ghi chú
  noteContainer.appendChild(noteContent);
  noteContainer.appendChild(optionsButton);
  noteContainer.appendChild(optionsMenu);

  // Thêm ghi chú vào body
  document.body.appendChild(noteContainer);

  // Kéo thả ghi chú
  let isDragging = false;
  let offsetX, offsetY;

  noteContainer.addEventListener('mousedown', (e) => {
      if (e.target === optionsButton || e.target === optionsMenu) return; // Không kéo khi nhấn vào nút cài đặt
      isDragging = true;
      offsetX = e.clientX - noteContainer.offsetLeft;
      offsetY = e.clientY - noteContainer.offsetTop;
  });

  document.addEventListener('mousemove', (e) => {
      if (isDragging) {
          noteContainer.style.left = `${e.clientX - offsetX}px`;
          noteContainer.style.top = `${e.clientY - offsetY}px`;
      }
  });

  document.addEventListener('mouseup', () => {
      isDragging = false;
  });
}

  function clearDraw() {
    document.querySelectorAll('#drawingCanvas').forEach(el => el.remove());
  }

  function clearNote() {
    document.querySelectorAll('.note-container').forEach(el => el.remove()); // Xóa tất cả ghi chú
  }
  
}
