let capturedImages = [];
let transcribedHTML = '';

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
  document.getElementById('copyBtn').addEventListener('click', copyToClipboard);
  document.getElementById('downloadBtn').addEventListener('click', downloadDocument);
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

function handleScreenshotMessage(message) {
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
  document.getElementById('resultSection').classList.add('hidden');
  transcribedHTML = '';
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
                text: "Transcribe all text from these images in the exact order they appear. Your output should be formatted in HTML with proper semantic tags. Use the following guidelines:\n\n1. Use <strong> for bold text, <em> for italics\n2. Use <ul> and <li> for bullet points, <ol> and <li> for numbered lists\n3. Use <table>, <tr>, <th>, and <td> for tables with proper borders\n4. Use <hr> for horizontal lines/dividers\n5. Use <p> tags to separate paragraphs\n6. Preserve colors using inline styles like <span style=\"color: #FF0000\">text</span> when visible\n7. Maintain the original formatting, structure, and hierarchy\n8. If there are multiple images, transcribe them in sequence\n\nProvide ONLY the HTML content without wrapping it in <html>, <body>, or ```html tags. Start directly with the content."
              },
              ...imageParts
            ]
          }]
        })
      }
    );

    const data = await response.json();

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      transcribedHTML = data.candidates[0].content.parts[0].text;

      // Clean up HTML if Gemini wrapped it in code blocks
      transcribedHTML = transcribedHTML.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

      // Display in the output div
      document.getElementById('transcriptionOutput').innerHTML = transcribedHTML;
      document.getElementById('resultSection').classList.remove('hidden');
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

async function copyToClipboard() {
  const outputDiv = document.getElementById('transcriptionOutput');

  try {
    // Create a temporary div to hold the content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = outputDiv.innerHTML;
    document.body.appendChild(tempDiv);

    // Select the content
    const range = document.createRange();
    range.selectNodeContents(tempDiv);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    // Use the Clipboard API with HTML support
    const htmlBlob = new Blob([outputDiv.innerHTML], { type: 'text/html' });
    const textBlob = new Blob([outputDiv.innerText], { type: 'text/plain' });

    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': htmlBlob,
        'text/plain': textBlob
      })
    ]);

    // Clean up
    document.body.removeChild(tempDiv);
    selection.removeAllRanges();

    showStatus('Copied to clipboard with formatting!', 'success');
  } catch (error) {
    // Fallback to plain text copy
    try {
      await navigator.clipboard.writeText(outputDiv.innerText);
      showStatus('Copied as plain text', 'success');
    } catch (err) {
      showStatus('Copy failed: ' + err.message, 'error');
    }
  }
}

async function downloadDocument() {
  const title = document.getElementById('fileTitle').value || 'Untitled Transcription';
  const format = document.getElementById('fileFormat').value;
  const outputDiv = document.getElementById('transcriptionOutput');

  if (!transcribedHTML) {
    showStatus('No transcribed text to download', 'error');
    return;
  }

  showStatus(`Generating ${format.toUpperCase()} file...`, 'info');

  try {
    switch (format) {
      case 'html':
        downloadHTML(title, transcribedHTML);
        break;
      case 'txt':
        downloadPlainText(title, outputDiv.innerText);
        break;
      case 'docx':
        await downloadDOCX(title, outputDiv);
        break;
      case 'pdf':
        await downloadPDF(title, outputDiv);
        break;
    }
    showStatus('File downloaded!', 'success');
  } catch (error) {
    showStatus('Download failed: ' + error.message, 'error');
  }
}

function downloadHTML(title, content) {
  const fullHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
    }
    table { border-collapse: collapse; width: 100%; margin: 10px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f8f9fa; font-weight: 600; }
    hr { border: none; border-top: 1px solid #ddd; margin: 12px 0; }
  </style>
</head>
<body>
${content}
</body>
</html>`;

  downloadFile(title + '.html', fullHTML, 'text/html');
}

function downloadPlainText(title, content) {
  downloadFile(title + '.txt', content, 'text/plain');
}

async function downloadDOCX(title, outputDiv) {
  try {
    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType } = docx;

    // Convert HTML to docx elements
    const children = htmlToDocxElements(outputDiv);

    const doc = new Document({
      sections: [{
        properties: {},
        children: children
      }]
    });

    const blob = await Packer.toBlob(doc);
    downloadBlob(title + '.docx', blob);
  } catch (error) {
    throw new Error('DOCX generation failed. Library may not be loaded.');
  }
}

function htmlToDocxElements(element) {
  const { Paragraph, TextRun } = docx;
  const elements = [];

  // Simple conversion - can be enhanced
  const text = element.innerText;
  const lines = text.split('\n');

  lines.forEach(line => {
    if (line.trim()) {
      elements.push(new Paragraph({
        children: [new TextRun(line)]
      }));
    }
  });

  return elements.length > 0 ? elements : [new Paragraph({ children: [new TextRun('')] })];
}

async function downloadPDF(title, outputDiv) {
  try {
    const { jsPDF } = window.jspdf;
    const canvas = await html2canvas(outputDiv, {
      scale: 2,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(title + '.pdf');
  } catch (error) {
    throw new Error('PDF generation failed. Library may not be loaded.');
  }
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(filename, blob);
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
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
