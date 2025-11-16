# Authentication Setup for PosturePilot

## Overview

PosturePilot now includes an authentication layer that allows users to:
- Sign up for an account
- Sign in to sync data across devices
- Receive daily posture reports via email
- Aggregate posture data from multiple devices

## Features

### Authentication Screen
- **Login Form**: Sign in with email and password
- **Signup Form**: Create a new account with email and password
- **Skip Option**: Users can continue without an account (local-only mode)

### Data Synchronization
- When authenticated, posture data is automatically synced to the backend server
- Data includes:
  - Timestamp
  - Posture status (good/warning/bad)
  - Posture score (0-100)
  - Posture grade (A-F)
  - Detailed measurements (head forward, neck tilt, shoulder slope)

### Token Storage
- JWT tokens are stored securely in the app's user data directory
- Tokens are automatically loaded on app startup
- Tokens are validated with the backend server

## Configuration

### API Base URL

By default, the app connects to `https://backend-production-5eec.up.railway.app/api/v1`. To change this, set the `API_BASE_URL` before the app loads:

```javascript
// In index.html, before auth.js loads:
<script>
  window.API_BASE_URL = 'https://your-backend-server.com/api';
</script>
<script src="auth.js"></script>
```

Or configure it via environment variables in your build process.

## Backend API Endpoints

The app expects the following endpoints on your backend:

### Authentication
- `POST /api/v1/auth/login` - Sign in
  - Body: `{ username: string, password: string }`
  - Returns: `{ token: string, user: { id: string, username: string, firstName: string, lastName: string, country: string, language: string } }`
  - Error (400): `{ message: string }`

- `POST /api/v1/auth/signup` - Create new account (if available)
  - Body: `{ username: string, password: string }`
  - Returns: `{ token: string, user: object }`
  - Note: Signup endpoint may not be available - users may need to contact support

### Posture Data
- `POST /api/v1/posture` - Save posture data
  - Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
  - Body: `{ posture: string, grade: string, score: number, feedback: string }`
  - Returns (201): `{ message: "Posture data saved" }`
  - Error (400): `{ error: string }`
  - Error (401/403): `{ message: string }`

- `GET /api/v1/posture/stats?days=1` - Get posture statistics
  - Headers: `Authorization: Bearer <token>`
  - Query: `days` (optional, default: 1)
  - Returns: `{ averageScore: number, averageGrade: string, totalEntries: number, timeRange: string, debug: object }`

## File Structure

### New Files
- `src/auth.js` - Authentication manager (API calls, token management)
- `src/auth-ui.js` - Authentication UI handler (form handling, navigation)

### Modified Files
- `src/index.html` - Added authentication screen
- `src/styles.css` - Added authentication styles
- `src/app.js` - Added auth check and data sync
- `src/main.js` - Added token storage IPC handlers
- `src/preload.js` - Added authentication API to electronAPI

## User Flow

1. **App Launch**: 
   - If no token exists → Show authentication screen
   - If token exists → Verify token → Show setup screen if valid, auth screen if invalid

2. **Authentication**:
   - User can sign up, sign in, or skip authentication
   - On successful auth → Token stored → Proceed to setup screen

3. **Posture Monitoring**:
   - If authenticated → Data synced to backend in real-time
   - If not authenticated → Data stored locally only

## Security Notes

- Tokens are stored in the app's user data directory (not in plain text in code)
- All API requests use HTTPS in production (configure via API_BASE_URL)
- Passwords are never stored locally
- Token validation happens on app startup and on API errors

## Testing

To test without a backend:
1. Click "Continue without account" to skip authentication
2. App will work in local-only mode
3. No data will be synced to backend

To test with a backend:
1. Ensure your backend server is running
2. Configure `API_BASE_URL` if needed
3. Sign up or sign in with valid credentials
4. Posture data will sync automatically

