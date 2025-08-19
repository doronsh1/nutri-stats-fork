import { check } from 'k6';
import http from 'k6/http';
import { config, sampleFoods } from './config/test-config.js';
import { setupAuth, getAuthHeaders } from './utils/auth-helper.js';

export function setup() {
  return setupAuth();
}

export default function (data) {
  const { token } = data;
  const headers = getAuthHeaders(token);

  console.log('Testing POST /api/foods...');
  console.log('Headers:', JSON.stringify(headers));
  
  const testFood = {
    item: 'Debug Apple Test',
    amount: '100g',
    calories: 52,
    protein: 0.3,
    protein_general: 0.3,
    carbs: 14,
    fat: 0.2
  };

  console.log('Sending food data:', JSON.stringify(testFood));

  const response = http.post(`${config.baseUrl}/api/foods`, JSON.stringify(testFood), { headers });
  
  console.log('Response status:', response.status);
  console.log('Response body:', response.body);
  console.log('Response headers:', JSON.stringify(response.headers));

  check(response, {
    'status is 201': (r) => r.status === 201,
    'status is not 500': (r) => r.status !== 500,
    'has response body': (r) => r.body && r.body.length > 0
  });
}