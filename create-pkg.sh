#!/bin/bash

# Script to create a .pkg file from the .app bundle for Mac App Store
# Note: This requires a "3rd Party Mac Developer Installer" certificate

APP_PATH="dist/mas-arm64/PosturePilot.app"
PKG_PATH="dist/PosturePilot-1.0.0.pkg"

if [ ! -d "$APP_PATH" ]; then
    echo "Error: $APP_PATH not found. Please build the app first with: npm run dist:mas"
    exit 1
fi

echo "Creating .pkg file from $APP_PATH..."

# Ensure minimum system version is set to 12.0 for arm64-only builds
INFO_PLIST="$APP_PATH/Contents/Info.plist"
NEED_RESIGN=false
if [ -f "$INFO_PLIST" ]; then
    CURRENT_VERSION=$(plutil -extract LSMinimumSystemVersion raw "$INFO_PLIST" 2>/dev/null || echo "11.0")
    if [ "$CURRENT_VERSION" != "12.0" ]; then
        echo "Updating minimum system version to 12.0..."
        plutil -replace LSMinimumSystemVersion -string "12.0" "$INFO_PLIST"
        NEED_RESIGN=true
    fi
fi

# Always verify and ensure app is properly signed with entitlements
echo "Verifying app signature and entitlements..."
ENTITLEMENTS_FILE="build/entitlements.mas.plist"

# Check if app is properly signed
if ! codesign -vvv "$APP_PATH" &>/dev/null; then
    echo "App signature invalid, re-signing..."
    NEED_RESIGN=true
fi

# Check if sandbox entitlement is present
if ! codesign -d --entitlements - "$APP_PATH" 2>/dev/null | grep -q "app-sandbox"; then
    echo "Sandbox entitlement missing, re-signing with entitlements..."
    NEED_RESIGN=true
fi

# Re-sign the app if needed (required to preserve entitlements)
if [ "$NEED_RESIGN" = true ]; then
    echo "Re-signing app with entitlements..."
    codesign --force --deep --sign "Apple Distribution: Timeo Williams (3Y4F3KTSJA)" \
        --entitlements "$ENTITLEMENTS_FILE" \
        --options runtime \
        "$APP_PATH"
    
    if [ $? -ne 0 ]; then
        echo "❌ Error: Re-signing failed"
        exit 1
    else
        echo "✅ App re-signed successfully with entitlements"
        # Verify the signature
        codesign -vvv "$APP_PATH" || exit 1
    fi
fi

# Check if installer certificate exists (look for both old and new names)
# Installer certificates may not be in codesigning keychain, so search all identities
INSTALLER_CERT=$(security find-identity -v 2>/dev/null | grep -E "(Mac Installer Distribution|3rd Party Mac Developer Installer)" | head -1 | sed 's/.*"\(.*\)".*/\1/')

if [ -z "$INSTALLER_CERT" ]; then
    echo "❌ Error: 'Mac Installer Distribution' certificate not found"
    echo ""
    echo "Please create it first:"
    echo "1. Open Xcode"
    echo "2. Go to Xcode → Settings → Accounts"
    echo "3. Select your Apple ID"
    echo "4. Click 'Manage Certificates...'"
    echo "5. Click '+' and select 'Mac Installer Distribution'"
    echo ""
    echo "Or see CREATE_INSTALLER_CERT.md for detailed instructions"
    exit 1
fi

echo "Found installer certificate: $INSTALLER_CERT"
echo "Creating .pkg file..."

# Create the pkg using productbuild
productbuild \
    --component "$APP_PATH" /Applications \
    --sign "$INSTALLER_CERT" \
    "$PKG_PATH"

if [ $? -eq 0 ]; then
    echo "✅ Created $PKG_PATH"
    echo "You can now upload this to App Store Connect"
    ls -lh "$PKG_PATH"
else
    echo "❌ Failed to create .pkg file"
    exit 1
fi

