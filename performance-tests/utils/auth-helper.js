import http from 'k6/http';
import { check } from 'k6';
import { config } from '../config/test-config.js';

/**
 * Authentication helper for K6 tests
 * Handles JWT token-based authentication for the NutriStats API
 */

/**
 * Register a new test user
 * @param {Object} userData - User registration data
 * @returns {Object} Registration response with token
 */
export function registerUser(userData = null) {
    const user = userData || {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        password: 'TestPassword123',
        confirmPassword: 'TestPassword123'
    };

    const response = http.post(`${config.baseUrl}/api/auth/register`, JSON.stringify(user), {
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const success = check(response, {
        'registration successful': (r) => r.status === 201,
        'token received': (r) => {
            try {
                const body = JSON.parse(r.body);
                return body.token !== undefined;
            } catch (e) {
                return false;
            }
        }
    });

    if (success && response.status === 201) {
        const body = JSON.parse(response.body);
        return {
            token: body.token,
            user: body.user,
            success: true
        };
    }

    console.error('Registration failed:', response.body);
    return { success: false, error: response.body };
}

/**
 * Login with existing user credentials
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Object} Login response with token
 */
export function loginUser(email = null, password = null) {
    const credentials = {
        email: email || config.testUser.email,
        password: password || config.testUser.password
    };

    const response = http.post(`${config.baseUrl}/api/auth/login`, JSON.stringify(credentials), {
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const success = check(response, {
        'login successful': (r) => r.status === 200,
        'token received': (r) => {
            try {
                const body = JSON.parse(r.body);
                return body.token !== undefined;
            } catch (e) {
                return false;
            }
        }
    });

    if (success && response.status === 200) {
        const body = JSON.parse(response.body);
        return {
            token: body.token,
            user: body.user,
            success: true
        };
    }

    console.error('Login failed:', response.body);
    return { success: false, error: response.body };
}

/**
 * Get authorization headers with Bearer token
 * @param {string} token - JWT token
 * @returns {Object} Headers object with Authorization
 */
export function getAuthHeaders(token) {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

/**
 * Verify token is valid
 * @param {string} token - JWT token to verify
 * @returns {boolean} True if token is valid
 */
export function verifyToken(token) {
    const response = http.get(`${config.baseUrl}/api/auth/verify`, {
        headers: getAuthHeaders(token)
    });

    return check(response, {
        'token is valid': (r) => r.status === 200
    });
}

/**
 * Setup authentication for a test user
 * This function will try to login first, and if that fails, register a new user
 * @returns {Object} Authentication result with token
 */
export function setupAuth() {
    // First try to login with existing credentials
    let authResult = loginUser();

    if (!authResult.success) {
        console.log('Login failed, attempting to register new user...');
        // If login fails, register a new user
        authResult = registerUser(config.testUser);
    }

    if (!authResult.success) {
        throw new Error('Failed to authenticate: ' + authResult.error);
    }

    console.log('Authentication successful for user:', authResult.user.email);
    return authResult;
}