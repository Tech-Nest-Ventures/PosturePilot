# PosturePilot - Your Next Steps 🚀

Great! You have:
- ✅ Apple Developer Account
- ✅ Xcode installed
- ✅ Team ID: `5NNWVUGB45`

## Immediate Action Items

### 1. Fix Certificates (5 minutes)

**In Xcode:**
1. Open **Xcode → Settings → Accounts**
2. Select your Apple ID (timwilliams)
3. Click **"Manage Certificates..."**
4. Click the **+** button (bottom left)
5. Select **"Mac App Distribution"**
6. Xcode will create it automatically
7. Verify it appears with a green checkmark

**Verify it worked:**
```bash
security find-identity -v -p codesigning | grep -i "mac app distribution"
```

You should see your new certificate listed.

### 2. Update Program License Agreement (2 minutes)

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Look for any banner/notification about updating agreements
3. Click through and accept
4. This should resolve the "PLA Update available" warning

### 3. Create App in App Store Connect (10 minutes)

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Click **"My Apps"** → **"+"** → **"New App"**
3. Fill in:
   - **Platform**: macOS
   - **Name**: PosturePilot
   - **Primary Language**: English
   - **Bundle ID**: `com.posturepilot.app` (create new if needed)
   - **SKU**: `posturepilot-001` (any unique identifier)
   - **User Access**: Full Access
4. Click **"Create"**

### 4. Create Privacy Policy (15 minutes)

1. Open `PRIVACY_POLICY_TEMPLATE.md`
2. Customize with your contact info:
   - Replace `[YOUR_EMAIL]` with your email
   - Replace `[YOUR_WEBSITE]` with GitHub repo or website
   - Update `[DATE]` with today's date
3. Host it somewhere public:
   - **Option A**: GitHub Pages (easiest)
     - Create a repo or use existing one
     - Enable GitHub Pages in Settings
     - Upload the privacy policy as `privacy-policy.md` or `index.html`
   - **Option B**: Your website
   - **Option C**: Use a service like [GitHub Gist](https://gist.github.com) (raw URL)
4. **Save the URL** - you'll need it for submission

### 5. Prepare Screenshots (30 minutes)

Take screenshots of your app:
- **Minimum size**: 1280 x 800 pixels
- **Recommended**: 2560 x 1600 pixels
- **At least 1 screenshot** (up to 10 allowed)

**What to capture:**
1. Setup/calibration screen (with camera view)
2. Monitoring screen showing "Good Posture" status
3. Metrics panel with live data
4. Alert/notification example (optional)

**How to take screenshots:**
- Run your app: `npm start`
- Use Cmd+Shift+4 to capture specific area
- Or use Cmd+Shift+3 for full screen
- Save in a folder like `screenshots/`

### 6. Write App Store Description (20 minutes)

**Subtitle** (30 characters max):
```
AI-Powered Posture Coach
```

**Description** (4000 characters max):
```
PosturePilot is your AI-powered posture coach that helps you maintain healthy ergonomic alignment while working at your computer.

FEATURES:
• Real-time posture monitoring using advanced pose detection
• Instant visual feedback with color-coded status indicators
• Smart alerts when your posture needs adjustment
• Tracks forward head position, neck tilt, and shoulder alignment
• Auto-calibration adapts to your unique setup in just 2 seconds
• All processing happens locally - your privacy is protected

Perfect for remote workers, students, and anyone who spends long hours at a desk. PosturePilot uses MediaPipe's advanced pose detection to analyze your posture in real-time, helping you avoid "tech neck" and other common desk-related issues.

HOW IT WORKS:
1. Allow camera access (all processing is local)
2. Sit up straight for 2 seconds to calibrate
3. Get real-time feedback on your posture
4. Receive gentle notifications when you need to adjust

Privacy-focused: No video is stored or transmitted. All analysis happens on your device.
```

**Keywords** (100 characters, comma-separated):
```
posture,health,ergonomics,desk,wellness,fitness,monitoring,productivity
```

### 7. Build for Mac App Store (5 minutes)

Once certificates are set up:

```bash
# Make sure you're in the project directory
cd /Users/timwilliams/Eng/productivity-apps/PosturePilot

# Build for Mac App Store
npm run build:mas
```

This will create a `.pkg` file in the `dist/` folder.

**If you get certificate errors:**
- Make sure "Mac App Distribution" certificate exists
- Check Team ID matches: `5NNWVUGB45`
- Try: `npm run build:mas:dir` first to test (creates unsigned build)

### 8. Upload to App Store Connect (10 minutes)

**Using Transporter App** (Easiest):
1. Download **Transporter** from Mac App Store (free)
2. Open Transporter
3. Drag your `.pkg` file from `dist/` folder into Transporter
4. Click **"Deliver"**
5. Wait for upload to complete

**Using Xcode**:
1. Open **Xcode**
2. **Window → Organizer**
3. Click **"Distribute App"**
4. Select **"App Store Connect"**
5. Follow the wizard

### 9. Complete App Store Listing (15 minutes)

1. Go to App Store Connect → Your App
2. Select the version/build you just uploaded
3. Fill in:
   - **Screenshots**: Upload your screenshots
   - **Description**: Paste your description
   - **Keywords**: Add your keywords
   - **Support URL**: Your GitHub repo or website
   - **Privacy Policy URL**: ⚠️ **REQUIRED** - the URL from step 4
   - **Marketing URL**: (optional)
4. **Category**: Health & Fitness
5. **Pricing**: Set to Free (or your price)

### 10. Submit for Review (5 minutes)

1. Scroll to bottom of App Store listing
2. Answer **Export Compliance**:
   - "Does your app use encryption?" → **"No"** (unless you use HTTPS)
3. Review all information
4. Click **"Submit for Review"**
5. 🎉 You're done! Wait for Apple's review (usually 24-48 hours)

## Quick Command Reference

```bash
# Check certificates
security find-identity -v -p codesigning

# Build for App Store
npm run build:mas

# Test build (unsigned)
npm run build:mas:dir

# Regular build (not for App Store)
npm run build
```

## Your Team ID

**Team ID**: `5NNWVUGB45`

If you need to set this in environment variables:
```bash
export APPLE_TEAM_ID="5NNWVUGB45"
```

## Estimated Time

- **Today**: Steps 1-5 (certificates, app creation, privacy policy, screenshots) = ~1.5 hours
- **Tomorrow**: Steps 6-10 (description, build, upload, submit) = ~1 hour
- **Wait**: Apple review = 1-3 days

**Total active work**: ~2.5 hours
**Total timeline**: 3-5 days

## Need Help?

- Certificate issues → See `CERTIFICATE_SETUP.md`
- Full guide → See `APP_STORE_GUIDE.md`
- Checklist → See `QUICK_START_CHECKLIST.md`

Good luck! 🚀

