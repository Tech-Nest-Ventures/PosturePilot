# GitHub Release Setup Guide

This guide explains how to set up automated builds and releases for PosturePilot on GitHub.

## Overview

The project includes a GitHub Actions workflow that automatically builds the app for macOS, Windows, and Linux when you create a release tag. The macOS builds are also notarized for distribution outside the App Store.

## Prerequisites

1. A GitHub repository for PosturePilot
2. Apple Developer account (for macOS notarization)
3. Code signing certificates (optional but recommended)

## Setting Up GitHub Secrets

To enable automated builds and notarization, you need to configure the following secrets in your GitHub repository:

### For macOS Notarization

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add the following:

#### Required Secrets:

- **`APPLE_ID`**: Your Apple ID email address (e.g., `your.email@example.com`)
- **`APPLE_APP_SPECIFIC_PASSWORD`**: An app-specific password for your Apple ID
  - Generate this at: https://appleid.apple.com/account/manage
  - Click "Generate Password" under "App-Specific Passwords"
  - Give it a name like "GitHub Actions Notarization"
- **`APPLE_TEAM_ID`**: Your Apple Developer Team ID (e.g., `3Y4F3KTSJA`)
  - Find this in your Apple Developer account: https://developer.apple.com/account

#### Optional (for Code Signing):

- **`MACOS_CERTIFICATE`**: Base64-encoded .p12 certificate file
  - Export your Developer ID Application certificate from Keychain Access
  - Convert to base64: `base64 -i certificate.p12 | pbcopy`
- **`MACOS_CERTIFICATE_PASSWORD`**: Password for the .p12 certificate

### For Windows Code Signing (Optional)

- **`WINDOWS_CERTIFICATE`**: Base64-encoded code signing certificate
- **`WINDOWS_CERTIFICATE_PASSWORD`**: Password for the certificate

## Creating a Release

### Method 1: Using Git Tags (Recommended)

1. Update the version in `package.json` if needed
2. Commit your changes
3. Create and push a tag:
   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```
4. The GitHub Actions workflow will automatically:
   - Build for all platforms (macOS, Windows, Linux)
   - Notarize macOS builds
   - Create a GitHub release with all artifacts

### Method 2: Using GitHub UI

1. Go to your repository on GitHub
2. Click **Releases** → **Draft a new release**
3. Create a new tag (e.g., `v1.0.0`)
4. Fill in the release title and description
5. Click **Publish release**
6. The workflow will trigger automatically

### Method 3: Manual Workflow Dispatch

1. Go to **Actions** tab in your repository
2. Select **Build and Release** workflow
3. Click **Run workflow**
4. Enter the version number
5. Click **Run workflow**

## Build Artifacts

After the workflow completes, you'll find:

### macOS
- `PosturePilot-{version}-arm64.dmg` - Apple Silicon Macs
- `PosturePilot-{version}-x64.dmg` - Intel Macs
- `PosturePilot-{version}-arm64-mac.zip` - Apple Silicon (ZIP)
- `PosturePilot-{version}-x64-mac.zip` - Intel (ZIP)

All macOS builds are notarized and ready for distribution.

### Windows
- `PosturePilot Setup {version}.exe` - Installer (x64 and ia32)
- `PosturePilot-{version}.exe` - Portable version (x64)

### Linux
- `PosturePilot-{version}.AppImage` - AppImage format

## Troubleshooting

### macOS Notarization Fails

1. **Check Apple ID credentials**: Ensure `APPLE_ID` and `APPLE_APP_SPECIFIC_PASSWORD` are correct
2. **Verify Team ID**: Make sure `APPLE_TEAM_ID` matches your Apple Developer account
3. **Check certificate**: If using code signing, verify the certificate is valid and not expired
4. **Review logs**: Check the GitHub Actions logs for specific error messages

### Build Fails

1. **Check Node.js version**: The workflow uses Node.js 20
2. **Verify dependencies**: Run `npm ci` locally to ensure dependencies install correctly
3. **Check file paths**: Ensure all referenced files exist in the repository

### Code Signing Issues

- **macOS**: Make sure your certificate is exported as a .p12 file and base64-encoded correctly
- **Windows**: Ensure you have a valid code signing certificate

## Local Testing

You can test builds locally before pushing:

```bash
# macOS
npm run dist:mac

# Windows (on Windows machine)
npm run dist:win

# Linux (on Linux machine)
npm run dist:linux

# All platforms (if you have access to all)
npm run dist:all
```

## Notes

- Notarization can take 5-15 minutes after the build completes
- The workflow will wait for notarization to complete before creating the release
- If notarization fails, the build will still be created but won't be notarized
- For App Store distribution, use the `dist:mas` script instead

