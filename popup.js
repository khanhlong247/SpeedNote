document.addEventListener('DOMContentLoaded', function () {
<<<<<<< HEAD

    // Hàm kiểm tra và chèn content_script nếu chưa được chèn
    function injectContentScript(tabId, callback) {
        chrome.tabs.sendMessage(tabId, { action: 'ping' }, function (response) {
            if (chrome.runtime.lastError || !response) {
                // Content script chưa được chèn, chèn nó
=======
    // Function to inject content script if not already injected
    function injectContentScript(tabId, callback) {
        chrome.tabs.sendMessage(tabId, { action: 'ping' }, function (response) {
            if (chrome.runtime.lastError || !response) {
>>>>>>> 6ba0085 (Update files)
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['content_script.js']
                }, () => {
                    callback();
                });
            } else {
<<<<<<< HEAD
                // Content script đã được chèn
=======
>>>>>>> 6ba0085 (Update files)
                callback();
            }
        });
    }

<<<<<<< HEAD
    // Draw button
    let drawingEnabled = false;
  const drawButton = document.getElementById('draw');

  // Get drawing state from chrome.storage.local when popup opens
  chrome.storage.local.get('drawingEnabled', (result) => {
    drawingEnabled = result.drawingEnabled || false;
    drawButton.textContent = drawingEnabled ? 'Disable Drawing' : 'Enable Drawing';
  });

  drawButton.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      injectContentScript(tabs[0].id, () => {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleDrawing' }, (response) => {
          drawingEnabled = !drawingEnabled;
          chrome.storage.local.set({ drawingEnabled });
          drawButton.textContent = drawingEnabled ? 'Disable Drawing' : 'Enable Drawing';
        });
      });
    });
  });


  let erasingEnabled = false;
  const eraseButton = document.getElementById('toggleErasing');

  // Get erasing state from chrome.storage.local when popup opens
  chrome.storage.local.get('erasingEnabled', (result) => {
    erasingEnabled = result.erasingEnabled || false;
    eraseButton.textContent = erasingEnabled ? 'Disable Erasing' : 'Enable Erasing';
  });

  eraseButton.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      injectContentScript(tabs[0].id, () => {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleErasing' }, (response) => {
          erasingEnabled = !erasingEnabled;
          chrome.storage.local.set({ erasingEnabled });
          eraseButton.textContent = erasingEnabled ? 'Disable Erasing' : 'Enable Erasing';
        });
      });
    });
  });

    // Add Note button
=======
 // Handle Drawing Toggle
let drawingEnabled = false;
const drawButton = document.getElementById('draw');

// Cập nhật icon và chữ cho nút
const updateDrawButton = () => {
    drawButton.innerHTML = drawingEnabled
        ? '<img src="icons/pencil-off.png" alt="Pencil Icon" style="width: 24px; height: 24px; margin: 3px;">  Drawing'
        : '<img src="icons/pencil.png" alt="Pencil Icon" style="width: 24px; height: 24px; margin: 3px;">  Draw';
};

// Lấy trạng thái từ storage
chrome.storage.local.get('drawingEnabled', (result) => {
    drawingEnabled = result.drawingEnabled || false;
    updateDrawButton(); // Cập nhật giao diện nút khi khởi động
});

// Xử lý sự kiện nhấn nút để bật/tắt chế độ vẽ
drawButton.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        injectContentScript(tabs[0].id, () => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleDrawing' }, () => {
                drawingEnabled = !drawingEnabled;
                chrome.storage.local.set({ drawingEnabled });
                updateDrawButton(); // Cập nhật lại nút sau khi thay đổi trạng thái
            });
        });
    });
});

// Handle Erasing Toggle
let erasingEnabled = false;
const eraseButton = document.getElementById('toggleErasing');

// Cập nhật icon và chữ cho nút xóa (tương tự nếu cần)
const updateEraseButton = () => {
    eraseButton.innerHTML = erasingEnabled
        ? '<img src="icons/eraser-off.png" alt="Eraser Icon" style="width: 24px; height: 24px; margin: 3px;"> Eraser'
        : '<img src="icons/eraser-on.png" alt="Eraser Icon" style="width: 24px; height: 24px; margin: 3px;"></i> Eraser';
};

// Lấy trạng thái từ storage cho Erasing
chrome.storage.local.get('erasingEnabled', (result) => {
    erasingEnabled = result.erasingEnabled || false;
    updateEraseButton();
});

eraseButton.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        injectContentScript(tabs[0].id, () => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleErasing' }, () => {
                erasingEnabled = !erasingEnabled;
                chrome.storage.local.set({ erasingEnabled });
                updateEraseButton();
            });
        });
    });
});


    // Handle Adding Note
>>>>>>> 6ba0085 (Update files)
    document.getElementById('addNote').addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            injectContentScript(tabs[0].id, () => {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'addNote' });
            });
        });
    });

<<<<<<< HEAD
    // Nút Lưu Dưới Dạng Ảnh
    document.getElementById('saveAsImage').addEventListener('click', () => {
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, function (dataUrl) {
            if (chrome.runtime.lastError) {
                console.error('Error when take screenshort:', chrome.runtime.lastError.message);
                alert('Error when take screenshort.');
                return;
            }
=======
    // Handle Saving as Image
    document.getElementById('saveAsImage').addEventListener('click', () => {
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, function (dataUrl) {
>>>>>>> 6ba0085 (Update files)
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = 'screenshot.png';
            link.click();
        });
    });

<<<<<<< HEAD
    // Nút Lưu Lên Imgur
    document.getElementById('saveToImgur').addEventListener('click', () => {
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, function (dataUrl) {
            if (chrome.runtime.lastError) {
                console.error('Error when take screenshort:', chrome.runtime.lastError.message);
                alert('Error when take screenshort.');
                return;
            }

            // Gọi hàm tải lên Imgur
=======
    // Handle Saving to Imgur
    document.getElementById('saveToImgur').addEventListener('click', () => {
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, function (dataUrl) {
>>>>>>> 6ba0085 (Update files)
            uploadToImgur(dataUrl);
        });
    });

<<<<<<< HEAD
    function uploadToImgur(dataUrl) {
        const CLIENT_ID = '71a5d8103d66642'; // Thay bằng Client ID của bạn

=======
    // Upload Image to Imgur
    function uploadToImgur(dataUrl) {
        const CLIENT_ID = '71a5d8103d66642'; // Replace with your Imgur Client ID
>>>>>>> 6ba0085 (Update files)
        const formData = new FormData();
        formData.append('image', dataUrl.split(',')[1]);
        formData.append('type', 'base64');

        fetch('https://api.imgur.com/3/image', {
            method: 'POST',
            headers: {
                'Authorization': 'Client-ID ' + CLIENT_ID
            },
            body: formData
        }).then(response => response.json()).then(data => {
            if (data.success) {
                const imgurUrl = data.data.link;
<<<<<<< HEAD
                alert('Note has been posted to Imgur: ' + imgurUrl);
                // Mở ảnh trong tab mới
                chrome.tabs.create({ url: imgurUrl });
            } else {
                console.error('Error when post to Imgur:', data);
                alert('Không thể tải lên Imgur. Vui lòng thử lại.');
            }
        }).catch(error => {
            console.error('Error connect to Imgur:', error);
            alert('Cannot connect to Imgur. Please try again.');
        });
    }

    // Nút Lưu Dưới Dạng PDF
    document.getElementById('saveAsPDF').addEventListener('click', () => {
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, async function (dataUrl) {
            if (chrome.runtime.lastError) {
                console.error('Error when take screenshort:', chrome.runtime.lastError.message);
                alert('Error when take screenshort.');
                return;
            }

            const img = new Image();
            img.src = dataUrl;

            img.onload = async function () {
                const imgWidth = img.width;
                const imgHeight = img.height;

                const { PDFDocument } = PDFLib;
                const pdfDoc = await PDFDocument.create();
                const page = pdfDoc.addPage([imgWidth, imgHeight]);

                const base64Data = dataUrl.split(',')[1];
                const bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

                const pngImage = await pdfDoc.embedPng(bytes);

                page.drawImage(pngImage, {
                    x: 0,
                    y: 0,
                    width: imgWidth,
                    height: imgHeight,
                });

                const pdfBytes = await pdfDoc.save();

                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = url;
                link.download = 'screenshot.pdf';
                link.click();

                URL.revokeObjectURL(url);
=======
                alert('Image uploaded to Imgur: ' + imgurUrl);
                chrome.tabs.create({ url: imgurUrl });
            } else {
                alert('Failed to upload to Imgur.');
            }
        }).catch(() => {
            alert('Error connecting to Imgur.');
        });
    }

    // Handle Saving as PDF
    document.getElementById('saveAsPDF').addEventListener('click', () => {
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, function (dataUrl) {
            const img = new Image();
            img.src = dataUrl;
            img.onload = async function () {
                const { PDFDocument } = PDFLib;
                const pdfDoc = await PDFDocument.create();
                const page = pdfDoc.addPage([img.width, img.height]);
                const pngImage = await pdfDoc.embedPng(dataUrl.split(',')[1]);
                page.drawImage(pngImage, { x: 0, y: 0, width: img.width, height: img.height });
                const pdfBytes = await pdfDoc.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'screenshot.pdf';
                link.click();
                URL.revokeObjectURL(link.href);
>>>>>>> 6ba0085 (Update files)
            };
        });
    });

<<<<<<< HEAD
    // Clear draws
=======
    // Clear Drawings
>>>>>>> 6ba0085 (Update files)
    document.getElementById('clearDraw').addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            injectContentScript(tabs[0].id, () => {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'clearDraw' });
            });
        });
    });

<<<<<<< HEAD
    // Clear notes
=======
    // Clear Notes
>>>>>>> 6ba0085 (Update files)
    document.getElementById('clearNote').addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            injectContentScript(tabs[0].id, () => {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'clearNote' });
            });
        });
    });

<<<<<<< HEAD
    // Clear All
    document.getElementById('clearAll').addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            injectContentScript(tabs[0].id, () => {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'clearAll' });
            });
        });
    });
});
let drawColor = document.getElementById('colorPicker').value;

  // Listen for color picker input change
  document.getElementById('colorPicker').addEventListener('input', (event) => {
    drawColor = event.target.value;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'setDrawColor', color: drawColor });
    });
  });

=======
    // Color Picker
    let drawColor = document.getElementById('colorPicker').value;
    document.getElementById('colorPicker').addEventListener('input', (event) => {
        drawColor = event.target.value;
        chrome.storage.local.set({ drawColor });
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'setDrawColor', color: drawColor });
        });
    });

    // Load saved color on popup load
    chrome.storage.local.get('drawColor', (result) => {
        const savedColor = result.drawColor || '#000000';
        document.getElementById('colorPicker').value = savedColor;
        drawColor = savedColor;
    });

    
    const toggleVisibilityButton = document.getElementById('toggleVisibility');

    toggleVisibilityButton.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleVisibility' });
        });
    });
});
>>>>>>> 6ba0085 (Update files)
