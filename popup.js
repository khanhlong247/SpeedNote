document.addEventListener('DOMContentLoaded', function () {
    // Function to inject content script if not already injected
    function injectContentScript(tabId, callback) {
        chrome.tabs.sendMessage(tabId, { action: 'ping' }, function (response) {
            if (chrome.runtime.lastError || !response) {
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['content_script.js']
                }, () => {
                    callback();
                });
            } else {
                callback();
            }
        });
    }

    // Handle Chatbot AI button
    const chatbotButton = document.getElementById('chatbotAI');
    chatbotButton.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            injectContentScript(tabs[0].id, () => {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'createChatBox' });
            });
        });
    });

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
    document.getElementById('addNote').addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            injectContentScript(tabs[0].id, () => {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'addNote' });
            });
        });
    });

    // Handle Saving as Image
    document.getElementById('saveAsImage').addEventListener('click', () => {
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, function (dataUrl) {
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = 'screenshot.png';
            link.click();
        });
    });

    // Handle Saving to Imgur
    document.getElementById('saveToImgur').addEventListener('click', () => {
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, function (dataUrl) {
            uploadToImgur(dataUrl);
        });
    });

    // Upload Image to Imgur
    function uploadToImgur(dataUrl) {
        const CLIENT_ID = '71a5d8103d66642'; // Replace with your Imgur Client ID
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
            };
        });
    });

    // Clear Drawings
    document.getElementById('clearDraw').addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            injectContentScript(tabs[0].id, () => {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'clearDraw' });
            });
        });
    });

    // Clear Notes
    document.getElementById('clearNote').addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            injectContentScript(tabs[0].id, () => {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'clearNote' });
            });
        });
    });

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
