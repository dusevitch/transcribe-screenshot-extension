document.addEventListener('DOMContentLoaded', loadSettings);

document.getElementById('saveSettings').addEventListener('click', saveSettings);
document.getElementById('resetSettings').addEventListener('click', resetSettings);

async function loadSettings() {
  const settings = await chrome.storage.sync.get([
    'geminiApiKey',
    'defaultTitle',
    'autoClear'
  ]);

  if (settings.geminiApiKey) {
    document.getElementById('geminiApiKey').value = settings.geminiApiKey;
  }
  if (settings.defaultTitle) {
    document.getElementById('defaultTitle').value = settings.defaultTitle;
  }
  if (settings.autoClear) {
    document.getElementById('autoClear').checked = settings.autoClear;
  }
}

async function saveSettings() {
  const settings = {
    geminiApiKey: document.getElementById('geminiApiKey').value,
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
    document.getElementById('defaultTitle').value = 'Transcription';
    document.getElementById('autoClear').checked = false;

    showStatus('Settings reset to defaults');
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
