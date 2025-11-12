# PosturePilot App Store - Quick Start Checklist ✅

Use this checklist to track your progress toward App Store submission.

## Phase 1: Apple Developer Setup (Day 1-2)

- [ ] **Enroll in Apple Developer Program**
  - Go to developer.apple.com
  - Pay $99/year fee
  - Wait for approval (usually instant, can take up to 48 hours)

- [ ] **Access App Store Connect**
  - Sign in at appstoreconnect.apple.com
  - Verify account is active

- [ ] **Set up Code Signing**
  - Open Xcode → Settings → Accounts
  - Add your Apple ID
  - Download "Mac App Distribution" certificate
  - Note your Team ID (you'll need this)

## Phase 2: App Store Connect Setup (Day 2-3)

- [ ] **Create New App**
  - Bundle ID: `com.posturepilot.app`
  - Name: PosturePilot
  - Platform: macOS
  - Category: Health & Fitness

- [ ] **Create Privacy Policy**
  - Use `PRIVACY_POLICY_TEMPLATE.md` as starting point
  - Customize with your contact info
  - Host on GitHub Pages, your website, or similar
  - **Save the URL** - you'll need it for submission

- [ ] **Prepare App Icons**
  - Verify all sizes exist in `src/assets/icons/`
  - Required: 16, 32, 64, 128, 256, 512, 1024
  - ✅ Already have these!

## Phase 3: Marketing Materials (Day 3-4)

- [ ] **Take Screenshots**
  - Minimum: 1280 x 800
  - Recommended: 2560 x 1600
  - Need at least 1, up to 10 screenshots
  - Show: Setup screen, Monitoring screen, Metrics panel

- [ ] **Write App Description**
  - Subtitle (30 chars max): e.g., "AI-Powered Posture Coach"
  - Description (4000 chars max): See guide for example
  - Keywords (100 chars): e.g., "posture,health,ergonomics,desk,wellness"
  - Promotional text (170 chars, optional)

- [ ] **App Preview Video** (Optional)
  - 15-30 seconds
  - Show app in action
  - 1920 x 1080 or higher

## Phase 4: Build Configuration (Day 4)

- [ ] **Verify Configuration**
  - ✅ Entitlements files created (`build/entitlements.mas.plist`)
  - ✅ package.json updated with MAS config
  - ✅ Build scripts added

- [ ] **Test Build Locally** (Optional)
  ```bash
  npm run build:mas:dir
  ```
  - This creates an unsigned build for testing
  - Don't submit this - it's just to verify the build works

## Phase 5: Code Signing & Build (Day 5)

- [ ] **Set Environment Variables** (if needed)
  ```bash
  export APPLE_TEAM_ID="YOUR_TEAM_ID"
  export APPLE_ID="your@email.com"
  export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
  ```
  
  To create app-specific password:
  - Go to appleid.apple.com
  - Sign in → App-Specific Passwords → Generate

- [ ] **Build for Mac App Store**
  ```bash
  npm run build:mas
  ```
  - This creates a `.pkg` file in `dist/`
  - File will be named something like `PosturePilot-1.0.0.pkg`

## Phase 6: Upload & Submit (Day 5-6)

- [ ] **Upload Build**
  - Option A: Use Transporter app (easiest)
  - Option B: Use Xcode Organizer
  - Option C: Use command line (altool/xcrun notarytool)

- [ ] **Wait for Processing**
  - Apple processes the upload (usually 10-30 minutes)
  - Check App Store Connect → TestFlight/App Store → Builds

- [ ] **Fill in App Store Listing**
  - Screenshots
  - Description
  - Keywords
  - Support URL
  - Privacy Policy URL ⚠️ **REQUIRED**
  - Marketing URL (optional)

- [ ] **Answer Export Compliance**
  - Question: "Does your app use encryption?"
  - Answer: "No" (unless you're using HTTPS, then "Yes" but exempt)
  - Electron apps typically don't require export compliance

- [ ] **Submit for Review**
  - Click "Submit for Review"
  - Review all information one more time
  - Submit!

## Phase 7: Review & Launch (Day 6-10)

- [ ] **Wait for Review**
  - Initial review: 24-48 hours typically
  - Check App Store Connect for status updates
  - You'll get email notifications

- [ ] **If Rejected**
  - Read rejection reason carefully
  - Fix issues
  - Resubmit (usually faster review)

- [ ] **If Approved** 🎉
  - App goes live automatically (or on your scheduled date)
  - Share with the world!

## Phase 8: Post-Launch

- [ ] **Monitor Reviews**
  - Respond to user feedback
  - Address bug reports

- [ ] **Set up Analytics** (Optional)
  - App Store Connect provides basic analytics
  - Track downloads, sales, retention

- [ ] **Plan Updates**
  - Collect user feedback
  - Plan feature improvements
  - Prepare for version 1.1.0

---

## Quick Reference Commands

```bash
# Build for Mac App Store (production)
npm run build:mas

# Build for testing (unsigned)
npm run build:mas:dir

# Regular build (not for App Store)
npm run build
```

## Important URLs

- **Apple Developer**: https://developer.apple.com
- **App Store Connect**: https://appstoreconnect.apple.com
- **Review Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **Electron MAS Guide**: https://www.electronjs.org/docs/latest/tutorial/mac-app-store-submission-guide

## Estimated Timeline

- **Fast Track**: 5-7 days (if everything goes smoothly)
- **Realistic**: 1-2 weeks (accounting for review time and potential fixes)
- **First Time**: 2-3 weeks (learning curve + potential issues)

## Common Gotchas

⚠️ **Privacy Policy URL must be publicly accessible** - Test it in an incognito window

⚠️ **Screenshots must match app functionality** - Don't use mockups or outdated screenshots

⚠️ **Camera permission description** - Make sure it clearly explains why you need camera access

⚠️ **Bundle ID must match** - `com.posturepilot.app` in both package.json and App Store Connect

⚠️ **Version numbers** - Start with 1.0.0, increment for updates (1.0.1, 1.1.0, etc.)

---

**You've got this!** 🚀 Your app is already well-structured. The main work is in the setup and submission process. Good luck with your first App Store release!

