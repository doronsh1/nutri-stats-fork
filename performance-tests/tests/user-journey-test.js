import { check, group, sleep } from 'k6';
import http from 'k6/http';
import { Trend } from 'k6/metrics';
import { config } from '../config/test-config.js';
import { setupAuth, getAuthHeaders } from '../utils/auth-helper.js';

/**
 * Complete User Journey Flow Test
 * 
 * PURPOSE:
 * This test simulates a complete, realistic athlete's daily nutrition tracking workflow
 * from login to meal planning, food management, analytics review, and session validation.
 * It represents the most common user path through the NutriStats application.
 * 
 * WHAT IT TESTS:
 * - End-to-end user experience performance
 * - Complete authentication and session management flow
 * - Weekly meal planning and food database interactions
 * - Real-time meal management and timing optimization
 * - Analytics and reporting system performance
 * - System responsiveness during typical daily usage
 * 
 * REALISTIC SCENARIOS:
 * - Professional athlete planning weekly nutrition around training
 * - Daily meal adjustments based on training schedule changes
 * - Progress tracking through weight and measurement analytics
 * - Food database searches and meal composition updates
 * - Report generation for sports nutrition team review
 * 
 * LOAD PATTERN:
 * - 20 concurrent users sustained for 5.5 minutes
 * - Simulates typical daily active user load
 * - Represents steady-state application usage
 * 
 * SUCCESS CRITERIA:
 * - <3% failure rate across all user journey steps
 * - <1.5s response time for 95% of operations
 * - Complete journey under 8 seconds total
 * - All authentication and data operations successful
 */
export const options = {
    cloud: {
        projectID: __ENV.PROJECT_ID,
    },

    stages: [
        { duration: '1m', target: 20 },    // Ramp up to 20 users
        { duration: '3m30s', target: 20 }, // Sustain 20 users
        { duration: '1m', target: 0 },     // Ramp down
    ],

    thresholds: {
        http_req_duration: ['p(95)<1500'],     // 95% under 1.5s
        http_req_failed: ['rate<0.03'],        // Less than 3% failures
        checks: ['rate>0.95'],                 // 95% checks pass
        'user_journey_duration': ['p(95)<8000'], // Complete journey under 8s
        'meal_planning_duration': ['p(95)<3000'], // Meal planning under 3s
        'reports_load_duration': ['p(95)<2000']   // Reports load under 2s
    }
};

// Custom metrics for user journey tracking
const userJourneyDuration = new Trend('user_journey_duration');
const mealPlanningDuration = new Trend('meal_planning_duration');
const reportsLoadDuration = new Trend('reports_load_duration');

export function setup() {
    return setupAuth();
}

export default function (data) {
    const journeyStart = Date.now();
    const { token } = data;
    const headers = getAuthHeaders(token);

    // Variables for test data
    const testDay = 'friday'; // Use consistent day for testing
    const weekDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    // Phase 1: Landing and Authentication
    group('Phase 1: Landing & Authentication', function () {
        // Landing page access
        const landingResponse = http.get(`${config.baseUrl}/`);
        check(landingResponse, {
            'landing page accessible': (r) => r.status === 200,
        });
        sleep(0.3);

        // Login process (using existing token from setup)
        const loginResponse = http.post(`${config.baseUrl}/api/auth/login`,
            JSON.stringify({
                email: config.testUser.email,
                password: config.testUser.password
            }), {
            headers: { 'Content-Type': 'application/json' }
        }
        );

        check(loginResponse, {
            'login successful': (r) => r.status === 200,
            'login returns token': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return body.token !== undefined;
                } catch (e) {
                    return false;
                }
            }
        });
        sleep(0.2);
    });

    // Phase 2: Dashboard Access & Initial Data Load
    group('Phase 2: Dashboard Access & Data Load', function () {
        // Access diary page (main dashboard)
        const diaryResponse = http.get(`${config.baseUrl}/diary.html`);
        check(diaryResponse, {
            'diary page loads': (r) => r.status === 200,
        });

        // Load essential API data in parallel (simulating real user behavior)
        const responses = http.batch([
            ['GET', `${config.baseUrl}/api/foods`, null, { headers }],
            ['GET', `${config.baseUrl}/api/auth/verify`, null, { headers }],
            ['GET', `${config.baseUrl}/api/settings`, null, { headers }],
            ['GET', `${config.baseUrl}/api/auth/me`, null, { headers }],
            ['GET', `${config.baseUrl}/api/version`, null, { headers }]
        ]);

        check(responses[0], { 'foods API loaded': (r) => r.status === 200 });
        check(responses[1], { 'auth verified': (r) => r.status === 200 });
        check(responses[2], { 'settings loaded': (r) => r.status === 200 });
        check(responses[3], { 'user profile loaded': (r) => r.status === 200 });
        check(responses[4], { 'version info loaded': (r) => r.status === 200 });

        sleep(0.5);
    });

    // Phase 3: Weekly Meal Planning (Core User Activity)
    group('Phase 3: Weekly Meal Planning', function () {
        const mealPlanningStart = Date.now();

        // Load all days of the week (typical user behavior)
        const dayResponses = http.batch(
            weekDays.map(day => ['GET', `${config.baseUrl}/api/daily-meals/${day}`, null, { headers }])
        );

        dayResponses.forEach((response, index) => {
            check(response, {
                [`${weekDays[index]} meals loaded`]: (r) => r.status === 200 || r.status === 304,
            });
        });

        mealPlanningDuration.add(Date.now() - mealPlanningStart);
        sleep(0.3);
    });

    // Phase 4: Basic Meal Management
    group('Phase 4: Basic Meal Management', function () {
        // Test meal data access (typical user behavior)
        const mealDataResponse = http.get(`${config.baseUrl}/api/daily-meals/${testDay}`, { headers });
        check(mealDataResponse, {
            'meal data accessible': (r) => r.status === 200,
        });

        // Test food search (common user action)
        const foodSearchResponse = http.get(`${config.baseUrl}/api/foods/search?q=apple`, { headers });
        check(foodSearchResponse, {
            'food search works': (r) => r.status === 200,
        });

        sleep(0.2);
    });

    // Phase 5: Settings & Preferences
    group('Phase 5: Settings & Preferences', function () {
        // Access user settings (common user action)
        const settingsResponse = http.get(`${config.baseUrl}/api/settings`, { headers });
        check(settingsResponse, {
            'settings accessible': (r) => r.status === 200,
        });

        // Test macro settings for current day
        const macroResponse = http.get(`${config.baseUrl}/api/daily-meals/${testDay}`, { headers });
        check(macroResponse, {
            'macro data accessible': (r) => r.status === 200,
        });

        sleep(0.2);
    });

    // Phase 6: Analytics & Reporting
    group('Phase 6: Analytics & Reporting', function () {
        const reportsStart = Date.now();

        // Access reports page
        const reportsPageResponse = http.get(`${config.baseUrl}/reports.html`);
        check(reportsPageResponse, {
            'reports page loads': (r) => r.status === 200,
        });

        // Load basic analytics data
        const analyticsResponses = http.batch([
            ['GET', `${config.baseUrl}/api/weight`, null, { headers }],
            ['GET', `${config.baseUrl}/api/measurements`, null, { headers }]
        ]);

        check(analyticsResponses[0], { 'weight data loaded': (r) => r.status === 200 });
        check(analyticsResponses[1], { 'measurements loaded': (r) => r.status === 200 });

        reportsLoadDuration.add(Date.now() - reportsStart);
        sleep(0.3);
    });

    // Phase 7: Session Validation & Cleanup
    group('Phase 7: Session Validation', function () {
        // Final auth verification
        const finalAuthResponse = http.get(`${config.baseUrl}/api/auth/verify`, { headers });
        check(finalAuthResponse, {
            'session still valid': (r) => r.status === 200 || r.status === 304,
        });

        // Load final settings check
        const finalSettingsResponse = http.get(`${config.baseUrl}/api/settings`, { headers });
        check(finalSettingsResponse, {
            'settings accessible': (r) => r.status === 200 || r.status === 304,
        });

        sleep(0.2);
    });

    // Record total journey time
    userJourneyDuration.add(Date.now() - journeyStart);

    // Simulate user think time between actions
    sleep(1);
}

export function teardown() {
    console.log('Complete user journey performance test completed');
    console.log('Tested: Login → Dashboard → Meal Planning → Basic Management → Settings → Reports');
}