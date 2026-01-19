// Authentication UI handler
// Manages the authentication screen, form handling, and navigation

class AuthUI {
    constructor() {
        // Initialize element references - will be set when DOM is ready
        this.authScreen = null;
        this.loginForm = null;
        this.signupForm = null;
        this.setupScreen = null;
        this.monitorScreen = null;
        
        this.loginFormElement = null;
        this.signupFormElement = null;
        this.loginError = null;
        this.signupError = null;
        
        this.loginSubmitBtn = null;
        this.signupSubmitBtn = null;
        
        this.initialized = false;
        
        // Wait for DOM to be ready before accessing elements
        this.initializeElements();
    }
    
    initializeElements() {
        // Check if DOM is ready
        if (document.readyState === 'loading') {
            // DOM not ready yet, wait for it
            document.addEventListener('DOMContentLoaded', () => {
                this.setupElements();
            });
        } else {
            // DOM already ready
            this.setupElements();
        }
    }
    
    setupElements() {
        try {
            // Get all DOM elements with null checks
            this.authScreen = document.getElementById('auth-screen');
            this.loginForm = document.getElementById('login-form');
            this.signupForm = document.getElementById('signup-form');
            this.setupScreen = document.getElementById('setup-screen');
            this.monitorScreen = document.getElementById('monitor-screen');
            
            this.loginFormElement = document.getElementById('login-form-element');
            this.signupFormElement = document.getElementById('signup-form-element');
            this.loginError = document.getElementById('login-error');
            this.signupError = document.getElementById('signup-error');
            
            this.loginSubmitBtn = document.getElementById('login-submit-btn');
            this.signupSubmitBtn = document.getElementById('signup-submit-btn');
            
            // Verify critical elements exist
            if (!this.authScreen || !this.loginForm || !this.signupForm) {
                console.error('Critical AuthUI elements not found in DOM');
                return;
            }
            
            // Bind events only after elements are confirmed to exist
            this.bindEvents();
            this.initialized = true;
            
            console.log('AuthUI initialized successfully');
        } catch (error) {
            console.error('Error initializing AuthUI elements:', error);
            // Don't crash - app can still function without auth UI
        }
    }

    bindEvents() {
        // Only bind events if elements exist
        if (!this.loginFormElement || !this.signupFormElement) {
            console.warn('Cannot bind AuthUI events - form elements not found');
            return;
        }
        
        try {
            // Form submissions
            this.loginFormElement.addEventListener('submit', (e) => this.handleLogin(e));
            this.signupFormElement.addEventListener('submit', (e) => this.handleSignup(e));
            
            // Switch between login and signup
            const switchToSignup = document.getElementById('switch-to-signup');
            const switchToLogin = document.getElementById('switch-to-login');
            const skipAuth = document.getElementById('skip-auth');
            const skipAuthSignup = document.getElementById('skip-auth-signup');
            
            if (switchToSignup) {
                switchToSignup.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showSignup();
                });
            }
            
            if (switchToLogin) {
                switchToLogin.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showLogin();
                });
            }
            
            // Skip authentication
            if (skipAuth) {
                skipAuth.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.skipAuthentication();
                });
            }
            
            if (skipAuthSignup) {
                skipAuthSignup.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.skipAuthentication();
                });
            }
        } catch (error) {
            console.error('Error binding AuthUI events:', error);
        }
    }

    showLogin() {
        if (!this.loginForm || !this.signupForm) return;
        this.loginForm.classList.add('active');
        this.signupForm.classList.remove('active');
        this.hideError('login');
        this.hideError('signup');
    }

    showSignup() {
        if (!this.loginForm || !this.signupForm) return;
        this.signupForm.classList.add('active');
        this.loginForm.classList.remove('active');
        this.hideError('login');
        this.hideError('signup');
    }

    showError(type, message) {
        const errorElement = type === 'login' ? this.loginError : this.signupError;
        if (!errorElement) {
            console.warn(`Cannot show ${type} error - element not found`);
            return;
        }
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    hideError(type) {
        const errorElement = type === 'login' ? this.loginError : this.signupError;
        if (!errorElement) return;
        errorElement.style.display = 'none';
    }

    setLoading(type, isLoading) {
        const submitBtn = type === 'login' ? this.loginSubmitBtn : this.signupSubmitBtn;
        if (!submitBtn) {
            console.warn(`Cannot set loading state for ${type} - button not found`);
            return;
        }
        submitBtn.disabled = isLoading;
        submitBtn.textContent = isLoading ? 'Loading...' : (type === 'login' ? 'Sign In' : 'Sign Up');
    }

    async handleLogin(e) {
        e.preventDefault();
        this.hideError('login');
        
        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');
        
        if (!emailInput || !passwordInput) {
            console.error('Login form inputs not found');
            return;
        }
        
        const username = emailInput.value.trim();
        const password = passwordInput.value;
        
        if (!username || !password) {
            this.showError('login', 'Please enter both email and password');
            return;
        }
        
        // Check if authManager is available
        if (!window.authManager) {
            this.showError('login', 'Authentication system not ready. Please wait and try again.');
            return;
        }
        
        this.setLoading('login', true);
        
        try {
            const result = await window.authManager.login(username, password);
            
            if (result.success) {
                // Successfully logged in - hide auth screen
                console.log('Login successful, hiding auth screen');
                this.hideAuthScreen();
            } else {
                this.showError('login', result.error || 'Login failed. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('login', 'An error occurred. Please try again.');
        } finally {
            this.setLoading('login', false);
        }
    }

    async handleSignup(e) {
        e.preventDefault();
        this.hideError('signup');
        
        const emailInput = document.getElementById('signup-email');
        const passwordInput = document.getElementById('signup-password');
        const confirmPasswordInput = document.getElementById('signup-confirm-password');
        
        if (!emailInput || !passwordInput || !confirmPasswordInput) {
            console.error('Signup form inputs not found');
            return;
        }
        
        const username = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (!username || !password || !confirmPassword) {
            this.showError('signup', 'Please fill in all fields');
            return;
        }
        
        if (password.length < 6) {
            this.showError('signup', 'Password must be at least 6 characters');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showError('signup', 'Passwords do not match');
            return;
        }
        
        // Check if authManager is available
        if (!window.authManager) {
            this.showError('signup', 'Authentication system not ready. Please wait and try again.');
            return;
        }
        
        this.setLoading('signup', true);
        
        try {
            const result = await window.authManager.signup(username, password);
            
            if (result.success) {
                // Successfully signed up - hide auth screen
                console.log('Signup successful, hiding auth screen');
                this.hideAuthScreen();
            } else {
                this.showError('signup', result.error || 'Signup failed. Please try again.');
            }
        } catch (error) {
            console.error('Signup error:', error);
            this.showError('signup', 'An error occurred. Please try again.');
        } finally {
            this.setLoading('signup', false);
        }
    }

    skipAuthentication() {
        // User chose to continue without account
        this.hideAuthScreen();
    }

    hideAuthScreen() {
        // Re-fetch elements in case they weren't available during initialization
        const authScreen = document.getElementById('auth-screen');
        const setupScreen = document.getElementById('setup-screen');
        const monitorScreen = document.getElementById('monitor-screen');
        
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
            // Ensure auth screen is hidden - use CSS classes
            if (authScreen) {
                authScreen.classList.remove('active');
            }
            
            // Show setup screen - use CSS classes
            if (setupScreen) {
                setupScreen.classList.add('active');
            }
            
            // Ensure monitor screen is hidden
            if (monitorScreen) {
                monitorScreen.classList.remove('active');
            }
            
            // Update our references
            this.authScreen = authScreen;
            this.setupScreen = setupScreen;
            this.monitorScreen = monitorScreen;
            
            // Initialize the PosturePilot app if it exists
            if (window.posturePilot) {
                // Bind events if not already bound
                if (!window.posturePilot.eventsBound) {
                    window.posturePilot.bindEvents();
                    window.posturePilot.eventsBound = true;
                }
                
                // Verify video elements are accessible
                const video = document.getElementById('video');
                const cameraContainer = setupScreen?.querySelector('.camera-container');
                const startCameraBtn = document.getElementById('start-camera-btn');
                
                console.log('Auth screen hidden, setup screen shown');
                console.log('Setup screen active class:', setupScreen?.classList.contains('active'));
                console.log('Auth screen active class:', authScreen?.classList.contains('active'));
                console.log('Video element found:', !!video);
                console.log('Camera container found:', !!cameraContainer);
                console.log('Start camera button found:', !!startCameraBtn);
                console.log('Setup screen display style:', setupScreen ? window.getComputedStyle(setupScreen).display : 'not-found');
            }
        });
    }

    showAuthScreen() {
        // Re-fetch elements in case they weren't available during initialization
        const authScreen = document.getElementById('auth-screen');
        const setupScreen = document.getElementById('setup-screen');
        const monitorScreen = document.getElementById('monitor-screen');
        
        if (authScreen) {
            authScreen.classList.add('active');
            this.authScreen = authScreen;
        }
        if (setupScreen) {
            setupScreen.classList.remove('active');
            this.setupScreen = setupScreen;
        }
        if (monitorScreen) {
            monitorScreen.classList.remove('active');
            this.monitorScreen = monitorScreen;
        }
    }
}

// Initialize auth UI when DOM is ready
let authUI;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        authUI = new AuthUI();
        window.authUI = authUI;
    });
} else {
    // DOM already loaded
    authUI = new AuthUI();
    window.authUI = authUI;
}

