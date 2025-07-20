class PosturePilot {
    constructor() {
        this.pose = null;
        this.camera = null;
        this.isSetupMode = true;
        this.baselineCaptures = [];
        this.baselineData = null;
        this.monitoringInterval = null;
        this.countdownInterval = null;
        this.countdownValue = 30;
        this.shouldAnalyze = false;
        this.isMonitoring = false;
        this.isInitializing = false;  // Add initialization state
        
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
        this.recalibrateBtn = document.getElementById('recalibrate-btn');
        
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
                }, 30000); // 30 second timeout

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
        this.captureBtn.addEventListener('click', () => this.captureBaseline());
        this.finishSetupBtn.addEventListener('click', () => this.finishSetup());
        this.pauseMonitoringBtn.addEventListener('click', () => this.toggleMonitoring());
        this.recalibrateBtn.addEventListener('click', () => this.recalibrate());
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
        this.captureBtn.disabled = false;
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
        console.log('Starting monitoring...');
        this.isMonitoring = true;
        this.countdownValue = 30;
        this.shouldAnalyze = false;
        this.currentStatus = null;
        this.updateCountdown();
        
        // Start the countdown for posture checks
        this.countdownInterval = setInterval(() => {
            console.log('Countdown:', this.countdownValue);
            this.countdownValue -= 1;
            this.updateCountdown();
            
            if (this.countdownValue <= 0) {
                console.log('Countdown reached 0, should analyze posture now');
                this.shouldAnalyze = true;
                this.countdownValue = 30;
            }
        }, 1000);
    }

    updateCountdown() {
        this.countdown.textContent = this.countdownValue;
    }

    analyzePosture(landmarks) {
        const currentData = this.extractKeypoints(landmarks);
        
        // Debug current data
        console.log('Current Data:', currentData);
        console.log('Baseline Data:', this.baselineData);
        
        // More sensitive heuristics for posture analysis
        const shoulderSlopeDiff = Math.abs(currentData.shoulderSlope - this.baselineData.shoulderSlope);
        const neckTiltDiff = Math.abs(currentData.neckTilt - this.baselineData.neckTilt);
        const headForwardDiff = Math.abs(currentData.headForward.forward - this.baselineData.headForward.forward);
        const headVerticalDiff = currentData.headForward.vertical - this.baselineData.headForward.vertical;
        const noseAngleDiff = currentData.headForward.noseAngle - this.baselineData.headForward.noseAngle;
        const shoulderDistanceDiff = Math.abs(currentData.shoulderDistance - this.baselineData.shoulderDistance);
        
        // Debug differences
        console.log('Posture Differences:', {
            shoulderSlopeDiff,
            neckTiltDiff,
            headForwardDiff,
            headVerticalDiff,
            noseAngleDiff,
            shoulderDistanceDiff
        });
        
        let status = 'good';
        let message = 'Good Posture';
        let shouldNotify = false;
        
        // Forward head posture check - more comprehensive
        if (headForwardDiff > 0.015 || headVerticalDiff > 0.01 || Math.abs(noseAngleDiff) > 10) {
            console.log('Head position exceeds thresholds:', {
                headForwardDiff,
                headVerticalDiff,
                noseAngleDiff
            });
            
            // Check severity
            if (headForwardDiff > 0.03 || headVerticalDiff > 0.02 || Math.abs(noseAngleDiff) > 20) {
                status = 'bad';
                message = 'Severe Forward Head Posture';
            } else {
                status = 'warning';
                message = 'Forward Head Posture';
            }
            shouldNotify = true;
            console.log('Detected forward head posture:', {
                forward: headForwardDiff.toFixed(4),
                vertical: headVerticalDiff.toFixed(4),
                noseAngle: noseAngleDiff.toFixed(4)
            });
        }
        
        // Neck tilt check (using ears)
        if (neckTiltDiff > 0.05) {
            const worstStatus = status === 'bad' ? status : 'warning';
            status = worstStatus;
            message = status === 'bad' ? message + ' with Head Tilt' : 'Head Tilt';
            shouldNotify = true;
            console.log('Detected head tilt:', neckTiltDiff.toFixed(4));
        }
        
        // Update UI and show notification
        this.updatePostureStatus(status, message);
        
        if (shouldNotify) {
            window.electronAPI.showNotification({
                title: 'PosturePilot Alert',
                body: `${message}. Please adjust your posture.`,
                type: status
            });
        }
        
        // Log posture data
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
    }

    toggleMonitoring() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
            this.shouldAnalyze = false;
            this.isMonitoring = false;
            this.pauseMonitoringBtn.textContent = 'Resume Monitoring';
        } else {
            this.startMonitoring();
            this.pauseMonitoringBtn.textContent = 'Pause Monitoring';
        }
    }

    recalibrate() {
        console.log('Recalibrating...');
        this.isSetupMode = true;
        this.baselineCaptures = [];
        this.baselineData = null;
        this.shouldAnalyze = false;
        
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
        
        this.captureCount.textContent = '0';
        this.captureBtn.disabled = false;
        this.finishSetupBtn.disabled = true;
        
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
        currentOverlay.width = 640;
        currentOverlay.height = 480;
        
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

            // Only analyze posture if we're in monitoring mode and flag is set
            if (!this.isSetupMode && this.baselineData && this.shouldAnalyze) {
                console.log('Starting posture analysis...');
                this.analyzePosture(results.poseLandmarks);
                this.shouldAnalyze = false;
                console.log('Analysis complete, status:', this.currentStatus);
            }
        }
    }

    captureBaseline() {
        console.log('Attempting to capture baseline...');
        if (this.baselineCaptures.length < 5) {
            if (!this.lastPoseResults || !this.lastPoseResults.poseLandmarks) {
                console.log('No valid pose data available');
                alert('Please ensure you are visible and centered in the camera frame');
                return;
            }

            console.log('Capturing pose data...');
            const keypoints = this.extractKeypoints(this.lastPoseResults.poseLandmarks);
            this.baselineCaptures.push(keypoints);
            this.captureCount.textContent = this.baselineCaptures.length;
            
            if (this.baselineCaptures.length >= 5) {
                console.log('Baseline capture complete');
                this.finishSetupBtn.disabled = false;
                this.captureBtn.disabled = true;
            } else {
                console.log(`Captured ${this.baselineCaptures.length} of 5 poses`);
            }
        }
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

        // Calculate forward distance
        const forwardDistance = this.calculateDistance(earMidpoint, keypoints.neck);
        
        // Calculate vertical deviation
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
            shoulderDistance: this.calculateDistance(keypoints.leftShoulder, keypoints.rightShoulder),
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

    async finishSetup() {
        console.log('Calculating baseline from captures:', this.baselineCaptures);
        // Calculate baseline averages
        this.baselineData = this.calculateBaselineAverages();
        console.log('Calculated baseline data:', this.baselineData);
        
        // Save baseline data
        await window.electronAPI.saveBaselineData(this.baselineData);
        
        // Switch to monitoring mode
        this.switchToMonitoringMode();
    }

    calculateBaselineAverages() {
        const avgData = {
            shoulderSlope: 0,
            neckTilt: 0,
            headForward: {
                forward: 0,
                vertical: 0,
                noseAngle: 0
            },
            shoulderDistance: 0,
            count: this.baselineCaptures.length
        };

        this.baselineCaptures.forEach(capture => {
            avgData.shoulderSlope += capture.shoulderSlope;
            avgData.neckTilt += capture.neckTilt;
            avgData.headForward.forward += capture.headForward.forward;
            avgData.headForward.vertical += capture.headForward.vertical;
            avgData.headForward.noseAngle += capture.headForward.noseAngle;
            avgData.shoulderDistance += capture.shoulderDistance;
        });

        // Calculate averages
        avgData.shoulderSlope /= avgData.count;
        avgData.neckTilt /= avgData.count;
        avgData.headForward.forward /= avgData.count;
        avgData.headForward.vertical /= avgData.count;
        avgData.headForward.noseAngle /= avgData.count;
        avgData.shoulderDistance /= avgData.count;

        return avgData;
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