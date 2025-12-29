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

    // Store directly in chrome.storage
    const { images } = await chrome.storage.local.get(['images']);
    const currentImages = images || [];
    currentImages.push({
      data: croppedImage,
      timestamp: Date.now()
    });
    await chrome.storage.local.set({ images: currentImages });

    // Also send message to popup if it's open
    chrome.runtime.sendMessage({
      type: 'screenshotCaptured',
      data: croppedImage
    }).catch(() => {
      // Popup might be closed, that's okay since we stored it
    });

  } catch (error) {
    console.error('Capture failed:', error);
  }
}

async function cropImage(dataUrl, rect) {
  // Convert data URL to blob
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  // Create ImageBitmap from blob (works in service workers)
  const imageBitmap = await createImageBitmap(blob);

  // Create OffscreenCanvas for cropping
  const canvas = new OffscreenCanvas(rect.width, rect.height);
  const ctx = canvas.getContext('2d');

  // Draw the cropped region
  ctx.drawImage(
    imageBitmap,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    0,
    0,
    rect.width,
    rect.height
  );

  // Convert to blob then to data URL
  const croppedBlob = await canvas.convertToBlob({ type: 'image/png' });
  const reader = new FileReader();

  return new Promise((resolve) => {
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(croppedBlob);
  });
}
