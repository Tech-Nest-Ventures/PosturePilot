// Authentication module for PosturePilot
// Handles login, signup, token management, and API communication

class AuthManager {
    constructor() {
        // API base URL - can be configured via window.API_BASE_URL or defaults to production
        // To configure, set window.API_BASE_URL before auth.js loads
        this.apiBaseUrl = window.API_BASE_URL || 'https://backend-production-5eec.up.railway.app/api/v1';
        this.token = null;
        this.user = null;
        this.isAuthenticated = false;
        this.initialized = false;
        
        // Don't initialize immediately - wait for electronAPI to be available
        // This prevents crashes in MAS builds where electronAPI might not be ready
        this.waitForElectronAPI().then(() => {
            this.init();
        }).catch((error) => {
            console.error('Failed to initialize AuthManager:', error);
            // Continue without authentication - app can still work
            this.initialized = true;
        });
    }

    async waitForElectronAPI() {
        // Wait for electronAPI to be available with timeout
        const ELECTRON_API_TIMEOUT = 10000; // 10 seconds max wait
        const POLL_INTERVAL = 100; // Check every 100ms
        
        return new Promise((resolve, reject) => {
            // If electronAPI already exists, resolve immediately
            if (window.electronAPI) {
                resolve();
                return;
            }
            
            let checkInterval;
            let timeoutId;
            
            // Set up polling interval
            checkInterval = setInterval(() => {
                if (window.electronAPI) {
                    clearInterval(checkInterval);
                    clearTimeout(timeoutId);
                    resolve();
                }
            }, POLL_INTERVAL);
            
            // Set up timeout to prevent infinite waiting
            timeoutId = setTimeout(() => {
                clearInterval(checkInterval);
                console.warn('electronAPI initialization timeout - AuthManager will work in limited mode');
                // Resolve instead of reject to allow app to continue
                // Auth features will be disabled but app won't crash
                resolve();
            }, ELECTRON_API_TIMEOUT);
        });
    }

    async init() {
        // Check if electronAPI is available
        if (!window.electronAPI) {
            console.warn('electronAPI not available - AuthManager running in limited mode');
            this.initialized = true;
            return;
        }
        
        // MAS builds: NO network calls on startup to prevent DNS crashes
        const isMas = window.electronAPI?.isMas;
        if (isMas) {
            console.log('MAS build: Skipping ALL startup network calls to prevent sandbox crashes');
            // Load token from storage but don't verify (no network call)
            try {
                const storedToken = await window.electronAPI.getAuthToken();
                if (storedToken) {
                    this.token = storedToken;
                    this.isAuthenticated = true;
                    // Token will be verified on first user action (login, etc.)
                }
            } catch (error) {
                console.error('Error loading auth token:', error);
                // Don't crash - continue without authentication
            }
            this.initialized = true;
            return; // Exit early - no network calls
        }
        
        // Non-MAS builds: Normal startup behavior
        try {
            const storedToken = await window.electronAPI.getAuthToken();
            if (storedToken) {
                this.token = storedToken;
                this.isAuthenticated = true;
                // Verify token is still valid (only in dev/DMG builds)
                await this.verifyToken();
            }
        } catch (error) {
            console.error('Error loading auth token:', error);
            // Don't crash - continue without authentication
        } finally {
            this.initialized = true;
        }
    }

    async login(username, password) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                // API returns error in 'message' field for 400 errors
                throw new Error(data.message || data.error || 'Login failed');
            }

            if (data.token) {
                this.token = data.token;
                this.user = data.user || { username };
                this.isAuthenticated = true;
                
                // Store token securely
                await window.electronAPI.setAuthToken(this.token);
                
                return { success: true, user: this.user };
            } else {
                throw new Error('No token received from server');
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    }

    async signup(username, password) {
        try {
            // Check if signup endpoint exists - if not, return error
            const response = await fetch(`${this.apiBaseUrl}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                // API returns error in 'message' field for 400 errors
                throw new Error(data.message || data.error || 'Signup failed');
            }

            if (data.token) {
                this.token = data.token;
                this.user = data.user || { username };
                this.isAuthenticated = true;
                
                // Store token securely
                await window.electronAPI.setAuthToken(this.token);
                
                return { success: true, user: this.user };
            } else {
                throw new Error('No token received from server');
            }
        } catch (error) {
            console.error('Signup error:', error);
            // If endpoint doesn't exist (404), provide helpful message
            if (error.message.includes('404') || error.message.includes('Not Found')) {
                return { success: false, error: 'Signup endpoint not available. Please contact support to create an account.' };
            }
            return { success: false, error: error.message };
        }
    }

    async logout() {
        this.token = null;
        this.user = null;
        this.isAuthenticated = false;
        
        // Remove stored token
        await window.electronAPI.removeAuthToken();
    }

    async verifyToken() {
        // MAS builds: Block ALL network calls in verifyToken() to prevent DNS crashes
        // This method should only be called on user action, not startup
        const isMas = window.electronAPI?.isMas;
        if (isMas) {
            console.log('MAS build: verifyToken() blocked – no network calls allowed to prevent sandbox crash');
            // Return false to indicate token needs verification, but don't crash the app
            return false;
        }
        
        if (!this.token) {
            this.isAuthenticated = false;
            return false;
        }
        
        // Try to verify token by making a lightweight API call
        // If verify endpoint doesn't exist, we'll test with posture stats endpoint
        try {
            // Try using posture stats as a token verification method
            const response = await fetch(`${this.apiBaseUrl}/posture/stats?days=1`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                },
            });

            if (!response.ok) {
                // Token is invalid (401 or 403)
                if (response.status === 401 || response.status === 403) {
                    await this.logout();
                    return false;
                }
                // Other errors might be server issues, keep token but mark as unverified
                return false;
            }

            // Token is valid
            this.isAuthenticated = true;
            return true;
        } catch (error) {
            console.error('Token verification error:', error);
            // On network errors, keep the token but don't mark as verified
            // This allows offline usage
            // In MAS builds, this is expected on startup - token will be verified on user action
            if (isMas) {
                console.log('MAS build: Network error during token verification (expected on startup)');
            }
            return false;
        }
    }

    getAuthHeaders() {
        if (!this.token) {
            return {};
        }
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
        };
    }

    async sendPostureData(postureData) {
        if (!this.isAuthenticated || !this.token) {
            console.log('Not authenticated, skipping posture data sync');
            return { success: false, error: 'Not authenticated' };
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/posture`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(postureData),
            });

            const data = await response.json();

            if (!response.ok) {
                // If token is invalid, logout
                if (response.status === 401 || response.status === 403) {
                    await this.logout();
                }
                // API returns error in 'message' or 'error' field
                throw new Error(data.message || data.error || 'Failed to save posture data');
            }

            return { success: true, data };
        } catch (error) {
            console.error('Error sending posture data:', error);
            return { success: false, error: error.message };
        }
    }
    
    async getPostureStats(days = 1) {
        if (!this.isAuthenticated || !this.token) {
            console.log('Not authenticated, cannot fetch stats');
            return { success: false, error: 'Not authenticated' };
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/posture/stats?days=${days}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                // If token is invalid, logout
                if (response.status === 401 || response.status === 403) {
                    await this.logout();
                }
                throw new Error(data.error || 'Failed to fetch posture statistics');
            }

            return { success: true, data };
        } catch (error) {
            console.error('Error fetching posture stats:', error);
            return { success: false, error: error.message };
        }
    }

    getToken() {
        return this.token;
    }

    getUser() {
        return this.user;
    }

    getIsAuthenticated() {
        return this.isAuthenticated;
    }
}

// Export singleton instance - but delay until DOM is ready
// This ensures electronAPI is available and DOM elements exist
let authManager;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        authManager = new AuthManager();
        window.authManager = authManager;
    });
} else {
    // DOM already loaded
    authManager = new AuthManager();
    window.authManager = authManager;
}

