import { check, group, sleep } from 'k6';
import http from 'k6/http';
import { Trend } from 'k6/metrics';
import { config, sampleFoods } from '../config/test-config.js';
import { setupAuth, getAuthHeaders } from '../utils/auth-helper.js';

/**
 * Meal Planning Peak Usage Spike Test
 * 
 * PURPOSE:
 * This test simulates real-world usage spikes that occur during peak meal planning times
 * (morning and evening) when athletes typically plan their nutrition around training schedules.
 * It validates system behavior during sudden load increases and recovery patterns.
 * 
 * WHAT IT TESTS:
 * - System performance during sudden user load spikes
 * - Peak hour meal planning operations (morning/evening rushes)
 * - Rapid meal adjustments and food additions during peaks
 * - System recovery and stability after load spikes
 * - Concurrent meal timing updates during training schedule changes
 * - Data integrity maintenance during high-stress periods
 * 
 * REALISTIC SCENARIOS:
 * - Morning rush: Athletes planning daily nutrition before training
 * - Evening spike: Next-day meal prep and current day review
 * - Training schedule changes requiring rapid meal time adjustments
 * - Team meal planning sessions with simultaneous user activity
 * - Competition day nutrition planning with time-critical updates
 * 
 * LOAD PATTERN:
 * - Baseline: 10 users → Spike to 150 users → Drop to 10 → Evening spike to 200 users
 * - Simulates realistic daily usage patterns with peak periods
 * - Tests system elasticity and recovery capabilities
 * 
 * SUCCESS CRITERIA:
 * - <10% failure rate during peak spikes (relaxed for extreme load)
 * - <2s response time during spikes
 * - <1s recovery time after spikes
 * - System remains responsive throughout load variations
 */
export const options = {
    cloud: {
        projectID: __ENV.PROJECT_ID,
    },

    stages: [
        { duration: '1m', target: 10 },     // Normal baseline
        { duration: '30s', target: 150 },   // Spike to 150 users (morning planning)
        { duration: '1m', target: 150 },    // Sustain spike
        { duration: '30s', target: 10 },    // Drop back to baseline
        { duration: '1m', target: 10 },     // Sustain baseline
        { duration: '30s', target: 200 },   // Evening spike (higher)
        { duration: '45s', target: 200 },   // Sustain evening spike
        { duration: '1m', target: 0 },      // Ramp down
    ],

    thresholds: {
        http_req_duration: ['p(95)<2000'],     // 95% under 2s during spikes
        http_req_failed: ['rate<0.10'],        // Less than 10% failures during spikes
        checks: ['rate>0.90'],                 // 90% checks pass (relaxed for spikes)
        'meal_planning_duration': ['p(95)<3000'], // Meal planning under 3s
        'peak_response_time': ['p(95)<4000'],  // Peak operations under 4s
        'system_recovery_time': ['p(95)<1000'] // Recovery under 1s
    }
};

// Custom metrics for spike testing
const mealPlanningDuration = new Trend('meal_planning_duration');
const peakResponseTime = new Trend('peak_response_time');
const systemRecoveryTime = new Trend('system_recovery_time');

export function setup() {
    return setupAuth();
}

export default function (data) {
    const { token } = data;
    const headers = getAuthHeaders(token);
    
    // Test data
    const weekDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = weekDays[Math.floor(Math.random() * weekDays.length)];
    const mealNumbers = [1, 2, 3, 4, 5, 6];

    // Phase 1: Peak Hour Meal Planning (Morning Rush)
    group('Phase 1: Morning Peak - Meal Planning', function () {
        const planningStart = Date.now();

        // Load weekly meal data (typical morning planning behavior)
        const weeklyResponses = http.batch(
            weekDays.slice(0, 5).map(day => [ // Weekdays only during morning rush
                'GET', 
                `${config.baseUrl}/api/daily-meals/${day}`, 
                null, 
                { headers }
            ])
        );

        weeklyResponses.forEach((response, index) => {
            check(response, {
                [`${weekDays[index]} meals loaded during peak`]: (r) => r.status === 200 || r.status === 304,
            });
        });

        // Quick meal updates (athletes adjusting plans)
        const quickMealUpdate = http.put(
            `${config.baseUrl}/api/daily-meals/${currentDay}/meals/${mealNumbers[0]}/time`,
            JSON.stringify({ time: "07:00" }),
            { headers }
        );

        check(quickMealUpdate, {
            'quick meal time update during peak': (r) => r.status === 200,
        });

        mealPlanningDuration.add(Date.now() - planningStart);
        sleep(0.1); // Minimal sleep during peak
    });

    // Phase 2: Intensive Food Addition (Peak Activity)
    group('Phase 2: Peak Food Addition Activity', function () {
        const peakStart = Date.now();

        // Add multiple food items rapidly (typical peak behavior)
        const randomMeal = mealNumbers[Math.floor(Math.random() * mealNumbers.length)];
        const foodItem = sampleFoods[Math.floor(Math.random() * sampleFoods.length)];

        const addFoodResponse = http.post(
            `${config.baseUrl}/api/daily-meals/${currentDay}/meals/${randomMeal}/items`,
            JSON.stringify({
                name: foodItem.item,
                amount: 100,
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
                mealTime: "12:00"
            }),
            { headers }
        );

        check(addFoodResponse, {
            'food added during peak load': (r) => r.status === 200,
        });

        // Concurrent macro updates (multiple athletes updating simultaneously)
        const macroUpdateResponse = http.put(
            `${config.baseUrl}/api/daily-meals/${currentDay}/macros`,
            JSON.stringify({
                protein: 150 + Math.floor(Math.random() * 50),
                carbs: 200 + Math.floor(Math.random() * 100),
                fat: 70 + Math.floor(Math.random() * 30),
                calories: 2000 + Math.floor(Math.random() * 500)
            }),
            { headers }
        );

        check(macroUpdateResponse, {
            'macro update during peak': (r) => r.status === 200,
        });

        peakResponseTime.add(Date.now() - peakStart);
        sleep(0.05); // Very short sleep during peak activity
    });

    // Phase 3: System Stress Test (Maximum Load)
    group('Phase 3: Maximum System Stress', function () {
        // Simulate maximum concurrent operations
        const stressResponses = http.batch([
            ['GET', `${config.baseUrl}/api/foods`, null, { headers }],
            ['GET', `${config.baseUrl}/api/daily-meals/${currentDay}`, null, { headers }],
            ['GET', `${config.baseUrl}/api/settings`, null, { headers }],
            ['GET', `${config.baseUrl}/api/auth/verify`, null, { headers }],
            ['GET', `${config.baseUrl}/api/weight`, null, { headers }]
        ]);

        stressResponses.forEach((response, index) => {
            const endpoints = ['foods', 'daily-meals', 'settings', 'auth', 'weight'];
            check(response, {
                [`${endpoints[index]} API responsive under stress`]: (r) => r.status === 200 || r.status === 304,
            });
        });

        // Rapid meal time adjustments (training schedule changes)
        const timeAdjustments = [
            { meal: 1, time: "06:30" },
            { meal: 2, time: "10:00" },
            { meal: 3, time: "13:30" }
        ];

        const timeResponses = http.batch(
            timeAdjustments.map(({ meal, time }) => [
                'PUT',
                `${config.baseUrl}/api/daily-meals/${currentDay}/meals/${meal}/time`,
                JSON.stringify({ time }),
                { headers }
            ])
        );

        timeResponses.forEach((response, index) => {
            check(response, {
                [`meal ${timeAdjustments[index].meal} time adjusted under stress`]: (r) => r.status === 200,
            });
        });

        sleep(0.1);
    });

    // Phase 4: Recovery Validation (Post-Peak)
    group('Phase 4: System Recovery Validation', function () {
        const recoveryStart = Date.now();

        // Test system responsiveness after peak load
        const recoveryResponse = http.get(`${config.baseUrl}/api/test`);
        check(recoveryResponse, {
            'system responsive after peak': (r) => r.status === 200,
        });

        // Verify data integrity after stress
        const integrityResponse = http.get(`${config.baseUrl}/api/daily-meals/${currentDay}`, { headers });
        check(integrityResponse, {
            'data integrity maintained': (r) => r.status === 200,
            'meal data structure intact': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return body.meals !== undefined || body.day !== undefined;
                } catch (e) {
                    return false;
                }
            }
        });

        // Test authentication stability
        const authStabilityResponse = http.get(`${config.baseUrl}/api/auth/verify`, { headers });
        check(authStabilityResponse, {
            'authentication stable after peak': (r) => r.status === 200,
        });

        systemRecoveryTime.add(Date.now() - recoveryStart);
        sleep(0.2);
    });

    // Phase 5: Evening Peak Simulation (Different Pattern)
    group('Phase 5: Evening Peak - Next Day Planning', function () {
        // Evening behavior: planning next day + reviewing current day
        const eveningResponses = http.batch([
            ['GET', `${config.baseUrl}/api/daily-meals/monday`, null, { headers }], // Next day
            ['GET', `${config.baseUrl}/api/daily-meals/${currentDay}`, null, { headers }], // Current day review
            ['GET', `${config.baseUrl}/api/weight`, null, { headers }], // Evening weigh-in check
            ['GET', `${config.baseUrl}/api/measurements`, null, { headers }] // Progress check
        ]);

        eveningResponses.forEach((response, index) => {
            const operations = ['next day planning', 'current day review', 'weight check', 'progress check'];
            check(response, {
                [`evening ${operations[index]} successful`]: (r) => r.status === 200 || r.status === 304,
            });
        });

        // Evening meal prep planning
        const prepResponse = http.put(
            `${config.baseUrl}/api/daily-meals/monday/meals/1/time`,
            JSON.stringify({ time: "06:00" }), // Early morning meal prep
            { headers }
        );

        check(prepResponse, {
            'evening meal prep planning': (r) => r.status === 200,
        });

        sleep(0.3);
    });

    // Simulate varied user behavior during different peak times
    const currentStage = __VU % 4; // Vary behavior based on virtual user number
    if (currentStage === 0) {
        sleep(0.1); // Quick users
    } else if (currentStage === 1) {
        sleep(0.5); // Moderate users
    } else if (currentStage === 2) {
        sleep(1.0); // Thoughtful planners
    } else {
        sleep(0.2); // Average users
    }
}

export function teardown() {
    console.log('Meal Planning Peak Usage Test completed');
    console.log('Tested: Morning Peak → Food Addition → System Stress → Recovery → Evening Peak');
}