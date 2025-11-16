# Content Rights - App Store Connect Guide

## Your Situation

Your app accesses MediaPipe libraries and model files from:
- `https://cdn.jsdelivr.net/npm/@mediapipe/pose/`
- `https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/`
- `https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/`
- `https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/`

## Answer to Content Rights Question

**Select: "Yes, it contains, shows, or accesses third-party content, and I have the necessary rights"**

## Explanation

MediaPipe is an **open-source framework** developed by Google and licensed under the **Apache License 2.0**. This license explicitly grants you the right to use, modify, and distribute MediaPipe in your application, including commercial use.

### Why This is Permitted:

1. **Apache 2.0 License** - MediaPipe is open source with a permissive license
2. **Commercial Use Allowed** - Apache 2.0 explicitly allows commercial use
3. **No Additional Rights Needed** - The license grants all necessary rights
4. **Public CDN** - jsDelivr is a public CDN serving open-source packages

### What You Need to Disclose:

When answering "Yes", you'll likely be asked to provide details. Here's what to include:

**Third-Party Content:**
- MediaPipe Pose library (Google)
- MediaPipe Camera Utils (Google)
- MediaPipe Drawing Utils (Google)
- MediaPipe Control Utils (Google)

**License:**
- Apache License 2.0

**Source:**
- Loaded from jsDelivr CDN (npm packages)
- Original source: https://github.com/google/mediapipe

**Rights:**
- All necessary rights granted under Apache License 2.0
- License permits commercial use, modification, and distribution
- Attribution requirements are minimal (typically just include license notice)

---

## Sample Response for App Store Connect

If App Store Connect asks for details about the third-party content, you can use this:

```
Third-Party Content: MediaPipe Pose Detection Framework

Our app uses MediaPipe, an open-source machine learning framework developed by Google, for real-time pose detection. Specifically, we use:

- @mediapipe/pose - For pose estimation
- @mediapipe/camera_utils - For camera handling
- @mediapipe/drawing_utils - For visualization
- @mediapipe/control_utils - For control utilities

License: Apache License 2.0

All necessary rights are granted under the Apache License 2.0, which explicitly permits commercial use, modification, and distribution. The framework is loaded from jsDelivr CDN, which serves npm packages containing open-source software.

Source: https://github.com/google/mediapipe
License: https://github.com/google/mediapipe/blob/master/LICENSE
```

---

## Important Notes

### Data Privacy Consideration

**Important:** MediaPipe processes video frames **locally on the device**. The libraries and model files are downloaded from the CDN, but:
- **No video data is sent to Google or any third party**
- **All processing happens on-device**
- **No personal data is shared with MediaPipe or Google**

You should emphasize this in your privacy policy and App Store description to avoid any confusion about data sharing.

### Attribution Requirements (Apache 2.0)

Apache 2.0 requires:
1. **Include the license notice** - You should include the Apache 2.0 license text somewhere in your app (typically in an "About" or "Licenses" section, or in your app's documentation)
2. **State changes** - If you modified MediaPipe code, you must state what changes you made (you likely haven't modified it, just used it as-is)
3. **Include copyright notice** - Include Google's copyright notice

### Recommended Actions

1. **Add License Information to Your App**
   - Create an "About" or "Licenses" section
   - Include Apache 2.0 license text
   - Credit Google/MediaPipe

2. **Update Privacy Policy** (if you have one)
   - Clarify that MediaPipe libraries are used
   - Emphasize that all processing is local
   - No data is sent to third parties

3. **In App Store Description**
   - You can mention "Powered by MediaPipe" if you want
   - Emphasize privacy: "All processing happens locally"

---

## Checklist

- [x] MediaPipe is open source (Apache 2.0)
- [x] Commercial use is permitted
- [x] All necessary rights are granted
- [ ] Answer "Yes" to Content Rights question
- [ ] Provide MediaPipe details if asked
- [ ] Include license attribution in app (recommended)
- [ ] Update privacy policy if needed

---

## Quick Answer Summary

**Question:** "Does your app contain, show, or access third-party content?"

**Answer:** **Yes, it contains, shows, or accesses third-party content, and I have the necessary rights**

**Reason:** MediaPipe is open-source software licensed under Apache 2.0, which grants all necessary rights for commercial use.

---

## Additional Resources

- MediaPipe GitHub: https://github.com/google/mediapipe
- Apache 2.0 License: https://www.apache.org/licenses/LICENSE-2.0
- MediaPipe Documentation: https://mediapipe.dev/

---

**Bottom Line:** You're good to go! MediaPipe's Apache 2.0 license gives you all the rights you need. Just answer "Yes" and provide the details if asked.

