const fs = require('fs');
const path = require('path');

// Source directories in node_modules
const mediapipePackages = [
  { name: 'pose', files: ['pose.js', 'pose_web.binarypb', 'pose_solution_packed_assets_loader.js', 'pose_solution_packed_assets.data', 'pose_solution_simd_wasm_bin.js', 'pose_solution_simd_wasm_bin.data', 'pose_solution_simd_wasm_bin.wasm', 'pose_solution_wasm_bin.js', 'pose_solution_wasm_bin.wasm', 'pose_landmark_lite.tflite', 'pose_landmark_full.tflite', 'pose_landmark_heavy.tflite'] },
  { name: 'camera_utils', files: ['camera_utils.js'] },
  { name: 'drawing_utils', files: ['drawing_utils.js'] }
  // Note: control_utils is not a separate package - it may be bundled with pose or not needed
];

// Destination directory
const vendorDir = path.join(__dirname, '../src/vendor/mediapipe');

// Ensure vendor directory exists
if (!fs.existsSync(vendorDir)) {
  fs.mkdirSync(vendorDir, { recursive: true });
}

console.log('Copying MediaPipe files to vendor directory...');

// Copy files from each package
mediapipePackages.forEach(pkg => {
  const srcDir = path.join(__dirname, '../node_modules/@mediapipe', pkg.name);
  const destDir = path.join(vendorDir, pkg.name);
  
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  pkg.files.forEach(file => {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(destDir, file);
    
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`  ✓ Copied ${pkg.name}/${file}`);
    } else {
      console.warn(`  ⚠ File not found: ${srcPath}`);
    }
  });
});

console.log('✓ MediaPipe files copied successfully!');

