# PosturePilot - Apple App Store Submission Guide 🚀

This guide will walk you through getting PosturePilot published on the macOS App Store. Since you're using Electron, there are some specific requirements and configurations needed.

## Prerequisites Checklist

- [X] Apple Developer Account ($99/year)
- [X] macOS with Xcode installed
- [ ] Code signing certificates
- [ ] App Store Connect access
- [ ] App icons in required sizes
- [ ] Privacy policy URL (required for camera access)

---

## Step 1: Apple Developer Account Setup

1. **Enroll in Apple Developer Program**
   - Go to [developer.apple.com](https://developer.apple.com)
   - Click "Enroll" and pay the $99/year fee
   - Complete the enrollment process (can take 24-48 hours)

2. **Access App Store Connect**
   - Once enrolled, go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
   - Sign in with your Apple ID

---

## Step 2: Prepare Your App for Mac App Store

### 2.1 Update package.json for Mac App Store

Your current `package.json` needs some additions for Mac App Store compatibility. Here's what needs to be added:

```json
{
  "build": {
    "mac": {
      "category": "public.app-category.healthcare-fitness",
      "icon": "src/assets/icon.png",
      "target": [
        {
          "target": "mas",
          "arch": ["arm64", "x64"]
        }
      ],
      "hardenedRuntime": true,
      "gatekeeperAssess": false,
      "entitlements": "build/entitlements.mas.plist",
      "entitlementsInherit": "build/entitlements.mas.inherit.plist",
      "extendInfo": {
        "NSCameraUsageDescription": "PosturePilot needs access to your camera to monitor your posture in real-time.",
        "NSMicrophoneUsageDescription": "PosturePilot does not use the microphone but some camera APIs require this permission"
      }
    }
  }
}
```

### 2.2 Create Entitlements Files

You'll need two entitlements files for Mac App Store:

**`build/entitlements.mas.plist`** (Main app entitlements):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.app-sandbox</key>
  <true/>
  <key>com.apple.security.application-groups</key>
  <array>
    <string>com.posturepilot.app</string>
  </array>
  <key>com.apple.security.device.camera</key>
  <true/>
  <key>com.apple.security.files.user-selected.read-write</key>
  <true/>
</dict>
</plist>
```

**`build/entitlements.mas.inherit.plist`** (Helper app entitlements):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.app-sandbox</key>
  <true/>
  <key>com.apple.security.inherit</key>
  <true/>
  <key>com.apple.security.device.camera</key>
  <true/>
</dict>
</plist>
```

### 2.3 Update electron-builder Configuration

Install additional dependencies:
```bash
npm install --save-dev electron-builder electron-notarize
```

---

## Step 3: Code Signing Setup

### 3.1 Create Certificates in Xcode

1. Open **Xcode**
2. Go to **Xcode → Settings → Accounts**
3. Add your Apple ID
4. Click **Manage Certificates**
5. Click **+** and select:
   - **Mac App Distribution** (for App Store)
   - **Developer ID Application** (for outside App Store, optional)

### 3.2 Export Certificates

1. Open **Keychain Access**
2. Find your certificates
3. Export them (you'll need the private key)
4. Keep these secure - you'll need them for CI/CD later

### 3.3 Configure Code Signing in package.json

Add to your `package.json` build config:

```json
{
  "build": {
    "mac": {
      "identity": "3rd Party Mac Developer Application: Your Name (TEAM_ID)"
    }
  }
}
```

Or use environment variables:
```bash
export APPLE_ID="your@email.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="YOUR_TEAM_ID"
```

---

## Step 4: App Store Connect Setup

### 4.1 Create Your App

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **My Apps** → **+** → **New App**
3. Fill in:
   - **Platform**: macOS
   - **Name**: PosturePilot
   - **Primary Language**: English
   - **Bundle ID**: `com.posturepilot.app` (must match your package.json)
   - **SKU**: `posturepilot-001` (unique identifier)
   - **User Access**: Full Access

### 4.2 App Information

Fill out:
- **Category**: Health & Fitness
- **Subcategory**: (optional)
- **Privacy Policy URL**: (required - see Step 5)
- **Support URL**: Your website or GitHub
- **Marketing URL**: (optional)

### 4.3 Pricing and Availability

- Set price (Free or Paid)
- Select countries/regions
- Set availability date

---

## Step 5: Required Materials

### 5.1 Privacy Policy (REQUIRED)

Since your app uses the camera, Apple requires a privacy policy. Create one that covers:

- What data you collect (camera access)
- How you use it (real-time posture analysis)
- Data storage (local only)
- Data sharing (none)

**Example Privacy Policy URL**: Host on GitHub Pages, your website, or a service like [PrivacyPolicyGenerator](https://www.privacypolicygenerator.info/)

### 5.2 App Icons

You need icons in these sizes:
- 16x16, 32x32, 64x64, 128x128, 256x256, 512x512, 1024x1024

Your current icon setup should work, but verify all sizes exist.

### 5.3 Screenshots

Required screenshots for Mac App Store:
- **1280 x 800** (minimum)
- **2560 x 1600** (recommended)
- **2880 x 1800** (for Retina displays)

Take screenshots showing:
1. Setup/calibration screen
2. Monitoring screen with good posture
3. Metrics panel
4. Alert/notification example

### 5.4 App Preview Video (Optional but Recommended)

- 15-30 seconds
- Shows app in action
- 1920 x 1080 or higher

### 5.5 Description

Write compelling copy:
- **Subtitle**: 30 characters max
- **Description**: Up to 4000 characters
- **Keywords**: Up to 100 characters (comma-separated)
- **Promotional Text**: 170 characters (can be updated without review)

**Example Description**:
```
PosturePilot is your AI-powered posture coach that helps you maintain healthy ergonomic alignment while working at your computer.

FEATURES:
• Real-time posture monitoring using advanced pose detection
• Instant visual feedback with color-coded status indicators
• Smart alerts when your posture needs adjustment
• Tracks forward head position, neck tilt, and shoulder alignment
• Auto-calibration adapts to your unique setup
• All processing happens locally - your privacy is protected

Perfect for remote workers, students, and anyone who spends long hours at a desk.
```

---

## Step 6: Build and Submit

### 6.1 Update Build Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "build:mas": "electron-builder --mac mas",
    "build:mas:dir": "electron-builder --mac mas --dir",
    "dist:mas": "electron-builder --mac mas --publish=never"
  }
}
```

### 6.2 Build for Mac App Store

```bash
npm run build:mas
```

This creates a `.pkg` file in the `dist` folder.

### 6.3 Upload to App Store Connect

**Option A: Using Transporter App** (Easiest)
1. Download **Transporter** from Mac App Store
2. Drag your `.pkg` file into Transporter
3. Click **Deliver**

**Option B: Using Xcode**
1. Open **Xcode**
2. **Window → Organizer**
3. Click **Distribute App**
4. Select **App Store Connect**
5. Follow the wizard

**Option C: Using altool (Command Line)**
```bash
xcrun altool --upload-app \
  --type macos \
  --file "dist/PosturePilot-1.0.0.pkg" \
  --apiKey "YOUR_API_KEY" \
  --apiIssuer "YOUR_ISSUER_ID"
```

### 6.4 Submit for Review

1. Go to **App Store Connect**
2. Select your app
3. Go to the version you uploaded
4. Fill in:
   - Screenshots
   - Description
   - Keywords
   - Support URL
   - Privacy Policy URL
   - **Export Compliance**: Answer questions about encryption
5. Click **Submit for Review**

---

## Step 7: App Review Process

### 7.1 What Apple Reviews

- **Functionality**: Does the app work as described?
- **Privacy**: Privacy policy and data handling
- **Guidelines**: Follows App Store Review Guidelines
- **Metadata**: Accurate descriptions and screenshots
- **Performance**: No crashes or major bugs

### 7.2 Common Rejection Reasons

- Missing privacy policy
- Camera permission not properly explained
- App crashes during testing
- Misleading metadata
- Missing required information

### 7.3 Review Timeline

- **Initial Review**: 24-48 hours typically
- **Re-submission**: 24-48 hours after fixes
- **First-time apps**: May take longer

---

## Step 8: Post-Launch

### 8.1 Monitor Reviews

- Respond to user reviews
- Address bug reports
- Update based on feedback

### 8.2 Analytics

Set up App Store Connect analytics to track:
- Downloads
- Sales
- User retention
- Crash reports

### 8.3 Updates

For future updates:
1. Bump version in `package.json`
2. Build new `.pkg`
3. Upload to App Store Connect
4. Submit for review

---

## Troubleshooting

### Build Issues

**Error: "No identity found"**
- Check certificate is installed in Keychain
- Verify Team ID matches

**Error: "Entitlements file not found"**
- Create the entitlements files in `build/` directory
- Check paths in `package.json`

**Error: "Sandbox violations"**
- Review entitlements
- Ensure all file access uses proper APIs

### Submission Issues

**Upload fails**
- Check file size (max 4GB)
- Verify code signing
- Check network connection

**Rejected for privacy**
- Ensure privacy policy URL is accessible
- Update NSCameraUsageDescription to be more detailed

---

## Additional Resources

- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Mac App Store Distribution Guide](https://developer.apple.com/distribute/)
- [Electron Mac App Store Guide](https://www.electronjs.org/docs/latest/tutorial/mac-app-store-submission-guide)
- [electron-builder Documentation](https://www.electron.build/)

---

## Quick Start Checklist

- [ ] Enroll in Apple Developer Program
- [ ] Create app in App Store Connect
- [ ] Set up code signing certificates
- [ ] Create entitlements files
- [ ] Update package.json build config
- [ ] Create privacy policy
- [ ] Prepare screenshots and icons
- [ ] Build .pkg file
- [ ] Upload to App Store Connect
- [ ] Fill in app metadata
- [ ] Submit for review
- [ ] Wait for approval
- [ ] Celebrate! 🎉

---

## Estimated Timeline

- **Developer Account Setup**: 1-2 days
- **App Preparation**: 2-3 days
- **First Build & Upload**: 1 day
- **App Review**: 1-3 days
- **Total**: ~1-2 weeks

Good luck with your first App Store release! 🚀

