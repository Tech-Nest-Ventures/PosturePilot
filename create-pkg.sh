#!/bin/bash

# Script to create a .pkg file from the .app bundle for Mac App Store
# Note: This requires a "3rd Party Mac Developer Installer" certificate

set -e  # Exit on error
set -u  # Exit on undefined variable

# Auto-detect the MAS build directory (handles mas-arm64, mas-x64, or mas)
MAS_DIR=""
if [ -d "dist/mas-arm64" ]; then
    MAS_DIR="dist/mas-arm64"
elif [ -d "dist/mas-x64" ]; then
    MAS_DIR="dist/mas-x64"
elif [ -d "dist/mas" ]; then
    MAS_DIR="dist/mas"
else
    echo "❌ Error: No MAS build directory found in dist/"
    echo "   Expected one of: dist/mas-arm64, dist/mas-x64, or dist/mas"
    echo "   Please build the app first with: npm run dist:mas"
    exit 1
fi

APP_PATH="$MAS_DIR/PosturePilot.app"

if [ ! -d "$APP_PATH" ]; then
    echo "❌ Error: $APP_PATH not found. Please build the app first with: npm run build:mas"
    exit 1
fi

echo "✅ Found app at: $APP_PATH"

# Validate MAS build structure
echo "Validating MAS build structure..."
HELPER_COUNT=$(find "$APP_PATH" -name "*.app" -type d | wc -l | tr -d ' ')
if [ "$HELPER_COUNT" -lt 2 ]; then
    echo "⚠️  Warning: Expected MAS build with helper apps, but found only $HELPER_COUNT app(s)"
    echo "   This might not be a proper MAS build. Make sure you used 'target: mas' in package.json"
fi

# Check for Electron MAS Framework
if [ ! -d "$APP_PATH/Contents/Frameworks/Electron Framework.framework" ]; then
    echo "❌ Error: Electron Framework not found. This is not a valid MAS build."
    echo "   Make sure you used 'target: mas' (not 'target: dir') in package.json"
    exit 1
fi

echo "✅ MAS build structure validated"

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
PKG_PATH="dist/PosturePilot-${VERSION}.pkg"

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
    else
        echo "✅ Minimum system version already set to 12.0"
    fi
fi

# Always verify and ensure app is properly signed with entitlements
echo "Verifying app signature and entitlements..."
ENTITLEMENTS_FILE="build/entitlements.mas.plist"
PROVISIONING_PROFILE="build/posturepilot.provisionprofile"

# Auto-detect signing identity based on team ID (more reliable than hardcoding)
# Team ID from package.json MAS config or entitlements
TEAM_ID="3Y4F3KTSJA"
SIGNING_IDENTITY=$(security find-identity -v -p codesigning 2>/dev/null | \
    grep -E "(Apple Distribution|Mac Developer)" | \
    grep "$TEAM_ID" | \
    head -1 | \
    sed 's/.*"\(.*\)".*/\1/')

if [ -z "$SIGNING_IDENTITY" ]; then
    # Fallback to hardcoded identity if auto-detection fails
    SIGNING_IDENTITY="Apple Distribution: Timeo Williams (3Y4F3KTSJA)"
    echo "⚠️  Using fallback signing identity: $SIGNING_IDENTITY"
    echo "   (Auto-detection failed - make sure your certificate is in the keychain)"
else
    echo "✅ Auto-detected signing identity: $SIGNING_IDENTITY"
fi

# Check if entitlements file exists
if [ ! -f "$ENTITLEMENTS_FILE" ]; then
    echo "❌ Error: Entitlements file not found at $ENTITLEMENTS_FILE"
    exit 1
fi

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

# Check if application identifier is present (required for TestFlight)
if ! codesign -d --entitlements - "$APP_PATH" 2>/dev/null | grep -q "com.apple.application-identifier"; then
    echo "Application identifier missing, re-signing with entitlements..."
    NEED_RESIGN=true
fi

# Function to sign helper apps (handles paths with spaces)
sign_helper_apps() {
    local need_embed_profile=$1
    local count=0
    
    # Use null-delimited find to handle paths with spaces
    while IFS= read -r -d '' helper_app; do
        # Skip the main app (we'll sign it separately)
        if [ "$helper_app" != "$APP_PATH" ]; then
            count=$((count + 1))
            echo "Signing helper app $count: $(basename "$helper_app")"
            
            # Embed provisioning profile if needed and not already present
            if [ "$need_embed_profile" = "true" ] && [ -f "$PROVISIONING_PROFILE" ]; then
                EMBEDDED_PROFILE="$helper_app/Contents/embedded.provisionprofile"
                if [ ! -f "$EMBEDDED_PROFILE" ]; then
                    cp "$PROVISIONING_PROFILE" "$EMBEDDED_PROFILE"
                    echo "  Embedded provisioning profile"
                fi
            fi
            
            # Sign the helper app
            codesign --force --sign "$SIGNING_IDENTITY" \
                --entitlements "$ENTITLEMENTS_FILE" \
                "$helper_app"
            
            if [ $? -ne 0 ]; then
                echo "❌ Error: Failed to sign helper app: $helper_app"
                exit 1
            fi
        fi
    done < <(find "$APP_PATH" -name "*.app" -type d -print0)
    
    if [ $count -eq 0 ]; then
        echo "No helper apps found to sign"
    fi
}

# Re-sign the app if needed (required to preserve entitlements)
# Note: MAS builds don't use hardened runtime, so we don't use --options runtime
# For MAS, we need to sign helper apps first with provisioning profile, then the main app
if [ "$NEED_RESIGN" = true ]; then
    echo "Re-signing all helper apps and main app with provisioning profile..."
    
    # Sign helper apps first
    sign_helper_apps "false"
    
    # Now sign the main app
    echo "Signing main app..."
    codesign --force --sign "$SIGNING_IDENTITY" \
        --entitlements "$ENTITLEMENTS_FILE" \
        "$APP_PATH"
    
    if [ $? -ne 0 ]; then
        echo "❌ Error: Re-signing failed"
        exit 1
    else
        echo "✅ App re-signed successfully with entitlements"
        # Verify the signature
        codesign -vvv "$APP_PATH" || exit 1
        # Verify application identifier is present
        if codesign -d --entitlements - "$APP_PATH" 2>/dev/null | grep -q "com.apple.application-identifier"; then
            echo "✅ Application identifier verified in signature"
        else
            echo "⚠️  Warning: Application identifier not found in signature"
        fi
    fi
else
    echo "✅ App is already properly signed"
fi

# Embed provisioning profile into all helper apps and main app
echo "Verifying provisioning profile embedding..."
if [ -f "$PROVISIONING_PROFILE" ]; then
    # Check if provisioning profile is already embedded in main app
    EMBEDDED_PROFILE="$APP_PATH/Contents/embedded.provisionprofile"
    NEED_EMBED=false
    
    if [ ! -f "$EMBEDDED_PROFILE" ]; then
        echo "Provisioning profile not found in main app, embedding..."
        cp "$PROVISIONING_PROFILE" "$EMBEDDED_PROFILE"
        NEED_EMBED=true
    else
        echo "✅ Provisioning profile already embedded in main app"
    fi
    
    # Check and embed in helper apps
    while IFS= read -r -d '' helper_app; do
        if [ "$helper_app" != "$APP_PATH" ]; then
            EMBEDDED_PROFILE_HELPER="$helper_app/Contents/embedded.provisionprofile"
            if [ ! -f "$EMBEDDED_PROFILE_HELPER" ]; then
                cp "$PROVISIONING_PROFILE" "$EMBEDDED_PROFILE_HELPER"
                echo "Embedded provisioning profile into: $(basename "$helper_app")"
                NEED_EMBED=true
            fi
        fi
    done < <(find "$APP_PATH" -name "*.app" -type d -print0)
    
    # Re-sign after embedding provisioning profile if we made changes
    if [ "$NEED_EMBED" = true ]; then
        echo "Re-signing after embedding provisioning profile..."
        
        # Sign helper apps first
        sign_helper_apps "false"
        
        # Sign main app
        codesign --force --sign "$SIGNING_IDENTITY" \
            --entitlements "$ENTITLEMENTS_FILE" \
            "$APP_PATH"
        
        if [ $? -eq 0 ]; then
            echo "✅ Re-signed successfully with embedded provisioning profiles"
            codesign -vvv "$APP_PATH" || exit 1
        else
            echo "❌ Error: Re-signing after embedding provisioning profile failed"
            exit 1
        fi
    else
        echo "✅ All provisioning profiles already embedded"
    fi
else
    echo "⚠️  Warning: Provisioning profile not found at $PROVISIONING_PROFILE"
    echo "   Continuing anyway, but the .pkg may not work for TestFlight/App Store"
fi

# Check if installer certificate exists (look for both old and new names)
# Installer certificates may not be in codesigning keychain, so search all identities
# Prefer certificates matching our team ID
TEAM_ID="3Y4F3KTSJA"
INSTALLER_CERT=$(security find-identity -v 2>/dev/null | \
    grep -E "(Mac Installer Distribution|3rd Party Mac Developer Installer)" | \
    grep "$TEAM_ID" | \
    head -1 | \
    sed 's/.*"\(.*\)".*/\1/')

# Fallback to any installer certificate if team-specific one not found
if [ -z "$INSTALLER_CERT" ]; then
    INSTALLER_CERT=$(security find-identity -v 2>/dev/null | \
        grep -E "(Mac Installer Distribution|3rd Party Mac Developer Installer)" | \
        head -1 | \
        sed 's/.*"\(.*\)".*/\1/')
fi

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
    echo ""
    echo "📦 Package validation:"
    ls -lh "$PKG_PATH"
    echo ""
    echo "✅ Ready for App Store Connect upload!"
    echo ""
    echo "To verify the MAS binary before packaging, run:"
    echo "  codesign -dvv $APP_PATH"
    echo ""
else
    echo "❌ Failed to create .pkg file"
    exit 1
fi
