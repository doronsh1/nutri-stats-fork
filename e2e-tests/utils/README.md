# Test Utilities

This directory contains comprehensive utilities for the Playwright testing framework, organized into specialized modules for different aspects of testing.

## Overview

The utilities are designed to support the Page Object Model (POM) pattern and provide reusable functionality for:
- Test data generation
- API interactions for setup/teardown
- Custom assertions for nutrition tracking application
- Screenshot and debugging capabilities
- Network monitoring and performance testing

## Modules

### 1. Data Generators (`data-generators.js`)

Utilities for creating test data with realistic and edge-case scenarios.

```javascript
const { generateTestUser, generateTestFood, generateScenarioData } = require('./utils');

// Generate a test user
const user = generateTestUser({ username: 'custom_user' });

// Generate test food data
const food = generateTestFood({ name: 'Test Apple', calories: 95 });

// Generate data for specific scenarios
const scenarioData = generateScenarioData('daily-meal-tracking');
```

**Key Functions:**
- `generateTestUser()` - Create test user data
- `generateTestFood()` - Create test food items
- `generateTestMeal()` - Create meal entries
- `generateScenarioData()` - Generate data for specific test scenarios
- `generateEdgeCaseData()` - Create edge case test data

### 2. API Helpers (`api-helpers.js`)

Comprehensive API interaction utilities for test setup and teardown.

```javascript
const ApiHelpers = require('./utils/api-helpers');

const api = new ApiHelpers();
await api.init();

// Register and login user
await api.registerUser(userData);
await api.loginUser(credentials);

// Create test data
await api.createFood(foodData);
await api.createMeal(mealData);

// Cleanup
await api.cleanupUserData();
```

**Key Features:**
- Authentication management (login/logout/register)
- CRUD operations for all entities (foods, meals, weights, settings)
- Bulk operations for test setup
- Automatic cleanup utilities
- Request retry logic with exponential backoff

### 3. Custom Assertions (`assertions.js`)

Application-specific assertion helpers for nutrition tracking validation.

```javascript
const { createNutritionAssertions } = require('./utils');

const nutritionAsserts = createNutritionAssertions(page);

// Assert nutrition calculations
await nutritionAsserts.assertNutritionValues(actual, expected, tolerance);
await nutritionAsserts.assertMealTotals(mealSelector, expectedTotals);
await nutritionAsserts.assertDailyTotals(expectedTotals);

// Assert UI elements
await nutritionAsserts.assertToastNotification('Success!', 'success');
await nutritionAsserts.assertFormValidationErrors({ email: 'Invalid email' });
```

**Key Assertions:**
- Nutrition value validation with tolerance
- Meal and daily total calculations
- Food search result validation
- Weight trend analysis
- Chart data verification
- Form validation errors
- Toast notifications

### 4. Test Helpers (`test-helpers.js`)

General-purpose utilities for test execution and debugging.

```javascript
const { 
  retryWithBackoff, 
  takeContextualScreenshot, 
  monitorNetworkRequests,
  calculateNutritionTotals 
} = require('./utils');

// Retry operations with backoff
await retryWithBackoff(async () => {
  return await api.createFood(foodData);
}, 3, 1000);

// Monitor network activity
const monitor = await monitorNetworkRequests(page, {
  logRequests: true,
  filterUrls: ['/api/']
});

// Calculate nutrition totals
const totals = calculateNutritionTotals(foodItems);
```

**Key Features:**
- Retry logic with exponential backoff
- Network request monitoring
- Performance testing utilities
- Screenshot capture with context
- Data validation helpers
- Browser state management

### 5. Debug Helpers (`debug-helpers.js`)

Enhanced debugging utilities for test development and troubleshooting.

```javascript
const { createDebugHelpers } = require('./utils');

const debug = createDebugHelpers(page, testInfo);

// Enable debug mode
process.env.DEBUG_TESTS = 'true';

// Debug interactions
await debug.debugInteraction('[data-testid="login-button"]', 'click');
await debug.debugScreenshot('after-login');

// Monitor operations
await debug.debugNetworkActivity(async () => {
  await page.click('[data-testid="submit"]');
});

// Create failure reports
await debug.createFailureReport(error);
```

**Key Features:**
- Enhanced logging with context
- Debug screenshots with naming
- Page state capture
- Element highlighting
- Network activity monitoring
- Console message capture
- Failure report generation

## Usage Examples

### Basic Test Setup

```javascript
const { test, expect } = require('@playwright/test');
const { 
  ApiHelpers, 
  generateTestUser, 
  createNutritionAssertions,
  createDebugHelpers 
} = require('./utils');

test('meal tracking workflow', async ({ page }) => {
  const api = new ApiHelpers();
  const nutritionAsserts = createNutritionAssertions(page);
  const debug = createDebugHelpers(page);
  
  // Setup test data
  const userData = generateTestUser();
  await api.registerUser(userData);
  await api.loginUser(userData);
  
  // Test implementation...
  
  // Cleanup
  await api.cleanupUserData();
});
```

### Scenario-Based Testing

```javascript
const { generateScenarioData } = require('./utils');

test('daily meal tracking scenario', async ({ page }) => {
  const scenarioData = generateScenarioData('daily-meal-tracking');
  
  // Use generated data for comprehensive testing
  const { user, foods, meals } = scenarioData;
  
  // Test implementation...
});
```

### Performance Testing

```javascript
const { assertPagePerformance, monitorNetworkRequests } = require('./utils');

test('page performance', async ({ page }) => {
  const monitor = await monitorNetworkRequests(page);
  
  await page.goto('/diary');
  
  // Assert performance thresholds
  await assertPagePerformance(page, {
    loadTime: 2000,
    firstContentfulPaint: 1500
  });
  
  const requests = monitor.getRequests();
  expect(requests.length).toBeLessThan(10);
});
```

## Environment Variables

- `DEBUG_TESTS=true` - Enable debug mode for enhanced logging and screenshots
- `API_BASE_URL` - Base URL for API requests (default: http://localhost:8080)
- `BASE_URL` - Base URL for the application (default: http://localhost:8080)

## Best Practices

1. **Use scenario data generators** for realistic test data
2. **Implement proper cleanup** using API helpers
3. **Leverage custom assertions** for nutrition-specific validations
4. **Enable debug mode** during test development
5. **Monitor network requests** for performance testing
6. **Use retry logic** for flaky operations
7. **Take contextual screenshots** for debugging failures

## File Structure

```
utils/
├── index.js              # Centralized exports
├── api-helpers.js         # API interaction utilities
├── assertions.js          # Custom assertion helpers
├── data-generators.js     # Test data generation
├── test-helpers.js        # General test utilities
├── debug-helpers.js       # Debug and troubleshooting
└── README.md             # This documentation
```

## Contributing

When adding new utilities:
1. Follow the existing patterns and naming conventions
2. Add comprehensive JSDoc documentation
3. Include usage examples in comments
4. Export functions through `index.js`
5. Update this README with new functionality