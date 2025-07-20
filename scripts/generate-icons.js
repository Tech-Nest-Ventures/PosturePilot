const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SOURCE_SVG = path.join(__dirname, '../src/assets/icon.svg');
const ICONS_DIR = path.join(__dirname, '../src/assets/icons');

// Ensure icons directory exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// Generate icons using electron-icon-builder
try {
  execSync('npx electron-icon-builder --input="./src/assets/icon.svg" --output="./src/assets/icons"', {
    stdio: 'inherit'
  });
  console.log('✓ Icons generated successfully');
} catch (error) {
  console.error('Error generating icons:', error);
  process.exit(1);
} 