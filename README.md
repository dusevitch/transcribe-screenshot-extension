# Transcribe Images Extension

A Chrome extension that captures screenshots with area selection, transcribes text using Google's Gemini AI, and optionally saves to Google Drive.

## Features

- 📸 **Area Selection Screenshot** - Click and drag to select specific regions
- 🔄 **Multiple Screenshots** - Capture and queue multiple images
- ✨ **AI Transcription** - Uses Gemini 1.5 Flash for accurate OCR
- 📝 **Order Preservation** - Transcribes images in the exact order captured
- 💾 **Flexible Saving** - Save to Google Drive or download as text file
- ⚙️ **Customizable** - Set default titles, folders, and auto-clear options

## Installation

### Step 1: Get Google OAuth Credentials (Required for Google Drive)

**Note**: Each user must create their own OAuth credentials. This is a one-time setup.

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (name it anything, e.g., "My Transcribe Extension")
3. Enable the **Google Drive API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click "Enable"
4. Configure OAuth consent screen:
   - Go to "APIs & Services" > "OAuth consent screen"
   - Select "External" user type
   - Fill in app name (e.g., "Transcribe Images Extension")
   - Add your email as developer contact
   - Click "Save and Continue"
   - On Scopes page, click "Save and Continue" (we'll use default scopes)
   - Add yourself as a test user
   - Click "Save and Continue"
5. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Chrome Extension" as the application type
   - Enter a name (e.g., "Transcribe Extension Client")
   - For "Item ID", you can leave blank initially (you'll add it after loading the extension)
   - Click "Create"
   - Copy the **Client ID** (format: `xxxxx.apps.googleusercontent.com`)
6. Update `manifest.json`:
   - Open `manifest.json` in a text editor
   - Find line 29: `"client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com"`
   - Replace `YOUR_CLIENT_ID` with your actual Client ID
   - Save the file

### Step 2: Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the API key (you'll enter this in extension settings)

### Step 3: Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `transcribe-images-extension` folder
5. The extension should now appear in your extensions list

### Step 4: Configure Extension

1. Click the extension icon in Chrome toolbar
2. Click "⚙️ Settings" at the bottom
3. Enter your **Gemini API Key**
4. Click "Connect Google Drive" (optional, only needed if saving to Drive)
5. (Optional) Set a default folder ID for Drive saves
6. Click "Save Settings"

## Usage

### Basic Workflow

1. **Capture Screenshots**
   - Click the extension icon
   - Click "📸 Capture Screenshot"
   - Click and drag on the page to select an area
   - Repeat for multiple screenshots (they'll be numbered in order)

2. **Transcribe**
   - After capturing all needed screenshots
   - Click "✨ Transcribe with Gemini"
   - Wait for AI processing (usually a few seconds)

3. **Save**
   - Enter a document title
   - Check "Save to Google Drive" if desired (otherwise downloads as .txt)
   - Click "💾 Save"

### Tips

- **Multiple Screenshots**: The extension preserves the exact order you capture images
- **Remove Screenshots**: Click the "×" next to any screenshot to remove it
- **Clear All**: Use "Clear All" to start over
- **Auto-Clear**: Enable in settings to automatically clear images after saving

## Finding Google Drive Folder ID

If you want saves to go to a specific Drive folder:

1. Open Google Drive in your browser
2. Navigate to the desired folder
3. Right-click the folder and select "Share"
4. Copy the folder ID from the URL (e.g., `https://drive.google.com/drive/folders/FOLDER_ID_HERE`)
5. Paste this ID in the extension settings

## Settings Options

| Setting | Description |
|---------|-------------|
| **Gemini API Key** | Required for OCR transcription |
| **Google Drive Connection** | Required only if saving to Drive |
| **Default Folder ID** | Optional - saves to specific folder instead of root |
| **Default Document Title** | Pre-fills the title field |
| **Auto-clear images** | Clears captured screenshots after successful save |

## Troubleshooting

### "Please set Gemini API key in settings"
- Go to Settings and enter your Gemini API key
- Make sure you copied the entire key from Google AI Studio

### "Drive save failed"
- Click "Connect Google Drive" in settings
- Make sure you granted the extension Drive permissions
- Check that the folder ID (if provided) is correct

### Screenshot capture not working
- Make sure you have permission to access the current tab
- Some browser pages (like chrome://) cannot be captured
- Try refreshing the page and trying again

### Transcription errors
- Ensure images contain clear, readable text
- Very large images may take longer to process
- Check your Gemini API quota hasn't been exceeded

## Privacy & Data

- Screenshots are stored locally in Chrome until transcribed
- Images are sent to Google's Gemini API for transcription
- No data is stored on external servers (except Google Drive if you choose)
- You can clear all data anytime via the "Reset to Defaults" button

## API Costs

- **Gemini API**: Free tier includes generous limits
  - Check [Google AI pricing](https://ai.google.dev/pricing) for current rates
- **Google Drive API**: Free for normal usage

## Support

For issues or feature requests, please check:
- Your API keys are correctly entered
- Google Drive permissions are granted
- Extension has permission to access the current tab

## Version

Current version: 1.0.0

## License

This extension is provided as-is for personal use.
