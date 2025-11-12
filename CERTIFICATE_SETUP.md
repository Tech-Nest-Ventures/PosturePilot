# Certificate Setup for PosturePilot

## Current Issues (from Xcode)

1. **Missing Private Key**: One certificate shows "Missing Private..." - this means the private key isn't in your Keychain
2. **PLA Update**: Program License Agreement needs to be updated
3. **Untitled Certificates**: Need to create proper "Mac App Distribution" certificate

## Step-by-Step Fix

### 1. Update Program License Agreement (PLA)

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. You should see a banner or notification about updating the PLA
3. Click through and accept the updated agreement
4. This usually takes effect immediately

### 2. Clean Up Old Certificates

1. In Xcode → Settings → Accounts
2. Select your Apple ID
3. Click "Manage Certificates..."
4. Delete the certificate with "Missing Private..." (the one with red X)
5. Keep the valid one for now, or delete both if you want a fresh start

### 3. Create Mac App Distribution Certificate

**Option A: Automatic (Recommended)**
1. In Xcode → Settings → Accounts
2. Select your Apple ID
3. Click "Manage Certificates..."
4. Click the **+** button
5. Select **"Mac App Distribution"**
6. Xcode will automatically create and download it
7. The certificate will appear in your Keychain

**Option B: Manual (if automatic doesn't work)**
1. Go to [developer.apple.com/account/resources/certificates/list](https://developer.apple.com/account/resources/certificates/list)
2. Click **+** to create new certificate
3. Select **"Mac App Distribution"**
4. Follow the instructions to create a Certificate Signing Request (CSR)
5. Upload the CSR
6. Download the certificate
7. Double-click to install in Keychain

### 4. Verify Certificate in Keychain

1. Open **Keychain Access** app
2. Select **"login"** keychain (or "System" if needed)
3. Select **"My Certificates"** category
4. Look for:
   - **"Mac App Distribution: Timeo Williams"** or similar
   - Should show a green checkmark
   - Should have a private key attached (expand to see)

### 5. Get Your Team ID

1. In Xcode → Settings → Accounts
2. Select your Apple ID
3. Your Team ID is shown next to your team name
4. It looks like: `ABC123DEF4`
5. **Write this down** - you'll need it!

### 6. Test Certificate

Once you have the certificate:
```bash
# List your certificates
security find-identity -v -p codesigning
```

You should see something like:
```
1) ABC123DEF4567890 "Mac App Distribution: Timeo Williams (TEAM_ID)"
```

## Next Steps After Certificates Are Set Up

Once certificates are working:

1. **Create App in App Store Connect** (if not done)
2. **Build your app** with the new certificate
3. **Upload to App Store Connect**

## Troubleshooting

**"No identity found" error:**
- Make sure "Mac App Distribution" certificate exists
- Check it's in the correct keychain (login, not System)
- Try restarting Xcode

**"Certificate expired":**
- Create a new one following steps above
- Old certificates can be deleted

**"Private key not found":**
- The certificate was created on a different Mac
- You need to export the certificate WITH private key from the original Mac
- Or create a new certificate on this Mac

