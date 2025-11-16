// Authentication UI handler
// Manages the authentication screen, form handling, and navigation

class AuthUI {
    constructor() {
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
        
        this.bindEvents();
    }

    bindEvents() {
        // Form submissions
        this.loginFormElement.addEventListener('submit', (e) => this.handleLogin(e));
        this.signupFormElement.addEventListener('submit', (e) => this.handleSignup(e));
        
        // Switch between login and signup
        document.getElementById('switch-to-signup').addEventListener('click', (e) => {
            e.preventDefault();
            this.showSignup();
        });
        
        document.getElementById('switch-to-login').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLogin();
        });
        
        // Skip authentication
        document.getElementById('skip-auth').addEventListener('click', (e) => {
            e.preventDefault();
            this.skipAuthentication();
        });
        
        document.getElementById('skip-auth-signup').addEventListener('click', (e) => {
            e.preventDefault();
            this.skipAuthentication();
        });
    }

    showLogin() {
        this.loginForm.classList.add('active');
        this.signupForm.classList.remove('active');
        this.hideError('login');
        this.hideError('signup');
    }

    showSignup() {
        this.signupForm.classList.add('active');
        this.loginForm.classList.remove('active');
        this.hideError('login');
        this.hideError('signup');
    }

    showError(type, message) {
        const errorElement = type === 'login' ? this.loginError : this.signupError;
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    hideError(type) {
        const errorElement = type === 'login' ? this.loginError : this.signupError;
        errorElement.style.display = 'none';
    }

    setLoading(type, isLoading) {
        const submitBtn = type === 'login' ? this.loginSubmitBtn : this.signupSubmitBtn;
        submitBtn.disabled = isLoading;
        submitBtn.textContent = isLoading ? 'Loading...' : (type === 'login' ? 'Sign In' : 'Sign Up');
    }

    async handleLogin(e) {
        e.preventDefault();
        this.hideError('login');
        
        const username = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        
        if (!username || !password) {
            this.showError('login', 'Please enter both email and password');
            return;
        }
        
        this.setLoading('login', true);
        
        try {
            const result = await window.authManager.login(username, password);
            
            if (result.success) {
                // Successfully logged in
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
        
        const username = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;
        
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
        
        this.setLoading('signup', true);
        
        try {
            const result = await window.authManager.signup(username, password);
            
            if (result.success) {
                // Successfully signed up
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
        this.authScreen.classList.remove('active');
        this.setupScreen.classList.add('active');
        
        // Initialize the PosturePilot app if it exists
        if (window.posturePilot) {
            // Bind events if not already bound
            if (!window.posturePilot.eventsBound) {
                window.posturePilot.bindEvents();
                window.posturePilot.eventsBound = true;
            }
        }
    }

    showAuthScreen() {
        this.authScreen.classList.add('active');
        this.setupScreen.classList.remove('active');
        this.monitorScreen.classList.remove('active');
    }
}

// Initialize auth UI when DOM is ready
let authUI;
document.addEventListener('DOMContentLoaded', () => {
    authUI = new AuthUI();
    window.authUI = authUI;
});

