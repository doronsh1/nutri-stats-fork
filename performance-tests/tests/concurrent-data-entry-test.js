import { check, group, sleep } from 'k6';
import http from 'k6/http';
import { Trend } from 'k6/metrics';
import { config, sampleFoods } from '../config/test-config.js';
import { setupAuth, getAuthHeaders } from '../utils/auth-helper.js';

/**
 * Multi-User Concurrent Data Entry Test
 * 
 * PURPOSE:
 * This test simulates multiple users (athletes, nutritionists, coaches) simultaneously entering
 * data into the NutriStats system to validate database concurrency, data integrity, and system
 * stability under concurrent write operations.
 * 
 * WHAT IT TESTS:
 * - Database concurrency handling with multiple simultaneous writes
 * - Data integrity during concurrent weight entries, meal updates, and measurements
 * - System performance when multiple users update settings simultaneously
 * - Database lock handling and transaction management
 * - Data consistency validation after concurrent operations
 * 
 * REALISTIC SCENARIOS:
 * - Sports team with multiple athletes logging data simultaneously
 * - Nutrition professionals managing multiple client profiles
 * - Athletes updating meal plans while coaches review progress
 * - Concurrent weight tracking during team weigh-ins
 * - Multiple users adjusting meal timings around training schedules
 * 
 * LOAD PATTERN:
 * - Ramp up: 40 → 60 → 80 concurrent users over 4 minutes
 * - Simulates peak usage during team training sessions
 * - Tests database performance under sustained concurrent load
 * 
 * SUCCESS CRITERIA:
 * - <3% failure rate during concurrent operations
 * - <1s response time for data entry operations
 * - Data integrity maintained across all concurrent writes
 * - No database deadlocks or corruption
 */
export const options = {
    cloud: {
        projectID: __ENV.PROJECT_ID,
    },

    stages: [
        { duration: '30s', target: 40 },   // Ramp up to 40 users
        { duration: '2m30s', target: 60 }, // Scale to 60 users
        { duration: '1m', target: 80 },    // Peak at 80 users
        { duration: '30s', target: 0 },    // Ramp down
    ],

    thresholds: {
        http_req_duration: ['p(95)<1000'],     // 95% under 1s for data entry
        http_req_failed: ['rate<0.03'],        // Less than 3% failures
        checks: ['rate>0.95'],                 // 95% checks pass
        'concurrent_write_duration': ['p(95)<800'], // Concurrent writes under 800ms
        'data_consistency_duration': ['p(95)<600'], // Data consistency checks under 600ms
        'database_lock_duration': ['p(95)<1200']    // Database operations under 1.2s
    }
};

// Custom metrics for concurrency testing
const concurrentWriteDuration = new Trend('concurrent_write_duration');
const dataConsistencyDuration = new Trend('data_consistency_duration');
const databaseLockDuration = new Trend('database_lock_duration');

export function setup() {
    return setupAuth();
}

export default function (data) {
    const { token } = data;
    const headers = getAuthHeaders(token);
    
    // Test data for concurrent operations
    const weekDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const userDay = weekDays[__VU % weekDays.length]; // Distribute users across different days
    const mealNumbers = [1, 2, 3, 4, 5, 6];
    const measurementTypes = ['Waist', 'Thigh', 'Arm'];
    
    // Unique identifiers for this virtual user
    const vuId = __VU;
    const iterationId = __ITER;
    const timestamp = Date.now();

    // Phase 1: Concurrent Weight Entry Operations
    group('Phase 1: Concurrent Weight Entries', function () {
        const weightStart = Date.now();

        // Multiple users entering weight data simultaneously
        const weightData = {
            weight: 70 + (vuId % 20), // Vary weight by user (70-89 kg)
            date: new Date().toISOString().split('T')[0],
            note: `Concurrent test entry VU${vuId} Iter${iterationId}`
        };

        const weightResponse = http.post(
            `${config.baseUrl}/api/weight`,
            JSON.stringify(weightData),
            { headers }
        );

        const weightSuccess = check(weightResponse, {
            'concurrent weight entry successful': (r) => r.status === 200 || r.status === 201,
            'weight entry returns data': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return body !== null && typeof body === 'object';
                } catch (e) {
                    return false;
                }
            }
        });

        concurrentWriteDuration.add(Date.now() - weightStart);
        sleep(0.1);

        // Verify data consistency after concurrent writes
        const consistencyStart = Date.now();
        const verifyResponse = http.get(`${config.baseUrl}/api/weight`, { headers });
        check(verifyResponse, {
            'weight data consistency maintained': (r) => r.status === 200,
            'weight entries structure intact': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return Array.isArray(body.entries);
                } catch (e) {
                    return false;
                }
            }
        });
        dataConsistencyDuration.add(Date.now() - consistencyStart);

        sleep(0.2);
    });

    // Phase 2: Concurrent Meal Data Entry
    group('Phase 2: Concurrent Meal Data Entry', function () {
        const mealStart = Date.now();

        // Multiple users adding meal items to different meals simultaneously
        const randomMeal = mealNumbers[vuId % mealNumbers.length];
        const foodItem = sampleFoods[vuId % sampleFoods.length];

        const mealItemData = {
            name: `${foodItem.item} - VU${vuId}`,
            amount: 100 + (vuId % 50), // Vary amounts
            baseAmount: 100,
            calories: foodItem.calories,
            carbs: foodItem.carbs,
            protein: foodItem.protein,
            fat: foodItem.fat,
            proteinG: 0,
            baseCalories: foodItem.calories,
            baseCarbs: foodItem.carbs,
            baseProtein: foodItem.protein,
            baseFat: foodItem.fat,
            baseProteinG: 0,
            mealTime: `${8 + (randomMeal * 2)}:00` // Spread meal times
        };

        const mealResponse = http.post(
            `${config.baseUrl}/api/daily-meals/${userDay}/meals/${randomMeal}/items`,
            JSON.stringify(mealItemData),
            { headers }
        );

        check(mealResponse, {
            'concurrent meal entry successful': (r) => r.status === 200,
            'meal entry returns valid data': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return body !== null;
                } catch (e) {
                    return false;
                }
            }
        });

        // Concurrent meal time updates
        const timeUpdateResponse = http.put(
            `${config.baseUrl}/api/daily-meals/${userDay}/meals/${randomMeal}/time`,
            JSON.stringify({ time: `${7 + randomMeal}:${vuId % 60}` }),
            { headers }
        );

        check(timeUpdateResponse, {
            'concurrent meal time update': (r) => r.status === 200,
        });

        databaseLockDuration.add(Date.now() - mealStart);
        sleep(0.1);
    });

    // Phase 3: Concurrent Measurement Entries
    group('Phase 3: Concurrent Measurement Entries', function () {
        const measurementStart = Date.now();

        // Multiple users entering body measurements simultaneously
        const measurementType = measurementTypes[vuId % measurementTypes.length];
        const measurementData = {
            measurementType: measurementType,
            value: 80 + (vuId % 20), // Vary measurements (80-99)
            unit: 'cm',
            date: new Date().toISOString().split('T')[0],
            note: `Concurrent ${measurementType} measurement VU${vuId}`
        };

        const measurementResponse = http.post(
            `${config.baseUrl}/api/measurements`,
            JSON.stringify(measurementData),
            { headers }
        );

        check(measurementResponse, {
            'concurrent measurement entry successful': (r) => r.status === 200 || r.status === 201,
            'measurement entry has ID': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return body.id !== undefined || body.success === true;
                } catch (e) {
                    return false;
                }
            }
        });

        concurrentWriteDuration.add(Date.now() - measurementStart);
        sleep(0.1);
    });

    // Phase 4: Concurrent Settings Updates
    group('Phase 4: Concurrent Settings Updates', function () {
        const settingsStart = Date.now();

        // Multiple users updating settings simultaneously (simulating team management)
        const settingsData = {
            userName: `Test User VU${vuId}`,
            sex: vuId % 2 === 0 ? "male" : "female",
            age: 25 + (vuId % 15), // Age 25-39
            weight: 65 + (vuId % 25), // Weight 65-89
            height: 160 + (vuId % 30), // Height 160-189
            activityLevel: ["sedentary", "light", "moderate", "active", "very_active"][vuId % 5],
            bmr: 1600 + (vuId % 400), // BMR 1600-1999
            totalCalories: 2000 + (vuId % 800), // Calories 2000-2799
            mealInterval: 3 + (vuId % 3) // Interval 3-5
        };

        const settingsResponse = http.post(
            `${config.baseUrl}/api/settings`,
            JSON.stringify(settingsData),
            { headers }
        );

        check(settingsResponse, {
            'concurrent settings update successful': (r) => r.status === 200,
            'settings update confirmed': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return body.message === "Settings saved successfully";
                } catch (e) {
                    return false;
                }
            }
        });

        databaseLockDuration.add(Date.now() - settingsStart);
        sleep(0.2);
    });

    // Phase 5: Concurrent Macro Updates
    group('Phase 5: Concurrent Macro Updates', function () {
        const macroStart = Date.now();

        // Multiple users updating daily macros simultaneously
        const macroData = {
            protein: 120 + (vuId % 80), // Protein 120-199g
            carbs: 150 + (vuId % 150), // Carbs 150-299g
            fat: 50 + (vuId % 50), // Fat 50-99g
            calories: 1800 + (vuId % 800) // Calories 1800-2599
        };

        const macroResponse = http.put(
            `${config.baseUrl}/api/daily-meals/${userDay}/macros`,
            JSON.stringify(macroData),
            { headers }
        );

        check(macroResponse, {
            'concurrent macro update successful': (r) => r.status === 200,
        });

        // Alternative macro update method
        const macroPostResponse = http.post(
            `${config.baseUrl}/api/daily-meals/${userDay}/macros`,
            JSON.stringify(macroData),
            { headers }
        );

        check(macroPostResponse, {
            'concurrent macro post successful': (r) => r.status === 200 || r.status === 201,
        });

        concurrentWriteDuration.add(Date.now() - macroStart);
        sleep(0.1);
    });

    // Phase 6: Database Stress & Integrity Validation
    group('Phase 6: Database Stress & Integrity', function () {
        const stressStart = Date.now();

        // Rapid concurrent operations to stress database locks
        const stressOperations = http.batch([
            ['GET', `${config.baseUrl}/api/daily-meals/${userDay}`, null, { headers }],
            ['GET', `${config.baseUrl}/api/weight`, null, { headers }],
            ['GET', `${config.baseUrl}/api/measurements`, null, { headers }],
            ['GET', `${config.baseUrl}/api/settings`, null, { headers }],
            ['GET', `${config.baseUrl}/api/auth/verify`, null, { headers }]
        ]);

        stressOperations.forEach((response, index) => {
            const operations = ['meal data', 'weight data', 'measurements', 'settings', 'auth'];
            check(response, {
                [`${operations[index]} accessible under stress`]: (r) => r.status === 200 || r.status === 304,
            });
        });

        // Data integrity verification
        const integrityResponse = http.get(`${config.baseUrl}/api/daily-meals/${userDay}`, { headers });
        check(integrityResponse, {
            'meal data integrity maintained': (r) => r.status === 200 || r.status === 304,
            'meal structure intact after concurrent writes': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return body.meals !== undefined || body.day !== undefined;
                } catch (e) {
                    return false;
                }
            }
        });

        databaseLockDuration.add(Date.now() - stressStart);
        sleep(0.2);
    });

    // Phase 7: Cleanup Operations (Concurrent Deletes)
    group('Phase 7: Concurrent Cleanup Operations', function () {
        // Simulate cleanup operations that might happen concurrently
        const cleanupResponse = http.post(
            `${config.baseUrl}/api/daily-meals/${userDay}/cleanup-placeholders`,
            null,
            { headers }
        );

        check(cleanupResponse, {
            'concurrent cleanup successful': (r) => r.status === 200,
        });

        // Final system health check
        const healthResponse = http.get(`${config.baseUrl}/api/test`);
        check(healthResponse, {
            'system healthy after concurrent operations': (r) => r.status === 200,
        });

        sleep(0.1);
    });

    // Simulate realistic user behavior with varied timing
    const userType = vuId % 3;
    if (userType === 0) {
        sleep(0.5); // Fast data entry users
    } else if (userType === 1) {
        sleep(1.5); // Moderate users
    } else {
        sleep(2.5); // Careful data entry users
    }
}

export function teardown() {
    console.log('Multi-User Concurrent Data Entry Test completed');
    console.log('Tested: Concurrent Weight Entry → Meal Data Entry → Measurement Entry → Settings Updates → Macro Updates → Database Stress → Cleanup');
}