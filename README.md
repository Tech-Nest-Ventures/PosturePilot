# PosturePilot

A cross-platform Electron app that monitors your posture using your webcam and AI-powered pose detection.

## Features

- **Real-time posture monitoring** using MediaPipe pose detection
- **Guided setup** to establish your baseline good posture
- **Smart heuristics** to detect:
  - Forward head posture
  - Hunched shoulders
  - Uneven/asymmetrical shoulders
- **30-second interval checks** with countdown timer
- **Native notifications** for posture alerts
- **Local data storage** for baseline and posture logs
- **Cross-platform compatibility** (macOS, Windows, Linux)

## Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo>
   cd PosturePilot
   npm install
   ```

2. **Run the app:**
   ```bash
   npm start
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

## How to Use

### Initial Setup
1. Launch the app and click "Start Camera"
2. Allow camera permissions when prompted
3. Sit up straight with good posture (shoulders back, head aligned)
4. Click "Capture Good Posture" 5 times to establish your baseline
5. Click "Finish Setup" to start monitoring

### Monitoring Mode
- The app will check your posture every 30 seconds
- Green status = Good posture
- Orange status = Minor issues (forward head, hunched shoulders)
- Red status = Poor posture (uneven shoulders)
- Notifications will alert you when posture needs adjustment

### Controls
- **Pause/Resume Monitoring**: Temporarily stop posture checks
- **Recalibrate**: Return to setup mode to re-establish baseline

## Technical Details

### Pose Detection
- Uses MediaPipe Pose for real-time skeletal tracking
- Extracts key landmarks: nose, shoulders, elbows, hips
- Calculates derived measurements like shoulder slope and neck angle

### Posture Analysis Heuristics
- **Forward Head**: Neck angle deviation > 15° from baseline
- **Hunched Shoulders**: Shoulder distance change > 0.05 units
- **Uneven Shoulders**: Shoulder slope difference > 0.1 from baseline

### Data Storage
- Baseline posture data saved locally in app data directory
- Posture logs maintained (last 1000 entries)
- No data sent to external servers

## File Structure

```
src/
├── main.js          # Electron main process
├── preload.js       # IPC bridge
├── index.html       # Main UI
├── styles.css       # Styling
└── app.js           # Core application logic
```

## Development

### Scripts
- `npm start` - Run in development mode
- `npm run dev` - Run with logging enabled
- `npm run build` - Build for distribution
- `npm run pack` - Package without distribution
- `npm run dist` - Build and package for distribution

### Requirements
- Node.js 16+
- Webcam access
- Camera permissions

## Privacy & Security

- All processing happens locally on your device
- No data is transmitted to external servers
- Camera feed is processed in real-time and not stored
- Only pose keypoints (mathematical coordinates) are saved locally

## Browser Compatibility

Works best with:
- Electron (recommended)
- Chrome/Chromium browsers
- Safari (with MediaPipe support)
- Firefox (with MediaPipe support)

## Troubleshooting

### Camera Issues
- Ensure camera permissions are granted
- Check if other apps are using the camera
- Try restarting the app if camera fails to initialize

### Pose Detection Issues
- Ensure good lighting conditions
- Sit at appropriate distance from camera (2-4 feet)
- Keep upper body visible in camera frame
- Avoid highly patterned clothing that might interfere

### Performance
- Close other camera-using applications
- Ensure adequate system resources
- Lower video resolution if experiencing lag

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test across platforms
5. Submit a pull request

## License

MIT License - see LICENSE file for details