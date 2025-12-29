chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'captureArea') {
    captureSelectedArea(sender.tab.id, message.rect);
  }
});

async function captureSelectedArea(tabId, rect) {
  try {
    // Capture the entire visible tab
    const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
    
    // Crop the image to the selected area
    const croppedImage = await cropImage(dataUrl, rect);
    
    // Send back to popup
    chrome.runtime.sendMessage({
      type: 'screenshotCaptured',
      data: croppedImage
    });
    
  } catch (error) {
    console.error('Capture failed:', error);
  }
}

function cropImage(dataUrl, rect) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = new OffscreenCanvas(rect.width, rect.height);
      const ctx = canvas.getContext('2d');
      
      // Account for device pixel ratio
      const dpr = window.devicePixelRatio || 1;
      
      ctx.drawImage(
        img,
        rect.x * dpr,
        rect.y * dpr,
        rect.width * dpr,
        rect.height * dpr,
        0,
        0,
        rect.width,
        rect.height
      );
      
      canvas.convertToBlob({ type: 'image/png' }).then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    };
    img.src = dataUrl;
  });
}
