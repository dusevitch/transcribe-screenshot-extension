# Privacy Policy for Transcribe Screenshot Extension

**Last Updated:** December 29, 2025

## Overview

Transcribe Screenshot Extension is committed to protecting your privacy. This privacy policy explains how the extension handles your data.

## Data Collection and Storage

### What Data is Collected

The extension collects and stores the following data **locally on your device only**:

1. **Gemini API Key** - Your Google Gemini API key (stored in encrypted Chrome sync storage)
2. **Screenshots** - Images you capture using the extension (temporarily stored in local storage)
3. **Transcriptions** - AI-generated text from your screenshots (stored in local storage)
4. **Settings** - Your preferences including default document title and auto-clear options (stored in local storage)

### Where Data is Stored

- **Chrome Storage API**: All data is stored locally on your device using Chrome's built-in storage system
- **Chrome Sync Storage**: Only your API key is stored in sync storage (encrypted by Chrome)
- **No External Servers**: We do not store any of your data on external servers or databases

## Data Transmission

### Google Gemini API

When you click "Transcribe All Images":
- Your captured screenshots are sent to **Google's Gemini API** for transcription
- The API key you provide is used to authenticate these requests
- This is the **only external service** the extension communicates with
- Google's privacy policy applies to data sent to their API: https://policies.google.com/privacy

### No Other External Communication

- The extension does **not** send data to any other third-party services
- No analytics or tracking data is collected
- No usage statistics are transmitted
- No personal information is shared with us or anyone else

## Data Usage

Your data is used exclusively for:
1. **Screenshot Capture** - Displaying captured images in the extension
2. **AI Transcription** - Sending images to Gemini API for text extraction
3. **Export Functions** - Creating downloadable files (DOCX, HTML, PDF, TXT, ZIP)
4. **Settings Persistence** - Remembering your preferences across sessions

## Data Retention

- **Screenshots and Transcriptions**: Stored locally until you manually clear them using the "Clear All Screenshots" button or close the extension popup
- **API Key**: Stored indefinitely in Chrome sync storage until you manually remove it from settings
- **Settings**: Stored indefinitely until you change or clear them

## Data Control

You have full control over your data:

- **Clear Screenshots**: Click "Clear All Screenshots" to remove all captured images and transcriptions
- **Remove API Key**: Go to Settings and delete your API key
- **Uninstall Extension**: Removes all locally stored data from your device

## Permissions Explained

The extension requests the following permissions:

- **activeTab**: Required to capture screenshots of the current browser tab
- **storage**: Required to save your API key, settings, and captured images locally
- **tabs**: Required to interact with browser tabs for screenshot functionality
- **scripting**: Required to inject the screenshot selection overlay
- **host_permissions (generativelanguage.googleapis.com)**: Required to communicate with Google's Gemini API

## Third-Party Services

The only third-party service used is:

- **Google Gemini API** - For AI-powered text transcription from images
- Privacy Policy: https://policies.google.com/privacy
- Your use of this API is subject to Google's terms and policies

## Children's Privacy

This extension is not directed at children under the age of 13. We do not knowingly collect personal information from children.

## Changes to This Policy

We may update this privacy policy from time to time. Any changes will be reflected in the extension's repository with an updated "Last Updated" date.

## Open Source

This extension is open source. You can review the complete source code to verify our privacy practices:
- GitHub Repository: https://github.com/dusevitch/transcribe-screenshot-extension

## Contact

For questions or concerns about privacy:
- Create an issue on our GitHub repository
- Review the source code to verify data handling practices

## Your Consent

By using Transcribe Screenshot Extension, you consent to this privacy policy.

## Summary

**In plain English:**
- We don't collect any of your data - everything stays on your computer
- The only external service is Google's Gemini API (which you provide your own key for)
- You can delete all your data anytime by clearing screenshots or uninstalling
- We don't track you, analyze you, or send your data anywhere except Google's API when you explicitly click "Transcribe"
