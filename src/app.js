class PosturePilot {
    constructor() {
        this.pose = null;
        this.camera = null;
        this.isSetupMode = true;
        // Remove manual baseline state
        // Baseline arrays removed in Option A. We use automatic calibration instead
        this.scaleFactor = null;           // average shoulder distance during calibration
        this.calibrationSamples = [];
        this.calibrationFramesNeeded = 60; // ≈2 s at 30 fps
        this.isCalibrating = false;
        this.monitoringInterval = null;
        this.countdownInterval = null;
        this.countdownValue = 5;
        this.isMonitoring = false;
        this.isInitializing = false;  // Add initialization state
        
        // Fixed ergonomic limits (units after scaling)
        this.POSTURE_LIMITS = {
            headForward: 0.25,      // horizontal ratio
            neckTilt: 0.1,          // slope threshold
            shoulderSlope: 0.15     // uneven shoulders threshold
        };
        
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        console.log('Initializing elements...');
        // Setup screen elements
        this.setupScreen = document.getElementById('setup-screen');
        this.monitorScreen = document.getElementById('monitor-screen');
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.overlay = document.getElementById('overlay');
        
        // Monitor screen elements
        this.monitorVideo = document.getElementById('monitor-video');
        this.monitorOverlay = document.getElementById('monitor-overlay');
        
        // Controls
        this.startCameraBtn = document.getElementById('start-camera-btn');
        this.captureBtn = document.getElementById('capture-btn');
        this.finishSetupBtn = document.getElementById('finish-setup-btn');
        this.pauseMonitoringBtn = document.getElementById('pause-monitoring-btn');
        
        // Status elements
        this.captureCount = document.getElementById('capture-count');
        this.postureStatus = document.getElementById('posture-status');
        this.countdown = document.getElementById('countdown');
        console.log('Elements initialized');
    }

    async initializePoseDetection() {
        console.log('Loading MediaPipe Pose...');
        
        // Update loading message
        const loadingMsg = document.querySelector('.loading-message');
        if (loadingMsg) {
            loadingMsg.innerHTML = 'Loading MediaPipe model files...<br/>(This may take a few seconds)';
        }

        try {
            // Create new Pose instance
            this.pose = new Pose({
                locateFile: (file) => {
                    console.log(`Loading MediaPipe file: ${file}`);
                    // Update loading message with current file
                    if (loadingMsg) {
                        loadingMsg.innerHTML = `Loading model file: ${file}<br/>(This may take a few seconds)`;
                    }
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
                }
            });

            // Configure pose detection options
            this.pose.setOptions({
                modelComplexity: 1,
                smoothLandmarks: true,
                enableSegmentation: false,
                smoothSegmentation: false,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            // Set up the results handler
            this.pose.onResults((results) => {
                this.onPoseResults(results);
            });

            // Create a temporary canvas and context for initialization
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 640;
            tempCanvas.height = 480;
            const ctx = tempCanvas.getContext('2d');
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

            // Wait for pose model to be ready
            await new Promise((resolve, reject) => {
                let initializationTimeout;
                let initializationAttempts = 0;
                const maxAttempts = 3;

                const attemptInitialization = async () => {
                    try {
                        console.log('Attempting MediaPipe initialization...');
                        await this.pose.initialize();
                        console.log('MediaPipe initialization successful');
                        clearTimeout(initializationTimeout);
                        resolve();
                    } catch (error) {
                        console.error('Initialization attempt failed:', error);
                        initializationAttempts++;
                        if (initializationAttempts < maxAttempts) {
                            console.log(`Retrying initialization (attempt ${initializationAttempts + 1}/${maxAttempts})...`);
                            setTimeout(attemptInitialization, 2000); // Wait 2 seconds before retrying
                        } else {
                            reject(new Error('Failed to initialize after multiple attempts'));
                        }
                    }
                };

                // Set a timeout for the entire initialization process
                initializationTimeout = setTimeout(() => {
                    reject(new Error('MediaPipe initialization timed out'));
                }, 5000); // 5 second timeout

                // Start initialization
                attemptInitialization();
            });

            console.log('Pose detection initialized and ready');
            
        } catch (error) {
            console.error('Failed to initialize MediaPipe:', error);
            throw new Error('Failed to initialize pose detection. Please try again.');
        }
    }

    bindEvents() {
        this.startCameraBtn.addEventListener('click', async () => {
            // Prevent multiple clicks during initialization
            if (this.isInitializing) {
                console.log('Already initializing, please wait...');
                return;
            }
            this.startCameraBtn.disabled = true;
            this.startCameraBtn.textContent = 'Initializing...';
            await this.initializeApp();
        });
        // Manual capture methods removed - app now uses automatic calibration
        // this.captureBtn and this.finishSetupBtn are kept for backward compatibility but not used
        if (this.captureBtn) {
            this.captureBtn.style.display = 'none';
        }
        if (this.finishSetupBtn) {
            this.finishSetupBtn.style.display = 'none';
        }
        this.pauseMonitoringBtn.addEventListener('click', () => this.toggleMonitoring());
    }

    async initializeApp() {
        try {
            this.isInitializing = true;
            
            // Show loading state in video container
            const loadingMsg = document.createElement('div');
            loadingMsg.className = 'loading-message';
            loadingMsg.textContent = 'Initializing camera...';
            this.video.parentElement.appendChild(loadingMsg);

            // First get camera permission
            console.log('Requesting camera permission...');
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: 640, 
                    height: 480,
                    facingMode: 'user'
                } 
            });

            loadingMsg.textContent = 'Loading pose detection...';
            // Once we have camera permission, initialize pose detection
            console.log('Camera permission granted, initializing pose detection...');
            await this.initializePoseDetection();

            loadingMsg.textContent = 'Setting up video...';
            // Then set up video and camera
            await this.setupVideoStream(stream);

            // Remove loading message
            loadingMsg.remove();

        } catch (error) {
            console.error('Error during initialization:', error);
            this.startCameraBtn.disabled = false;
            this.startCameraBtn.textContent = 'Start Camera';
            
            // Show error message in video container
            const errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.textContent = 'Failed to initialize camera. Please try again.';
            this.video.parentElement.appendChild(errorMsg);
            
            alert('Could not access camera. Please ensure camera permissions are granted.');
        } finally {
            this.isInitializing = false;
        }
    }

    async setupVideoStream(stream) {
        console.log('Setting up video stream...');
        
        // Remove any existing error messages
        const errorMsgs = this.video.parentElement.querySelectorAll('.error-message');
        errorMsgs.forEach(msg => msg.remove());

        // Update loading message
        const loadingMsg = document.querySelector('.loading-message');
        if (loadingMsg) {
            loadingMsg.textContent = 'Setting up video stream...';
        }

        this.video.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise((resolve, reject) => {
            this.video.onloadedmetadata = () => resolve();
            this.video.onerror = (error) => reject(error);
        });

        // Start video playing
        await this.video.play();
        
        // Initialize camera with continuous frame sending
        this.camera = new Camera(this.video, {
            onFrame: async () => {
                if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
                    try {
                        await this.pose.send({ image: this.video });
                    } catch (error) {
                        console.error('Error sending frame to pose detection:', error);
                    }
                }
            },
            width: 640,
            height: 480
        });

        // Start the camera
        await this.camera.start();
        console.log('Camera and video setup complete');
        
        this.startCameraBtn.textContent = 'Camera Ready';
        // Begin automatic calibration (Option A)
        this.startCalibration();
    }

    switchToMonitoringMode() {
        console.log('Switching to monitoring mode...');
        this.isSetupMode = false;
        this.setupScreen.classList.remove('active');
        this.monitorScreen.classList.add('active');
        
        // Keep using the same video element instead of switching
        // Just move it to the monitoring container
        const monitorContainer = this.monitorVideo.parentElement;
        const setupContainer = this.video.parentElement;
        
        // Remove the monitor video element since we won't use it
        this.monitorVideo.remove();
        
        // Move the original video and overlay to monitoring container
        setupContainer.removeChild(this.video);
        setupContainer.removeChild(this.overlay);
        monitorContainer.appendChild(this.video);
        monitorContainer.appendChild(this.overlay);
        
        // Update overlay reference for monitoring
        this.monitorOverlay = this.overlay;
        
        console.log('Video and pose detection transferred to monitoring mode');
        
        // Start periodic monitoring
        this.startMonitoring();
    }

    startMonitoring() {
        console.log('Starting monitoring (live mode)...');
        this.isMonitoring = true;
        // Show LIVE indicator instead of numerical countdown
        if (this.countdown) {
            this.countdown.textContent = 'LIVE';
        }
        // No countdown timer; posture will now be analyzed continuously in onPoseResults
    }

    updateCountdown() {
        this.countdown.textContent = this.countdownValue;
    }

    // ------- Automatic calibration phase -------
    startCalibration() {
        console.log('Starting 2-second calibration…');
        this.isCalibrating = true;
        this.calibrationSamples = [];
        if (this.countdown) {
            this.countdown.textContent = 'CAL';
        }
    }

    analyzePosture(landmarks) {
        if (!this.scaleFactor) return; // safety

        const currentData = this.extractKeypoints(landmarks);

        // Normalise linear distances to scaleFactor
        const normForward = currentData.headForward.forward / this.scaleFactor;

        // Angle & tilt differences are absolute values
        const neckTiltAbs = Math.abs(currentData.neckTilt);
        const shoulderSlopeAbs = Math.abs(currentData.shoulderSlope);

        // Prepare diff object for UI
        const diffs = {
            normForward,
            neckTiltAbs,
            shoulderSlopeAbs
        };
 
        console.log('Live posture metrics:', diffs);

        // Update metrics panel UI
        this.updateMetrics(diffs);

        let status = 'good';
        let message = 'Good Posture';
        let shouldNotify = false;

        // Forward-head cluster
        if (normForward > this.POSTURE_LIMITS.headForward) { 
            status = normForward > this.POSTURE_LIMITS.headForward * 1.5  ? 'bad' : 'warning';
            shouldNotify = true;
        }

        // Neck lateral tilt
        if (neckTiltAbs > this.POSTURE_LIMITS.neckTilt) {
            status = status === 'bad' ? 'bad' : 'warning';
            message = status === 'bad' ? message + ' & Head Tilt' : 'Head Tilt';
            shouldNotify = true;
        }

        // Shoulder height asymmetry
        if (shoulderSlopeAbs > this.POSTURE_LIMITS.shoulderSlope) {
            status = status === 'bad' ? 'bad' : 'warning';
            message = status === 'bad' ? message + ' & Uneven Shoulders' : 'Uneven Shoulders';
            shouldNotify = true;
        }
 
        // Update UI and notifications
        this.updatePostureStatus(status, message);

        if (shouldNotify) {
            window.electronAPI.showNotification({
                title: 'PosturePilot Alert',
                body: `${message}. Please adjust your posture.`,
                type: status
            });
        }

        window.electronAPI.savePostureLog({
            timestamp: Date.now(),
            status,
            message,
            measurements: currentData
        });
    }

    updatePostureStatus(status, message) {
        console.log('Updating status display:', { status, message });
        // Remove all existing status classes
        this.postureStatus.classList.remove('status-good', 'status-warning', 'status-bad');
        // Add the new status class
        this.postureStatus.classList.add(`status-${status}`);
        this.postureStatus.textContent = message;
        
        // Update tray icon based on posture status
        if (window.electronAPI && window.electronAPI.updateTrayIcon) {
            window.electronAPI.updateTrayIcon(status).then(result => {
                if (result && !result.success) {
                    console.warn('Tray icon update returned:', result);
                }
            }).catch(err => {
                console.error('Failed to update tray icon:', err);
            });
        } else {
            console.warn('electronAPI.updateTrayIcon not available');
        }
    }

    // Display live deviation values in the metrics panel
    updateMetrics(diffs) {
        // Map diff keys to DOM ids and relevant limit keys for percentage calc
        const mapping = {
            normForward: {
                id: 'metric-normForward',
                limitKey: 'headForward'
            },
            neckTiltAbs: {
                id: 'metric-neckTiltAbs',
                limitKey: 'neckTilt'
            },
            shoulderSlopeAbs: {
                id: 'metric-shoulderSlopeAbs',
                limitKey: 'shoulderSlope'
            }
        };

        Object.entries(mapping).forEach(([diffKey, meta]) => {
            const el = document.getElementById(meta.id);
            if (!el) return;
            const value = diffs[diffKey];
            if (typeof value === 'undefined' || value === null) return;

            const pct = Math.min((value / this.POSTURE_LIMITS[meta.limitKey]) * 100, 999);
            el.textContent = pct.toFixed(0);
        });
    }

    toggleMonitoring() {
        if (this.isMonitoring) {
            // Pause live monitoring
            this.isMonitoring = false;
            this.pauseMonitoringBtn.textContent = 'Resume Monitoring';
            if (this.countdown) {
                this.countdown.textContent = '--';
            }
        } else {
            // Resume live monitoring
            this.startMonitoring();
            this.pauseMonitoringBtn.textContent = 'Pause Monitoring';
        }
    }

    recalibrate() {
        console.log('Recalibrating...');
        this.isSetupMode = true;
        // Baseline arrays removed in Option A. We use automatic calibration instead
        this.scaleFactor = null;           // average shoulder distance during calibration
        this.calibrationSamples = [];
        this.calibrationFramesNeeded = 60; // ≈2 s at 30 fps
        this.isCalibrating = false;
        
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        if (this.camera) {
            this.camera.stop();
        }
        if (this.video.srcObject) {
            const tracks = this.video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        }
        
        // Move video elements back to setup container
        const setupContainer = this.setupScreen.querySelector('.camera-container');
        const monitorContainer = this.monitorScreen.querySelector('.camera-container');
        
        monitorContainer.removeChild(this.video);
        monitorContainer.removeChild(this.overlay);
        setupContainer.appendChild(this.video);
        setupContainer.appendChild(this.overlay);
        
        this.monitorScreen.classList.remove('active');
        this.setupScreen.classList.add('active');
        
        // Reset UI elements (capture count not used in auto-calibration mode)
        if (this.captureCount) {
            this.captureCount.textContent = '0';
        }
        if (this.captureBtn) {
            this.captureBtn.disabled = true;
        }
        if (this.finishSetupBtn) {
            this.finishSetupBtn.disabled = true;
        }
        
        console.log('Returned to setup mode');
    }

    onPoseResults(results) {
        // Get the current overlay based on mode
        const currentOverlay = this.isSetupMode ? this.overlay : this.monitorOverlay;
        
        if (!currentOverlay) {
            console.error('No overlay found for current mode');
            return;
        }
        
        const ctx = currentOverlay.getContext('2d');
        
        ctx.clearRect(0, 0, currentOverlay.width, currentOverlay.height);
        currentOverlay.width = 400;
        currentOverlay.height = 300;
        
        if (results.poseLandmarks) {
            // Store the latest results
            this.lastPoseResults = results;
            
            // Draw pose landmarks
            drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
                color: '#00FF00',
                lineWidth: 2
            });
            drawLandmarks(ctx, results.poseLandmarks, {
                color: '#FF0000',
                lineWidth: 1,
                radius: 3
            });

            // Handle calibration first
            if (this.isCalibrating) {
                const data = this.extractKeypoints(results.poseLandmarks);
                this.calibrationSamples.push(data.shoulderDistance);
                // Once enough frames collected, compute scaleFactor
                if (this.calibrationSamples.length >= this.calibrationFramesNeeded) {
                    const sum = this.calibrationSamples.reduce((a, b) => a + b, 0);
                    this.scaleFactor = sum / this.calibrationSamples.length;
                    this.isCalibrating = false;
                    console.log('Calibration complete. scaleFactor:', this.scaleFactor.toFixed(4));
                    this.switchToMonitoringMode();
                }
                return; // skip analysis until calibrated
            }

            // Analyze posture once calibrated and monitoring
            if (!this.isSetupMode && this.isMonitoring && this.scaleFactor) {
                this.analyzePosture(results.poseLandmarks);
            }
        }
    }

    // Manual baseline capture removed - app now uses automatic calibration
    // This method is kept for backward compatibility but should not be called
    captureBaseline() {
        console.warn('Manual baseline capture is no longer used. App uses automatic calibration.');
    }

    extractKeypoints(landmarks) {
        // Extract key postural landmarks - focusing only on upper body
        const keypoints = {
            nose: landmarks[0],
            leftEye: landmarks[2],
            rightEye: landmarks[5],
            leftShoulder: landmarks[11],
            rightShoulder: landmarks[12],
            leftEar: landmarks[7],
            rightEar: landmarks[8],
            neck: {
                x: (landmarks[11].x + landmarks[12].x) / 2,
                y: (landmarks[11].y + landmarks[12].y) / 2,
                z: (landmarks[11].z + landmarks[12].z) / 2
            }
        };

        // Calculate ear midpoint for head position
        const earMidpoint = {
            x: (keypoints.leftEar.x + keypoints.rightEar.x) / 2,
            y: (keypoints.leftEar.y + keypoints.rightEar.y) / 2,
            z: (keypoints.leftEar.z + keypoints.rightEar.z) / 2
        };

        // Calculate nose-to-neck angle
        const noseToNeckAngle = Math.atan2(
            keypoints.nose.y - keypoints.neck.y,
            keypoints.nose.x - keypoints.neck.x
        ) * (180 / Math.PI);

        // Calculate forward distance using horizontal (x-axis) displacement only
        const forwardDistance = Math.abs(earMidpoint.x - keypoints.neck.x);
        
        // Calculate vertical deviation relative to shoulder height
        const verticalDeviation = earMidpoint.y - keypoints.neck.y;
        
        // Calculate derived measurements focusing on upper body posture
        return {
            keypoints,
            shoulderSlope: this.calculateSlope(keypoints.leftShoulder, keypoints.rightShoulder),
            neckTilt: this.calculateSlope(keypoints.leftEar, keypoints.rightEar),
            headForward: {
                forward: forwardDistance,
                vertical: verticalDeviation,
                noseAngle: noseToNeckAngle
            },
            // Horizontal shoulder width for scale factor & rounded-shoulder metric
            shoulderDistance: Math.abs(keypoints.leftShoulder.x - keypoints.rightShoulder.x),
            timestamp: Date.now()
        };
    }

    calculateHeadForwardPosition(keypoints) {
        // Calculate the average ear position
        const earMidpoint = {
            x: (keypoints.leftEar.x + keypoints.rightEar.x) / 2,
            y: (keypoints.leftEar.y + keypoints.rightEar.y) / 2,
            z: (keypoints.leftEar.z + keypoints.rightEar.z) / 2
        };

        // Calculate nose-to-neck angle to detect head tilt
        const noseToNeckAngle = Math.atan2(
            keypoints.nose.y - keypoints.neck.y,
            keypoints.nose.x - keypoints.neck.x
        ) * (180 / Math.PI);

        // Calculate forward head position relative to shoulders
        const forwardDistance = this.calculateDistance(earMidpoint, keypoints.neck);
        
        // Calculate vertical deviation (how far down the head is)
        const verticalDeviation = earMidpoint.y - keypoints.neck.y;
        
        return {
            forward: forwardDistance,
            vertical: verticalDeviation,
            noseAngle: noseToNeckAngle
        };
    }

    calculateSlope(point1, point2) {
        return (point2.y - point1.y) / (point2.x - point1.x);
    }

    calculateDistance(point1, point2) {
        return Math.sqrt(
            Math.pow(point2.x - point1.x, 2) + 
            Math.pow(point2.y - point1.y, 2) + 
            Math.pow(point2.z - point1.z, 2)
        );
    }

    calculateNeckAngle(nose, neck) {
        const dx = nose.x - neck.x;
        const dy = nose.y - neck.y;
        return Math.atan2(dy, dx) * (180 / Math.PI);
    }

    // Manual setup finish removed - app now uses automatic calibration
    // This method is kept for backward compatibility but should not be called
    async finishSetup() {
        console.warn('Manual setup finish is no longer used. App uses automatic calibration.');
    }

    // Add cleanup method
    cleanup() {
        console.log('Cleaning up...');
        this.isInitializing = false;
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        if (this.camera) {
            this.camera.stop();
        }
        if (this.video.srcObject) {
            const tracks = this.video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        }
        if (this.pose) {
            this.pose.close();
            this.pose = null;
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PosturePilot();
});