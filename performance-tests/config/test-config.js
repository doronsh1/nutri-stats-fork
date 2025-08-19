// K6 Test Configuration
export const config = {
  // Base URL for the API
  baseUrl: __ENV.BASE_URL || 'http://localhost:8080',
  
  // Test user credentials
  testUser: {
    email: __ENV.TEST_EMAIL || 'test@example.com',
    password: __ENV.TEST_PASSWORD || 'TestPassword123',
    name: __ENV.TEST_NAME || 'Test User'
  },
  
  // Test scenarios configuration
  scenarios: {
    // Light load test
    light: {
      vus: 5,
      duration: '30s'
    },
    
    // Medium load test
    medium: {
      vus: 20,
      duration: '2m'
    },
    
    // Heavy load test
    heavy: {
      vus: 50,
      duration: '5m'
    },
    
    // Stress test - K6 stages format
    stress: {
      stages: [
        { duration: '1m', target: 10 },
        { duration: '2m', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '1m', target: 0 }
      ]
    },
    
    // Spike test - K6 stages format
    spike: {
      stages: [
        { duration: '30s', target: 10 },
        { duration: '10s', target: 100 },
        { duration: '30s', target: 10 },
        { duration: '10s', target: 0 }
      ]
    }
  },
  
  // K6 CLI stage formats (for use with --stage parameter)
  stageFormats: {
    // Light ramp: 5s to 10 users, 30s at 10 users, 5s down to 0
    light: '5s:10,30s:10,5s:0',
    
    // Medium ramp: 10s to 20 users, 2m at 20 users, 10s down to 0  
    medium: '10s:20,2m:20,10s:0',
    
    // Heavy ramp: 30s to 50 users, 5m at 50 users, 30s down to 0
    heavy: '30s:50,5m:50,30s:0',
    
    // Stress test: gradual increase
    stress: '1m:10,2m:50,2m:100,1m:0',
    
    // Spike test: sudden spikes
    spike: '30s:10,10s:100,30s:10,10s:0'
  },
  
  // Performance thresholds
  thresholds: {
    // HTTP request duration should be below 500ms for 95% of requests
    http_req_duration: ['p(95)<500'],
    
    // HTTP request failure rate should be below 1%
    http_req_failed: ['rate<0.01'],
    
    // Checks should pass 95% of the time
    checks: ['rate>0.95']
  }
};

// Sample food data for testing (matching database schema)
export const sampleFoods = [
  {
    item: 'Apple',
    amount: '100g',
    calories: 52,
    protein: 0.3,
    protein_general: 0.3,
    carbs: 14,
    fat: 0.2
  },
  {
    item: 'Banana',
    amount: '100g',
    calories: 89,
    protein: 1.1,
    protein_general: 1.1,
    carbs: 23,
    fat: 0.3
  },
  {
    item: 'Chicken Breast',
    amount: '100g',
    calories: 165,
    protein: 31,
    protein_general: 31,
    carbs: 0,
    fat: 3.6
  }
];