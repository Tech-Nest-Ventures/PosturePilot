# PosturePilot 🎯

An AI-powered posture coach that helps you maintain healthy ergonomic alignment while working at your computer.

## Core Features

- **Real-time Posture Analysis**: Continuous monitoring using MediaPipe's pose detection
- **Smart Ergonomic Metrics** (upper-body focus):
  - **Forward Head Position** (✓ High accuracy) - Detects "tech neck" by measuring horizontal alignment of ears relative to shoulders
  - **Neck Tilt** (✓ High accuracy) - Lateral head tilt detection via ear landmark analysis
  - **Shoulder Height Asymmetry** (✓ Moderate accuracy) - Detects uneven shoulders and slouching
- **Instant Visual Feedback**: Color-coded status and live metrics
- **Native Desktop Notifications**: Gentle reminders when posture needs adjustment
- **Auto-Calibration**: 2-second setup that adapts to your camera position

## Ergonomic Standards

PosturePilot focuses on four key patterns that research links to musculoskeletal issues:

1. **Forward Head Posture (FHP)** 
   - Ideal: Ears aligned with shoulders
   - Warning: >25% forward deviation
   - Risk: Neck strain, upper back pain, headaches

2. **Neck Tilt**
   - Ideal: Ears level (±10% slope)
   - Warning: >10% lateral tilt
   - Risk: Muscle imbalance, cervical strain

3. **Shoulder Asymmetry**
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
- **Neck Tilt**: Slope between ear landmarks
- **Shoulder Asymmetry**: Slope of shoulder line

### Auto-Calibration
1. Captures ~60 frames (2 seconds)
2. Establishes shoulder width as scaling factor
3. All measurements normalized to shoulder width for consistency

## What PosturePilot Can & Cannot Measure

PosturePilot uses **Human Pose Estimation** via webcam to analyze posture. Here's what's feasible:

### ✅ **Highly Accurate** (What PosturePilot Monitors)
- **Head Position**: Detects forward head posture ("tech neck") by analyzing ear-to-shoulder alignment
- **Neck Tilt**: Measures lateral head tilt using ear landmark positions
- **Shoulder Slouching**: Detects hunched or uneven shoulders

### ⚠️ **Moderate Accuracy** (Limitations)
- **Shoulder Roundness**: Can detect major slouching but struggles with subtle "pulling shoulders back" detection due to 2D camera limitations
- **Spine Curvature**: Can infer major slouching but cannot accurately measure natural spinal curves (requires side-view or 3D depth sensing)

### ❌ **Not Measurable** (Out of Scope)
- **Pelvic Tilt**: Not visible from typical desk setup; requires specialized sensors
- **Feet/Weight Distribution**: Feet not in frame; requires pressure sensors
- **Full-Body Analysis**: Focused on upper-body desk posture only

### Important Limitations
- **2D vs. 3D**: Webcam captures 2D images with no true depth perception
- **Camera Angle**: Best results when camera is directly in front at eye level
- **Occlusion**: Arms, desk, or chair can block key body parts
- **Clothing**: Baggy clothing may obscure joint positions

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


## Future Enhancements

Potential features for future development:
- Mouth breathing detection (requires additional facial landmark analysis)
- Improved shoulder roundness detection (may require side-view camera or 3D depth sensing)
- Posture trend analysis and reporting 