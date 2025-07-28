# Design Document

## Overview

The Playwright testing framework will be implemented as a standalone project within the existing NutriStats application workspace. The framework follows the Page Object Model (POM) pattern with reusable fixtures, independent test flows, and comprehensive coverage of the nutrition tracking application's functionality. The project will be organized in a separate `e2e-tests` directory with its own package.json and dependencies.

## Architecture

### Project Structure
```
e2e-tests/
├── package.json                    # Separate project dependencies
├── playwright.config.js           # Playwright configuration
├── .env.test                      # Test environment variables
├── .gitignore                     # Test-specific ignores
├── tests/                         # Test files organized by feature
│   ├── auth/                      # Authentication tests
│   │   ├── login.spec.js
│   │   ├── registration.spec.js
│   │   └── logout.spec.js
│   ├── diary/                     # Diary/meal tracking tests
│   │   ├── meal-tracking.spec.js
│   │   ├── food-search.spec.js
│   │   └── daily-navigation.spec.js
│   ├── foods/                     # Food database tests
│   │   ├── food-management.spec.js
│   │   └── food-search.spec.js
│   ├── reports/                   # Reports and analytics tests
│   │   ├── nutrition-reports.spec.js
│   │   └── data-visualization.spec.js
│   ├── settings/                  # Settings tests
│   │   └── user-settings.spec.js
│   └── weight/                    # Weight tracking tests
│       └── weight-tracking.spec.js
├── pages/                         # Page Object Model classes
│   ├── base/
│   │   ├── BasePage.js           # Base page with common functionality
│   │   └── BaseComponent.js      # Base component class
│   ├── auth/
│   │   ├── LoginPage.js
│   │   └── RegistrationPage.js
│   ├── diary/
│   │   └── DiaryPage.js
│   ├── foods/
│   │   └── FoodsPage.js
│   ├── reports/
│   │   └── ReportsPage.js
│   ├── settings/
│   │   └── SettingsPage.js
│   └── components/               # Reusable UI components
│       ├── Navigation.js
│       ├── FoodSearchModal.js
│       ├── MealSection.js
│       └── NutritionCard.js
├── fixtures/                     # Test fixtures and data
│   ├── auth.fixture.js          # Authentication fixtures
│   ├── user.fixture.js          # User data fixtures
│   ├── food.fixture.js          # Food data fixtures
│   └── meal.fixture.js          # Meal data fixtures
├── utils/                       # Utility functions
│   ├── test-helpers.js          # Common test utilities
│   ├── data-generators.js       # Test data generation
│   ├── api-helpers.js           # API interaction utilities
│   └── assertions.js            # Custom assertion helpers
├── data/                        # Test data files
│   ├── users.json              # Test user data
│   ├── foods.json              # Test food data
│   └── meals.json              # Test meal data
└── reports/                     # Test reports output
    └── html-report/            # HTML reports directory
```

### Design Patterns

#### Page Object Model (POM)
- **BasePage**: Contains common functionality shared across all pages
- **Page Classes**: Specific page implementations extending BasePage
- **Component Classes**: Reusable UI components that can be used across pages
- **Selector Management**: Centralized selector definitions with data-testid preference

#### Fixture Pattern
- **Authentication Fixtures**: Handle user login/logout states
- **Data Fixtures**: Provide consistent test data across tests
- **Browser Fixtures**: Manage browser context and storage
- **API Fixtures**: Handle API interactions for test setup/teardown

## Components and Interfaces

### Base Classes

#### BasePage
```javascript
class BasePage {
  constructor(page) {
    this.page = page;
    this.baseUrl = process.env.BASE_URL || 'http://localhost:8080';
  }

  async navigate(path = '') {
    await this.page.goto(`${this.baseUrl}${path}`);
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async takeScreenshot(name) {
    await this.page.screenshot({ path: `screenshots/${name}.png` });
  }

  // Common assertions and utilities
}
```

#### BaseComponent
```javascript
class BaseComponent {
  constructor(page, selector) {
    this.page = page;
    this.selector = selector;
  }

  async isVisible() {
    return await this.page.isVisible(this.selector);
  }

  async click() {
    await this.page.click(this.selector);
  }

  // Common component methods
}
```

### Page Objects

#### LoginPage
- Handles login form interactions
- Manages authentication state
- Provides login validation methods
- Handles error message verification

#### DiaryPage
- Manages meal tracking functionality
- Handles food search and selection
- Manages day navigation
- Provides nutrition calculation verification

#### FoodsPage
- Manages food database operations
- Handles CRUD operations for foods
- Provides search and filter functionality
- Manages inline editing capabilities

### Component Objects

#### Navigation Component
- Handles main navigation between pages
- Manages user menu interactions
- Provides navigation state verification

#### FoodSearchModal Component
- Manages food search functionality
- Handles food selection and quantity input
- Provides search result validation

#### MealSection Component
- Manages individual meal sections
- Handles food addition/removal
- Provides meal total calculations

## Data Models

### Test User Model
```javascript
const TestUser = {
  username: string,
  email: string,
  password: string,
  settings: {
    units: 'metric' | 'imperial',
    calorieGoal: number,
    proteinGoal: number,
    fatGoal: number
  }
};
```

### Test Food Model
```javascript
const TestFood = {
  name: string,
  calories: number,
  carbs: number,
  protein: number,
  fat: number,
  servingSize: string
};
```

### Test Meal Model
```javascript
const TestMeal = {
  day: string,
  mealType: string,
  foods: [
    {
      foodId: string,
      amount: number
    }
  ]
};
```

## Error Handling

### Test Failure Management
- **Screenshot Capture**: Automatic screenshots on test failures
- **Video Recording**: Optional video recording for debugging
- **Error Logging**: Comprehensive error logging with context
- **Retry Logic**: Configurable retry mechanisms for flaky tests

### API Error Handling
- **Network Failures**: Retry logic for network-related failures
- **Authentication Errors**: Automatic re-authentication on token expiry
- **Data Validation**: Validation of API responses before proceeding

### Browser State Management
- **Context Isolation**: Each test runs in isolated browser context
- **Storage Cleanup**: Automatic cleanup of localStorage/sessionStorage
- **Cookie Management**: Proper cookie handling between tests

## Testing Strategy

### Test Independence
- **Data Isolation**: Each test creates and cleans up its own data
- **User Isolation**: Separate test users for different test scenarios
- **State Reset**: Browser state reset between tests
- **Database Cleanup**: API-based cleanup of test data

### Test Data Management
- **Fixtures**: Predefined test data for consistent scenarios
- **Generators**: Dynamic test data generation for edge cases
- **API Setup**: Use API endpoints for efficient test data setup
- **Cleanup Hooks**: Automatic cleanup after test completion

### Coverage Strategy
- **Happy Path**: Core user flows and expected behaviors
- **Edge Cases**: Boundary conditions and error scenarios
- **Cross-browser**: Testing across Chrome, Firefox, and Safari
- **Responsive**: Testing on different viewport sizes

## Configuration

### Playwright Configuration
```javascript
module.exports = {
  testDir: './tests',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'reports/html-report' }],
    ['json', { outputFile: 'reports/test-results.json' }],
    ['junit', { outputFile: 'reports/junit.xml' }]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ]
};
```

### Environment Configuration
- **BASE_URL**: Application base URL for testing
- **API_BASE_URL**: API endpoint base URL
- **TEST_USER_PREFIX**: Prefix for test user accounts
- **CLEANUP_ENABLED**: Enable/disable automatic cleanup
- **HEADLESS**: Run tests in headless mode

### CI/CD Integration
- **GitHub Actions**: Workflow configuration for automated testing
- **Report Publishing**: HTML report publishing as artifacts
- **Parallel Execution**: Optimized parallel test execution
- **Environment Setup**: Automated application startup for testing

## Security Considerations

### Test Data Security
- **Sensitive Data**: No real user data in test fixtures
- **Password Management**: Secure test password generation
- **API Keys**: Environment-based API key management
- **Data Cleanup**: Thorough cleanup of test data

### Authentication Testing
- **Token Management**: Proper JWT token handling in tests
- **Session Isolation**: Isolated authentication sessions
- **Permission Testing**: Verification of access controls
- **Security Headers**: Validation of security-related headers