let capturedImages = [];
let transcribedText = '';

document.addEventListener('DOMContentLoaded', async () => {
  // Load saved images from storage
  const { images } = await chrome.storage.local.get(['images']);
  if (images && images.length > 0) {
    capturedImages = images;
    updateImagesList();
  }

  // Event listeners
  document.getElementById('captureBtn').addEventListener('click', captureScreenshot);
  document.getElementById('clearImages').addEventListener('click', clearImages);
  document.getElementById('transcribeBtn').addEventListener('click', transcribeImages);
  document.getElementById('saveBtn').addEventListener('click', saveDocument);
  document.getElementById('settingsLink').addEventListener('click', openSettings);

  // Load default title from settings
  const { defaultTitle } = await chrome.storage.sync.get(['defaultTitle']);
  if (defaultTitle) {
    document.getElementById('fileTitle').value = defaultTitle;
  }
});

async function captureScreenshot() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Inject content script and start selection
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: startSelection
    });

    showStatus('Select area to capture...', 'info');
    
    // Listen for screenshot data
    chrome.runtime.onMessage.addListener(handleScreenshotMessage);
    
  } catch (error) {
    showStatus('Error: ' + error.message, 'error');
  }
}

function handleScreenshotMessage(message, sender, sendResponse) {
  if (message.type === 'screenshotCaptured') {
    capturedImages.push({
      data: message.data,
      timestamp: Date.now()
    });
    saveImagesToStorage();
    updateImagesList();
    showStatus('Screenshot captured!', 'success');
    
    // Remove listener after handling
    chrome.runtime.onMessage.removeListener(handleScreenshotMessage);
  }
}

function updateImagesList() {
  const imagesList = document.getElementById('imagesList');
  const imageCount = document.getElementById('imageCount');
  const imagesSection = document.getElementById('imagesSection');
  const transcribeSection = document.getElementById('transcribeSection');
  
  imagesList.innerHTML = '';
  imageCount.textContent = capturedImages.length;
  
  if (capturedImages.length > 0) {
    imagesSection.classList.remove('hidden');
    transcribeSection.classList.remove('hidden');
    
    capturedImages.forEach((img, index) => {
      const item = document.createElement('div');
      item.className = 'image-item';
      item.innerHTML = `
        <img src="${img.data}" alt="Screenshot ${index + 1}">
        <span>Screenshot ${index + 1}</span>
        <span class="remove" data-index="${index}">×</span>
      `;
      
      item.querySelector('.remove').addEventListener('click', (e) => {
        removeImage(parseInt(e.target.dataset.index));
      });
      
      imagesList.appendChild(item);
    });
  } else {
    imagesSection.classList.add('hidden');
    transcribeSection.classList.add('hidden');
  }
}

function removeImage(index) {
  capturedImages.splice(index, 1);
  saveImagesToStorage();
  updateImagesList();
}

function clearImages() {
  capturedImages = [];
  saveImagesToStorage();
  updateImagesList();
  document.getElementById('saveSection').classList.add('hidden');
  transcribedText = '';
  showStatus('All images cleared', 'info');
}

async function saveImagesToStorage() {
  await chrome.storage.local.set({ images: capturedImages });
}

async function transcribeImages() {
  if (capturedImages.length === 0) {
    showStatus('No images to transcribe', 'error');
    return;
  }

  const { geminiApiKey } = await chrome.storage.sync.get(['geminiApiKey']);
  
  if (!geminiApiKey) {
    showStatus('Please set Gemini API key in settings', 'error');
    return;
  }

  showStatus('Transcribing images...', 'info');
  document.getElementById('transcribeBtn').disabled = true;

  try {
    // Prepare images for Gemini
    const imageParts = capturedImages.map(img => ({
      inlineData: {
        mimeType: 'image/png',
        data: img.data.split(',')[1] // Remove data:image/png;base64, prefix
      }
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: "Transcribe all text from these images in the exact order they appear. Preserve the original formatting, line breaks, and layout as much as possible. If there are multiple images, transcribe them in sequence, maintaining their order."
              },
              ...imageParts
            ]
          }]
        })
      }
    );

    const data = await response.json();
    
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      transcribedText = data.candidates[0].content.parts[0].text;
      document.getElementById('saveSection').classList.remove('hidden');
      showStatus('Transcription complete!', 'success');
    } else {
      throw new Error('No transcription returned');
    }
    
  } catch (error) {
    showStatus('Transcription failed: ' + error.message, 'error');
  } finally {
    document.getElementById('transcribeBtn').disabled = false;
  }
}

async function saveDocument() {
  const title = document.getElementById('fileTitle').value || 'Untitled Transcription';
  const saveToDrive = document.getElementById('saveToDrive').checked;

  if (!transcribedText) {
    showStatus('No transcribed text to save', 'error');
    return;
  }

  if (saveToDrive) {
    await saveToDriveFile(title);
  } else {
    // Download as text file
    downloadTextFile(title, transcribedText);
    showStatus('File downloaded!', 'success');
  }
}

async function saveToDriveFile(title) {
  showStatus('Saving to Google Drive...', 'info');

  try {
    // Get OAuth token
    const token = await chrome.identity.getAuthToken({ interactive: true });
    
    const { defaultFolderId } = await chrome.storage.sync.get(['defaultFolderId']);

    // Create file metadata
    const metadata = {
      name: `${title}.txt`,
      mimeType: 'text/plain'
    };

    if (defaultFolderId) {
      metadata.parents = [defaultFolderId];
    }

    // Create multipart upload
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: text/plain\r\n\r\n' +
      transcribedText +
      close_delim;

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'multipart/related; boundary=' + boundary
        },
        body: multipartRequestBody
      }
    );

    if (response.ok) {
      const file = await response.json();
      showStatus('Saved to Google Drive!', 'success');
      
      // Optionally clear images after successful save
      const { autoClear } = await chrome.storage.sync.get(['autoClear']);
      if (autoClear) {
        clearImages();
      }
    } else {
      throw new Error('Failed to upload to Drive');
    }
    
  } catch (error) {
    showStatus('Drive save failed: ' + error.message, 'error');
  }
}

function downloadTextFile(title, content) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function openSettings(e) {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
}

function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status ${type}`;
  status.classList.remove('hidden');
  
  if (type === 'success' || type === 'error') {
    setTimeout(() => {
      status.classList.add('hidden');
    }, 3000);
  }
}

// Content script function (injected into page)
function startSelection() {
  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'screenshot-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
    cursor: crosshair;
    z-index: 999999;
  `;

  const selectionBox = document.createElement('div');
  selectionBox.id = 'screenshot-selection';
  selectionBox.style.cssText = `
    position: fixed;
    border: 2px dashed #4285f4;
    background: rgba(66, 133, 244, 0.1);
    z-index: 1000000;
    display: none;
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(selectionBox);

  let startX, startY, isSelecting = false;

  overlay.addEventListener('mousedown', (e) => {
    isSelecting = true;
    startX = e.clientX;
    startY = e.clientY;
    selectionBox.style.left = startX + 'px';
    selectionBox.style.top = startY + 'px';
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';
    selectionBox.style.display = 'block';
  });

  overlay.addEventListener('mousemove', (e) => {
    if (!isSelecting) return;
    
    const currentX = e.clientX;
    const currentY = e.clientY;
    
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    const left = Math.min(currentX, startX);
    const top = Math.min(currentY, startY);
    
    selectionBox.style.width = width + 'px';
    selectionBox.style.height = height + 'px';
    selectionBox.style.left = left + 'px';
    selectionBox.style.top = top + 'px';
  });

  overlay.addEventListener('mouseup', async (e) => {
    if (!isSelecting) return;
    
    const endX = e.clientX;
    const endY = e.clientY;
    
    const rect = {
      x: Math.min(startX, endX),
      y: Math.min(startY, endY),
      width: Math.abs(endX - startX),
      height: Math.abs(endY - startY)
    };

    // Clean up UI
    overlay.remove();
    selectionBox.remove();

    // Capture the selected area
    if (rect.width > 10 && rect.height > 10) {
      chrome.runtime.sendMessage({
        type: 'captureArea',
        rect: rect
      });
    }
  });
}
