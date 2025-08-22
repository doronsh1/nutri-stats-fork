import { check, group, sleep } from 'k6';
import http from 'k6/http';
import { Trend } from 'k6/metrics';
import { config, sampleFoods } from '../config/test-config.js';
import { setupAuth, getAuthHeaders } from '../utils/auth-helper.js';

/**
 * Food Database Search & Management Load Test
 * 
 * PURPOSE:
 * This test focuses on the food database system under heavy load, testing search performance,
 * CRUD operations, and bulk data management. It simulates intensive food database usage
 * typical of sports nutrition professionals managing large food inventories.
 * 
 * WHAT IT TESTS:
 * - Food search performance with various query types and filters
 * - Create, Read, Update, Delete operations on food items
 * - Bulk food operations and batch imports
 * - Database performance under rapid sequential operations
 * - Concurrent food database access patterns
 * - System stability during intensive food management
 * 
 * REALISTIC SCENARIOS:
 * - Sports nutritionist importing new supplement database
 * - Multiple users searching for foods during meal planning
 * - Batch creation of custom team-specific food items
 * - Rapid food database queries during meal composition
 * - Concurrent food updates by nutrition team members
 * 
 * LOAD PATTERN:
 * - Aggressive ramp: 30 → 50 → 100 users over 4 minutes
 * - Peak load testing for food database operations
 * - Simulates heavy database usage scenarios
 * 
 * SUCCESS CRITERIA:
 * - <2% failure rate for database operations
 * - <600ms response time for food searches
 * - <800ms for CRUD operations
 * - Successful bulk operations under load
 */
export const options = {
    cloud: {
        projectID: __ENV.PROJECT_ID,
    },

    stages: [
        { duration: '30s', target: 30 },   // Ramp up to 30 users
        { duration: '2m', target: 50 },    // Scale to 50 users
        { duration: '1m30s', target: 100 }, // Peak load at 100 users
        { duration: '30s', target: 0 },    // Ramp down
    ],

    thresholds: {
        http_req_duration: ['p(95)<600'],      // 95% under 600ms
        http_req_failed: ['rate<0.02'],        // Less than 2% failures
        checks: ['rate>0.95'],                 // 95% checks pass
        'food_search_duration': ['p(95)<400'], // Search under 400ms
        'food_crud_duration': ['p(95)<800'],   // CRUD operations under 800ms
        'bulk_operations_duration': ['p(95)<1200'] // Bulk ops under 1.2s
    }
};

// Custom metrics for food database operations
const foodSearchDuration = new Trend('food_search_duration');
const foodCrudDuration = new Trend('food_crud_duration');
const bulkOperationsDuration = new Trend('bulk_operations_duration');

export function setup() {
    return setupAuth();
}

export default function (data) {
    const { token } = data;
    const headers = getAuthHeaders(token);
    
    // Test data for food operations
    const searchTerms = ['apple', 'chicken', 'rice', 'protein', 'banana', 'beef', 'pasta', 'milk'];
    const randomSearchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
    let createdFoodIndex = null;

    // Phase 1: Food Database Search Operations
    group('Phase 1: Food Search Operations', function () {
        const searchStart = Date.now();

        // Basic food search
        const searchResponse = http.get(
            `${config.baseUrl}/api/foods/search?q=${randomSearchTerm}`, 
            { headers }
        );
        
        check(searchResponse, {
            'food search successful': (r) => r.status === 200,
            'search returns results': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return Array.isArray(body.foods) || Array.isArray(body);
                } catch (e) {
                    return false;
                }
            }
        });

        // Advanced search with filters
        const filteredSearchResponse = http.get(
            `${config.baseUrl}/api/foods?search=${randomSearchTerm}`, 
            { headers }
        );
        
        check(filteredSearchResponse, {
            'filtered search successful': (r) => r.status === 200,
        });

        // Load complete food database
        const allFoodsResponse = http.get(`${config.baseUrl}/api/foods`, { headers });
        check(allFoodsResponse, {
            'all foods loaded': (r) => r.status === 200,
        });

        foodSearchDuration.add(Date.now() - searchStart);
        sleep(0.2);
    });

    // Phase 2: Food CRUD Operations
    group('Phase 2: Food CRUD Operations', function () {
        const crudStart = Date.now();

        // Create new food item
        const testFood = {
            ...sampleFoods[Math.floor(Math.random() * sampleFoods.length)],
            item: `Performance Test Food ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };

        const createResponse = http.post(
            `${config.baseUrl}/api/foods`,
            JSON.stringify(testFood),
            { headers }
        );

        const createSuccess = check(createResponse, {
            'food creation successful': (r) => r.status === 200 || r.status === 201,
            'created food has data': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    if (body.item === testFood.item || body.success) {
                        createdFoodIndex = body.index || body.id || Math.floor(Math.random() * 1000) + 500;
                        return true;
                    }
                    return false;
                } catch (e) {
                    return false;
                }
            }
        });

        sleep(0.1);

        // Update food item if creation was successful
        if (createSuccess && createdFoodIndex !== null) {
            const updatedFood = {
                ...testFood,
                item: `Updated ${testFood.item}`,
                calories: testFood.calories + 10,
                protein: testFood.protein + 1
            };

            const updateResponse = http.put(
                `${config.baseUrl}/api/foods/${createdFoodIndex}`,
                JSON.stringify(updatedFood),
                { headers }
            );

            check(updateResponse, {
                'food update successful': (r) => r.status === 200,
            });

            sleep(0.1);

            // Read updated food item
            const readResponse = http.get(`${config.baseUrl}/api/foods`, { headers });
            check(readResponse, {
                'food read after update': (r) => r.status === 200,
            });

            sleep(0.1);

            // Delete food item
            const deleteResponse = http.del(
                `${config.baseUrl}/api/foods/${createdFoodIndex}`,
                null,
                { headers }
            );

            check(deleteResponse, {
                'food deletion successful': (r) => r.status === 204 || r.status === 200,
            });
        }

        foodCrudDuration.add(Date.now() - crudStart);
        sleep(0.2);
    });

    // Phase 3: Bulk Operations Simulation
    group('Phase 3: Bulk Operations', function () {
        const bulkStart = Date.now();

        // Simulate bulk food loading (like importing nutrition database)
        const bulkSearches = [
            'protein',
            'carbohydrate', 
            'vitamin',
            'mineral',
            'supplement'
        ];

        const bulkResponses = http.batch(
            bulkSearches.map(term => [
                'GET', 
                `${config.baseUrl}/api/foods/search?q=${term}`, 
                null, 
                { headers }
            ])
        );

        bulkResponses.forEach((response, index) => {
            check(response, {
                [`bulk search ${bulkSearches[index]} successful`]: (r) => r.status === 200,
            });
        });

        // Simulate multiple food creations (batch import scenario)
        const batchFoods = Array.from({ length: 3 }, (_, i) => ({
            ...sampleFoods[i % sampleFoods.length],
            item: `Batch Food ${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`
        }));

        const batchCreateResponses = http.batch(
            batchFoods.map(food => [
                'POST',
                `${config.baseUrl}/api/foods`,
                JSON.stringify(food),
                { headers }
            ])
        );

        batchCreateResponses.forEach((response, index) => {
            check(response, {
                [`batch food ${index + 1} created`]: (r) => r.status === 200 || r.status === 201,
            });
        });

        bulkOperationsDuration.add(Date.now() - bulkStart);
        sleep(0.3);
    });

    // Phase 4: Database Performance Stress
    group('Phase 4: Database Performance Stress', function () {
        // Rapid sequential searches (stress test)
        const rapidSearchTerms = ['a', 'e', 'i', 'o', 'u'];
        
        rapidSearchTerms.forEach((term, index) => {
            const rapidResponse = http.get(
                `${config.baseUrl}/api/foods/search?q=${term}`, 
                { headers }
            );
            
            check(rapidResponse, {
                [`rapid search ${index + 1} successful`]: (r) => r.status === 200,
            });
            
            sleep(0.05); // Very short sleep to stress the system
        });

        // Concurrent database access
        const concurrentResponses = http.batch([
            ['GET', `${config.baseUrl}/api/foods`, null, { headers }],
            ['GET', `${config.baseUrl}/api/foods/search?q=protein`, null, { headers }],
            ['GET', `${config.baseUrl}/api/foods/search?q=carbs`, null, { headers }],
            ['GET', `${config.baseUrl}/api/foods/search?q=fat`, null, { headers }]
        ]);

        concurrentResponses.forEach((response, index) => {
            check(response, {
                [`concurrent request ${index + 1} successful`]: (r) => r.status === 200,
            });
        });

        sleep(0.2);
    });

    // Simulate realistic user behavior timing
    sleep(Math.random() * 2 + 0.5); // Random sleep between 0.5-2.5 seconds
}

export function teardown() {
    console.log('Food Database Load Test completed');
    console.log('Tested: Search Operations → CRUD Operations → Bulk Operations → Database Stress');
}