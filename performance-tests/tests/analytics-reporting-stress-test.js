import { check, group, sleep } from 'k6';
import http from 'k6/http';
import { Trend } from 'k6/metrics';
import { config } from '../config/test-config.js';
import { setupAuth, getAuthHeaders } from '../utils/auth-helper.js';

/**
 * Analytics & Reporting Stress Test
 * 
 * PURPOSE:
 * This test validates the performance of data-heavy analytics and reporting operations
 * under sustained load. It simulates sports science teams, coaches, and athletes
 * simultaneously generating reports and analyzing nutrition data for performance optimization.
 * 
 * WHAT IT TESTS:
 * - Complex data aggregation and calculation performance
 * - Weekly nutrition analytics with multi-day data processing
 * - Body measurement statistics and trend analysis
 * - Weight tracking analytics with historical data
 * - Concurrent report generation by multiple users
 * - System performance during intensive data operations
 * 
 * REALISTIC SCENARIOS:
 * - Sports science team generating weekly athlete reports
 * - Coaches reviewing multiple athlete progress simultaneously
 * - Athletes checking personal analytics and progress trends
 * - Nutrition professionals analyzing client data patterns
 * - Team-wide performance correlation analysis
 * - Export preparation for external sports science tools
 * 
 * LOAD PATTERN:
 * - Sustained load: 25 → 50 → 75 users over 4.75 minutes
 * - Simulates steady analytical workload
 * - Tests system under continuous data processing demands
 * 
 * SUCCESS CRITERIA:
 * - <5% failure rate for data-heavy operations
 * - <2s response time for report generation
 * - <1.5s for analytics calculations
 * - <2.5s for complex data aggregation
 * - Consistent performance throughout sustained load
 */
export const options = {
    cloud: {
        projectID: __ENV.PROJECT_ID,
    },

    stages: [
        { duration: '45s', target: 25 },   // Ramp up to 25 users
        { duration: '2m', target: 50 },    // Scale to 50 users
        { duration: '1m30s', target: 75 }, // Peak at 75 users
        { duration: '45s', target: 0 },    // Ramp down
    ],

    thresholds: {
        http_req_duration: ['p(95)<2000'],     // 95% under 2s for data operations
        http_req_failed: ['rate<0.05'],        // Less than 5% failures
        checks: ['rate>0.95'],                 // 95% checks pass
        'report_generation_duration': ['p(95)<3000'], // Report generation under 3s
        'analytics_calculation_duration': ['p(95)<1500'], // Analytics under 1.5s
        'data_aggregation_duration': ['p(95)<2500'] // Data aggregation under 2.5s
    }
};

// Custom metrics for analytics operations
const reportGenerationDuration = new Trend('report_generation_duration');
const analyticsCalculationDuration = new Trend('analytics_calculation_duration');
const dataAggregationDuration = new Trend('data_aggregation_duration');

export function setup() {
    return setupAuth();
}

export default function (data) {
    const { token } = data;
    const headers = getAuthHeaders(token);
    
    // Test data for analytics
    const weekDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const measurementTypes = ['Waist', 'Thigh', 'Arm'];

    // Phase 1: Reports Page Access & Initial Data Load
    group('Phase 1: Reports Dashboard Access', function () {
        const reportStart = Date.now();

        // Access reports page
        const reportsPageResponse = http.get(`${config.baseUrl}/reports.html`);
        check(reportsPageResponse, {
            'reports page loads': (r) => r.status === 200,
        });

        // Load initial analytics data in parallel
        const initialDataResponses = http.batch([
            ['GET', `${config.baseUrl}/api/weight`, null, { headers }],
            ['GET', `${config.baseUrl}/api/measurements`, null, { headers }],
            ['GET', `${config.baseUrl}/api/settings`, null, { headers }],
            ['GET', `${config.baseUrl}/api/auth/me`, null, { headers }]
        ]);

        initialDataResponses.forEach((response, index) => {
            const endpoints = ['weight data', 'measurements', 'settings', 'user profile'];
            check(response, {
                [`${endpoints[index]} loaded for reports`]: (r) => r.status === 200,
            });
        });

        reportGenerationDuration.add(Date.now() - reportStart);
        sleep(0.3);
    });

    // Phase 2: Weekly Nutrition Analytics
    group('Phase 2: Weekly Nutrition Analytics', function () {
        const analyticsStart = Date.now();

        // Load complete weekly nutrition data for analysis
        const weeklyNutritionResponses = http.batch(
            weekDays.map(day => [
                'GET', 
                `${config.baseUrl}/api/daily-meals/${day}`, 
                null, 
                { headers }
            ])
        );

        weeklyNutritionResponses.forEach((response, index) => {
            check(response, {
                [`${weekDays[index]} nutrition data loaded`]: (r) => r.status === 200 || r.status === 304,
            });
        });

        // Simulate complex nutrition calculations (macro analysis)
        const macroAnalysisResponses = http.batch(
            weekDays.slice(0, 5).map(day => [ // Weekdays for detailed analysis
                'GET', 
                `${config.baseUrl}/api/daily-meals/${day}`, 
                null, 
                { headers }
            ])
        );

        macroAnalysisResponses.forEach((response, index) => {
            check(response, {
                [`weekday ${index + 1} macro analysis data`]: (r) => r.status === 200 || r.status === 304,
            });
        });

        analyticsCalculationDuration.add(Date.now() - analyticsStart);
        sleep(0.2);
    });

    // Phase 3: Body Measurements Analytics
    group('Phase 3: Body Measurements Analytics', function () {
        const measurementsStart = Date.now();

        // Load all measurement types for comprehensive analysis
        const measurementResponses = http.batch(
            measurementTypes.map(type => [
                'GET', 
                `${config.baseUrl}/api/measurements/type/${type}`, 
                null, 
                { headers }
            ])
        );

        measurementResponses.forEach((response, index) => {
            check(response, {
                [`${measurementTypes[index]} measurements loaded`]: (r) => r.status === 200,
            });
        });

        // Load statistical analysis for each measurement type
        const statsResponses = http.batch(
            measurementTypes.map(type => [
                'GET', 
                `${config.baseUrl}/api/measurements/stats/${type}`, 
                null, 
                { headers }
            ])
        );

        statsResponses.forEach((response, index) => {
            check(response, {
                [`${measurementTypes[index]} statistics calculated`]: (r) => r.status === 200,
                [`${measurementTypes[index]} stats contain data`]: (r) => {
                    try {
                        const body = JSON.parse(r.body);
                        return body !== null && typeof body === 'object';
                    } catch (e) {
                        return false;
                    }
                }
            });
        });

        // Get measurement types for dynamic reporting
        const typesResponse = http.get(`${config.baseUrl}/api/measurements/types`, { headers });
        check(typesResponse, {
            'measurement types loaded': (r) => r.status === 200,
        });

        sleep(0.2);
    });

    // Phase 4: Weight Tracking Analytics
    group('Phase 4: Weight Tracking Analytics', function () {
        const weightStart = Date.now();

        // Load weight data multiple times (simulating different chart views)
        const weightDataResponses = http.batch([
            ['GET', `${config.baseUrl}/api/weight`, null, { headers }], // All weight data
            ['GET', `${config.baseUrl}/api/weight`, null, { headers }], // Duplicate for chart rendering
            ['GET', `${config.baseUrl}/api/weight`, null, { headers }]  // Duplicate for statistics
        ]);

        weightDataResponses.forEach((response, index) => {
            check(response, {
                [`weight data load ${index + 1}`]: (r) => r.status === 200,
                [`weight data structure ${index + 1}`]: (r) => {
                    try {
                        const body = JSON.parse(r.body);
                        return Array.isArray(body.entries);
                    } catch (e) {
                        return false;
                    }
                }
            });
        });

        sleep(0.1);
    });

    // Phase 5: Data Aggregation & Complex Calculations
    group('Phase 5: Data Aggregation Operations', function () {
        const aggregationStart = Date.now();

        // Simulate complex data aggregation (loading multiple data sources)
        const aggregationResponses = http.batch([
            ['GET', `${config.baseUrl}/api/daily-meals/monday`, null, { headers }],
            ['GET', `${config.baseUrl}/api/daily-meals/tuesday`, null, { headers }],
            ['GET', `${config.baseUrl}/api/daily-meals/wednesday`, null, { headers }],
            ['GET', `${config.baseUrl}/api/daily-meals/thursday`, null, { headers }],
            ['GET', `${config.baseUrl}/api/daily-meals/friday`, null, { headers }],
            ['GET', `${config.baseUrl}/api/weight`, null, { headers }],
            ['GET', `${config.baseUrl}/api/measurements`, null, { headers }],
            ['GET', `${config.baseUrl}/api/settings`, null, { headers }]
        ]);

        aggregationResponses.forEach((response, index) => {
            const sources = ['mon meals', 'tue meals', 'wed meals', 'thu meals', 'fri meals', 'weight', 'measurements', 'settings'];
            check(response, {
                [`${sources[index]} aggregation data loaded`]: (r) => r.status === 200 || r.status === 304,
            });
        });

        // Simulate report export preparation (heavy data processing)
        const exportPrepResponses = http.batch([
            ['GET', `${config.baseUrl}/api/foods`, null, { headers }], // Food database for export
            ['GET', `${config.baseUrl}/api/daily-meals/saturday`, null, { headers }], // Weekend data
            ['GET', `${config.baseUrl}/api/daily-meals/sunday`, null, { headers }] // Weekend data
        ]);

        exportPrepResponses.forEach((response, index) => {
            const exportData = ['food database', 'saturday data', 'sunday data'];
            check(response, {
                [`${exportData[index]} export prep`]: (r) => r.status === 200 || r.status === 304,
            });
        });

        dataAggregationDuration.add(Date.now() - aggregationStart);
        sleep(0.3);
    });

    // Phase 6: Performance Analytics Stress Test
    group('Phase 6: Performance Analytics Stress', function () {
        // Rapid sequential analytics requests (stress test scenario)
        const stressRequests = [
            `${config.baseUrl}/api/measurements/stats/Waist`,
            `${config.baseUrl}/api/measurements/stats/Thigh`,
            `${config.baseUrl}/api/measurements/stats/Arm`,
            `${config.baseUrl}/api/weight`,
            `${config.baseUrl}/api/measurements`
        ];

        stressRequests.forEach((url, index) => {
            const stressResponse = http.get(url, { headers });
            check(stressResponse, {
                [`stress request ${index + 1} successful`]: (r) => r.status === 200,
            });
            sleep(0.05); // Minimal delay for stress testing
        });

        // Concurrent heavy operations
        const concurrentHeavyResponses = http.batch([
            ['GET', `${config.baseUrl}/api/daily-meals/monday`, null, { headers }],
            ['GET', `${config.baseUrl}/api/daily-meals/tuesday`, null, { headers }],
            ['GET', `${config.baseUrl}/api/daily-meals/wednesday`, null, { headers }],
            ['GET', `${config.baseUrl}/api/measurements/stats/Waist`, null, { headers }],
            ['GET', `${config.baseUrl}/api/weight`, null, { headers }]
        ]);

        concurrentHeavyResponses.forEach((response, index) => {
            check(response, {
                [`concurrent heavy operation ${index + 1}`]: (r) => r.status === 200 || r.status === 304,
            });
        });

        sleep(0.2);
    });

    // Phase 7: Report Validation & Data Integrity
    group('Phase 7: Report Validation', function () {
        // Validate that all data sources are still accessible after stress
        const validationResponses = http.batch([
            ['GET', `${config.baseUrl}/api/auth/verify`, null, { headers }],
            ['GET', `${config.baseUrl}/api/test`, null, { headers }],
            ['GET', `${config.baseUrl}/api/version`, null, { headers }]
        ]);

        validationResponses.forEach((response, index) => {
            const validations = ['auth verification', 'system health', 'version info'];
            check(response, {
                [`${validations[index]} after analytics stress`]: (r) => r.status === 200,
            });
        });

        // Final data integrity check
        const integrityResponse = http.get(`${config.baseUrl}/api/daily-meals/friday`, { headers });
        check(integrityResponse, {
            'data integrity maintained after analytics': (r) => r.status === 200 || r.status === 304,
            'meal data structure intact': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return body.meals !== undefined || body.day !== undefined;
                } catch (e) {
                    return false;
                }
            }
        });

        sleep(0.2);
    });

    // Simulate realistic user behavior - analytics users tend to spend more time reviewing data
    sleep(Math.random() * 3 + 1); // Random sleep between 1-4 seconds
}

export function teardown() {
    console.log('Analytics & Reporting Stress Test completed');
    console.log('Tested: Reports Dashboard → Weekly Analytics → Measurements → Weight Tracking → Data Aggregation → Performance Stress → Validation');
}