document.addEventListener('DOMContentLoaded', function () {

    // Hàm kiểm tra và chèn content_script nếu chưa được chèn
    function injectContentScript(tabId, callback) {
        chrome.tabs.sendMessage(tabId, { action: 'ping' }, function (response) {
            if (chrome.runtime.lastError || !response) {
                // Content script chưa được chèn, chèn nó
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['content_script.js']
                }, () => {
                    callback();
                });
            } else {
                // Content script đã được chèn
                callback();
            }
        });
    }

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
    document.getElementById('addNote').addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            injectContentScript(tabs[0].id, () => {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'addNote' });
            });
        });
    });

    // Nút Lưu Dưới Dạng Ảnh
    document.getElementById('saveAsImage').addEventListener('click', () => {
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, function (dataUrl) {
            if (chrome.runtime.lastError) {
                console.error('Error when take screenshort:', chrome.runtime.lastError.message);
                alert('Error when take screenshort.');
                return;
            }
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = 'screenshot.png';
            link.click();
        });
    });

    // Nút Lưu Lên Imgur
    document.getElementById('saveToImgur').addEventListener('click', () => {
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, function (dataUrl) {
            if (chrome.runtime.lastError) {
                console.error('Error when take screenshort:', chrome.runtime.lastError.message);
                alert('Error when take screenshort.');
                return;
            }

            // Gọi hàm tải lên Imgur
            uploadToImgur(dataUrl);
        });
    });

    function uploadToImgur(dataUrl) {
        const CLIENT_ID = '71a5d8103d66642'; // Thay bằng Client ID của bạn

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
            };
        });
    });

    // Clear draws
    document.getElementById('clearDraw').addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            injectContentScript(tabs[0].id, () => {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'clearDraw' });
            });
        });
    });

    // Clear notes
    document.getElementById('clearNote').addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            injectContentScript(tabs[0].id, () => {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'clearNote' });
            });
        });
    });

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

