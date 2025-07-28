# PosturePilot 🎯

An AI-powered posture coach that helps you maintain healthy ergonomic alignment while working at your computer.

## Core Features

- **Real-time Posture Analysis**: Continuous monitoring using MediaPipe's pose detection
- **Smart Ergonomic Metrics**:
  - Forward Head Position (% of shoulder width)
  - Shoulder Roundness (protraction/retraction)
  - Neck Tilt (lateral flexion)
  - Shoulder Height Asymmetry
- **Instant Visual Feedback**: Color-coded status and live metrics
- **Native Desktop Notifications**: Gentle reminders when posture needs adjustment
- **Auto-Calibration**: 2-second setup that adapts to your camera position

## Ergonomic Standards

PosturePilot focuses on four key patterns that research links to musculoskeletal issues:

1. **Forward Head Posture (FHP)** 
   - Ideal: Ears aligned with shoulders
   - Warning: >25% forward deviation
   - Risk: Neck strain, upper back pain, headaches

2. **Rounded Shoulders**
   - Ideal: Shoulders relaxed and back
   - Warning: >15% change in shoulder width
   - Risk: Upper back pain, shoulder impingement

3. **Neck Tilt**
   - Ideal: Ears level (±10% slope)
   - Warning: >10% lateral tilt
   - Risk: Muscle imbalance, cervical strain

4. **Shoulder Asymmetry**
   - Ideal: Level shoulders (±15% height difference)
   - Warning: >15% height disparity
   - Risk: Compensatory patterns, scoliosis risk

## Technical Implementation

### Pose Detection
- Uses MediaPipe Pose for real-time skeletal tracking
- Extracts key landmarks: ears, nose, eyes, shoulders
- 30fps analysis with smooth landmark tracking

### Metric Calculations
- **Forward Head**: Horizontal distance from ear midpoint to shoulder line
- **Shoulder Roundness**: Change in horizontal shoulder width
- **Neck Tilt**: Slope between ear landmarks
- **Shoulder Asymmetry**: Slope of shoulder line

### Auto-Calibration
1. Captures ~60 frames (2 seconds)
2. Establishes shoulder width as scaling factor
3. All measurements normalized to shoulder width for consistency

## Installation

1. Clone and install dependencies:
   ```bash
   git clone <repo-url>
   cd PosturePilot
   npm install
   ```

2. Start the app:
   ```bash
   npm start
   ```

## Usage

1. Launch PosturePilot
2. Allow camera access when prompted
3. Wait 2 seconds for auto-calibration
4. Monitor shows:
   - Live metrics panel
   - Status indicator
   - Real-time skeletal overlay

## Privacy & Security

- All processing happens locally on your device
- No video/images are stored or transmitted
- Camera feed used only for real-time analysis

## Contributing

We welcome contributions! Areas of interest:

- Additional ergonomic metrics
- UI/UX improvements
- Performance optimizations
- Cross-platform testing

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- MediaPipe team for pose detection
- Ergonomic research from OSHA and NIOSH
- Open-source community

## Support

- Issues: GitHub issue tracker
- Questions: Discussions board
- Updates: Star/watch repository