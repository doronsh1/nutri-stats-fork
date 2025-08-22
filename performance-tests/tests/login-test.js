import { check, group, sleep } from 'k6';
import http from 'k6/http';
import { config } from '../config/test-config.js';

/**
 * Login Performance Test
 * 
 * PURPOSE:
 * This test focuses specifically on the user authentication and login flow performance,
 * simulating realistic user login behavior including page access, authentication,
 * and post-login dashboard loading. Critical for user experience optimization.
 * 
 * WHAT IT TESTS:
 * - Landing page access and redirect performance
 * - User authentication system under load
 * - Post-login dashboard and page loading times
 * - Token verification and session management
 * - Essential API calls after successful login
 * - Complete login-to-dashboard user experience
 * 
 * REALISTIC SCENARIOS:
 * - Athletes logging in before training sessions
 * - Coaches accessing system during team meetings
 * - Multiple users logging in simultaneously (team scenarios)
 * - Mobile and web login performance comparison
 * - Session management during extended usage periods
 * 
 * LOAD PATTERN:
 * - Gradual ramp: 10 → 20 users over 3 minutes
 * - Simulates typical login patterns throughout the day
 * - Tests authentication system scalability
 * 
 * SUCCESS CRITERIA:
 * - <2% failure rate for login operations
 * - <1s response time for authentication
 * - <500ms for login-specific operations
 * - <800ms for post-login page loads
 * - Successful token management and verification
 */
export const options = {
    stages: [
        { duration: '30s', target: 10 },  // Ramp up to 10 users
        { duration: '2m', target: 20 },   // Scale to 20 users
        { duration: '30s', target: 0 },   // Ramp down
    ],

    thresholds: {
        http_req_duration: ['p(95)<1000'],  // 95% under 1s
        http_req_failed: ['rate<0.02'],     // Less than 2% failures
        checks: ['rate>0.95'],              // 95% checks pass
        'login_duration': ['p(95)<500'],    // Login specifically under 500ms
        'page_load_duration': ['p(95)<800'] // Page loads under 800ms
    }
};

// Custom metrics for login flow
import { Trend } from 'k6/metrics';
const loginDuration = new Trend('login_duration');
const pageLoadDuration = new Trend('page_load_duration');

export default function () {
    // Test 1: Landing page access
    group('Landing Page Access', function () {
        const startTime = Date.now();

        const response = http.get(`${config.baseUrl}/`, {
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });

        check(response, {
            'landing page loads': (r) => r.status === 200,
            'redirects to login': (r) => r.url.includes('login.html') || r.status === 302
        });

        pageLoadDuration.add(Date.now() - startTime);
        sleep(0.5);
    });

    // Test 2: Login process
    group('User Login Flow', function () {
        const loginStart = Date.now();

        // Perform login
        const loginResponse = http.post(`${config.baseUrl}/api/auth/login`,
            JSON.stringify({
                email: config.testUser.email,
                password: config.testUser.password
            }), {
            headers: {
                'Content-Type': 'application/json',
                'Accept': '*/*',
                'Origin': config.baseUrl,
                'Referer': `${config.baseUrl}/login.html`
            }
        }
        );

        const loginSuccess = check(loginResponse, {
            'login request successful': (r) => r.status === 200,
            'login returns token': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return body.token !== undefined;
                } catch (e) {
                    return false;
                }
            },
            'login returns user data': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return body.user && body.user.email !== undefined;
                } catch (e) {
                    return false;
                }
            }
        });

        loginDuration.add(Date.now() - loginStart);

        // Extract token for subsequent requests
        let token = null;
        if (loginSuccess && loginResponse.status === 200) {
            try {
                const loginData = JSON.parse(loginResponse.body);
                token = loginData.token;
            } catch (e) {
                console.error('Failed to parse login response');
            }
        }

        sleep(0.3);

        // Test 3: Post-login page access (if login successful)
        if (token) {
            group('Post-Login Dashboard Access', function () {
                const pageStart = Date.now();

                // Access diary page (main dashboard)
                const diaryResponse = http.get(`${config.baseUrl}/diary.html`, {
                    headers: {
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Referer': `${config.baseUrl}/login.html`
                    }
                });

                check(diaryResponse, {
                    'diary page loads': (r) => r.status === 200,
                    'diary page content': (r) => r.body.includes('diary') || r.body.includes('meal')
                });

                pageLoadDuration.add(Date.now() - pageStart);
                sleep(0.2);
            });

            // Test 4: Essential API calls after login
            group('Post-Login API Validation', function () {
                const authHeaders = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': '*/*',
                    'Referer': `${config.baseUrl}/diary.html`
                };

                // Token verification
                const verifyResponse = http.get(`${config.baseUrl}/api/auth/verify`, {
                    headers: authHeaders
                });

                check(verifyResponse, {
                    'token verification successful': (r) => r.status === 200,
                    'token is valid': (r) => {
                        try {
                            const body = JSON.parse(r.body);
                            return body.valid === true;
                        } catch (e) {
                            return false;
                        }
                    }
                });

                sleep(0.1);

                // User profile access
                const profileResponse = http.get(`${config.baseUrl}/api/auth/me`, {
                    headers: authHeaders
                });

                check(profileResponse, {
                    'profile access successful': (r) => r.status === 200,
                    'profile returns user data': (r) => {
                        try {
                            const body = JSON.parse(r.body);
                            return body.user && body.user.id !== undefined;
                        } catch (e) {
                            return false;
                        }
                    }
                });

                sleep(0.1);

                // Settings access
                const settingsResponse = http.get(`${config.baseUrl}/api/settings`, {
                    headers: authHeaders
                });

                check(settingsResponse, {
                    'settings access successful': (r) => r.status === 200,
                    'settings returns data': (r) => {
                        try {
                            const body = JSON.parse(r.body);
                            return body !== null && typeof body === 'object';
                        } catch (e) {
                            return false;
                        }
                    }
                });

                sleep(0.1);

                // Foods API access
                const foodsResponse = http.get(`${config.baseUrl}/api/foods`, {
                    headers: authHeaders
                });

                check(foodsResponse, {
                    'foods API accessible': (r) => r.status === 200,
                    'foods returns array': (r) => {
                        try {
                            const body = JSON.parse(r.body);
                            return Array.isArray(body.foods);
                        } catch (e) {
                            return false;
                        }
                    }
                });
            });
        }
    });

    // Simulate user think time
    sleep(1);
}

export function teardown() {
    console.log('Login performance test completed');
}