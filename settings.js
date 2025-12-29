document.addEventListener('DOMContentLoaded', loadSettings);

document.getElementById('saveSettings').addEventListener('click', saveSettings);
document.getElementById('resetSettings').addEventListener('click', resetSettings);
document.getElementById('connectDrive').addEventListener('click', connectDrive);

async function loadSettings() {
  const settings = await chrome.storage.sync.get([
    'geminiApiKey',
    'defaultFolderId',
    'defaultTitle',
    'autoClear'
  ]);

  if (settings.geminiApiKey) {
    document.getElementById('geminiApiKey').value = settings.geminiApiKey;
  }
  if (settings.defaultFolderId) {
    document.getElementById('defaultFolderId').value = settings.defaultFolderId;
  }
  if (settings.defaultTitle) {
    document.getElementById('defaultTitle').value = settings.defaultTitle;
  }
  if (settings.autoClear) {
    document.getElementById('autoClear').checked = settings.autoClear;
  }

  // Check Drive connection status
  checkDriveConnection();
}

async function saveSettings() {
  const settings = {
    geminiApiKey: document.getElementById('geminiApiKey').value,
    defaultFolderId: document.getElementById('defaultFolderId').value,
    defaultTitle: document.getElementById('defaultTitle').value || 'Transcription',
    autoClear: document.getElementById('autoClear').checked
  };

  await chrome.storage.sync.set(settings);
  
  showStatus('Settings saved successfully!');
}

async function resetSettings() {
  if (confirm('Reset all settings to defaults?')) {
    await chrome.storage.sync.clear();
    await chrome.storage.local.clear();
    
    document.getElementById('geminiApiKey').value = '';
    document.getElementById('defaultFolderId').value = '';
    document.getElementById('defaultTitle').value = 'Transcription';
    document.getElementById('autoClear').checked = false;
    
    showStatus('Settings reset to defaults');
  }
}

async function connectDrive() {
  try {
    const token = await chrome.identity.getAuthToken({ interactive: true });
    if (token) {
      document.getElementById('driveStatus').textContent = 'Connected ✓';
      document.getElementById('driveStatus').style.color = '#137333';
      showStatus('Google Drive connected successfully!');
    }
  } catch (error) {
    document.getElementById('driveStatus').textContent = 'Connection failed';
    document.getElementById('driveStatus').style.color = '#c5221f';
    showStatus('Failed to connect to Google Drive: ' + error.message);
  }
}

async function checkDriveConnection() {
  try {
    const token = await chrome.identity.getAuthToken({ interactive: false });
    if (token) {
      document.getElementById('driveStatus').textContent = 'Connected ✓';
      document.getElementById('driveStatus').style.color = '#137333';
    }
  } catch (error) {
    // Not connected
  }
}

function showStatus(message) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.classList.add('success');
  
  setTimeout(() => {
    status.classList.remove('success');
  }, 3000);
}
