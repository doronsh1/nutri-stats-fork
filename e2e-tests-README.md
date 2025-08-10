# NutriStats E2E Testing Framework

[![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=flat&logo=playwright&logoColor=white)](https://playwright.dev/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-3.0+-003B57?style=flat&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Testing](https://img.shields.io/badge/Testing-E2E-FF6B6B?style=flat&logo=testinglibrary&logoColor=white)](https://testing-library.com/)

> **🚧 Under Construction** - This testing framework is currently in active development and not yet complete.

A comprehensive end-to-end testing framework for the **[NutriStats](https://github.com/yourusername/NutriStats)** professional athlete nutrition planning and analytics platform. Built with Playwright, this framework provides robust automated testing for all critical user workflows and features.

## 🎯 Overview

This E2E testing suite validates the complete functionality of the NutriStats web application, ensuring reliable performance for professional athletes and sports nutrition professionals. The framework uses modern testing practices with the Page Object Model pattern and comprehensive test coverage.

## 🔗 Related Project

**Main Application:** [NutriStats - Pro Athlete Nutrition Planning & Analytics Platform](https://github.com/yourusername/NutriStats)

The NutriStats application is a comprehensive web-based nutrition tracking and analytics platform specifically designed for professional athletes and sports nutrition professionals, featuring advanced meal planning, macro tracking, weight management, and performance analytics.

## ✨ Framework Features

### 🧪 Comprehensive Test Coverage
- **Authentication System** - Login, registration, logout, and session management
- **Weight Tracking** - Entry creation, editing, validation, and statistics
- **Meal Planning** - Daily meal tracking and macro calculations
- **Food Database** - Food management and search functionality
- **User Settings** - Profile management and preferences
- **Reports & Analytics** - Nutrition reports and data visualization

### 🏗️ Modern Testing Architecture
- **Page Object Model** - Maintainable and reusable page classes
- **Fixture-Based Testing** - Consistent test setup and teardown
- **Data Generators** - Dynamic test data creation
- **Database Management** - Automated test data cleanup
- **Artifact Management** - Screenshots, videos, and reports
- **Cross-Browser Support** - Chromium, Firefox, and WebKit testing

### 📊 Advanced Reporting
- **HTML Reports** - Detailed visual test results
- **JSON Reports** - Machine-readable test data
- **Screenshot Capture** - Visual validation and debugging
- **Video Recording** - Test execution playback
- **Trace Viewer** - Step-by-step test analysis

## 🛠️ Technology Stack

### Core Testing Framework
- **Playwright** - Modern web testing framework
- **JavaScript (ES6+)** - Test implementation language
- **Node.js** - Runtime environment
- **SQLite3** - Test database management

### Testing Infrastructure
- **Page Object Model** - Structured test organization
- **Fixture Pattern** - Reusable test components
- **Data Generators** - Dynamic test data creation
- **Artifact Management** - Test output organization
- **Cross-Environment Support** - Local and CI/CD testing

## 📁 Project Structure

```
e2e-tests/
├── config/                    # Configuration files
│   └── artifact-config.js     # Artifact management settings
├── data/                      # Test data and database
│   ├── backups/              # Database backups
│   └── origin/               # Original test database
├── fixtures/                  # Test fixtures
│   └── auth.fixture.js       # Authentication fixtures
├── pages/                     # Page Object Model classes
│   ├── auth/                 # Authentication pages
│   ├── base/                 # Base page classes
│   ├── components/           # Reusable components
│   ├── diary/                # Meal tracking pages
│   ├── foods/                # Food management pages
│   ├── reports/              # Analytics and reports
│   └── settings/             # User settings pages
├── scripts/                   # Utility scripts
│   ├── cleanup-test-data.js  # Data cleanup automation
│   ├── manage-artifacts.js   # Artifact management
│   └── setup-test-database.js # Database initialization
├── test-artifacts/            # Test outputs
│   ├── reports/              # HTML and JSON reports
│   ├── screenshots/          # Test screenshots
│   ├── traces/               # Playwright traces
│   └── videos/               # Test recordings
├── tests/                     # Test specifications
│   ├── auth/                 # Authentication tests
│   ├── diary/                # Meal tracking tests
│   ├── foods/                # Food management tests
│   ├── settings/             # Settings tests
│   └── weight/               # Weight tracking tests
├── utils/                     # Utility functions
│   ├── api-helpers.js        # API interaction helpers
│   ├── assertions.js         # Custom assertions
│   ├── data-generators.js    # Test data generation
│   ├── database-manager.js   # Database utilities
│   └── test-helpers.js       # General test utilities
├── global-setup.js           # Global test setup
├── global-teardown.js        # Global test cleanup
├── playwright.config.js      # Playwright configuration
└── package.json              # Dependencies and scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Access to NutriStats application (running locally or deployed)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd nutristats-e2e-tests
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install Playwright browsers:**
   ```bash
   npx playwright install
   ```

4. **Configure environment:**
   ```bash
   cp .env.test .env.local
   # Edit .env.local with your application URL and settings
   ```

5. **Verify setup:**
   ```bash
   npm run verify
   ```

## 🧪 Running Tests

### Basic Test Execution
```bash
# Run all tests
npm test

# Run tests in headed mode (visible browser)
npm run test:headed

# Run tests with UI mode for debugging
npm run test:ui

# Run tests in debug mode
npm run test:debug
```

### Specialized Test Runs
```bash
# Run smoke tests (quick validation)
npm run test:smoke

# Run tests with automatic cleanup
npm run test:safe

# Run tests without artifact cleanup
npm run test:no-clean
```

### Test Reports
```bash
# View HTML test report
npm run test:report

# Generate and view all reports
npm run artifacts:stats
```

## 📋 Current Test Coverage

### ✅ Implemented Features

#### **Authentication System (100% Coverage)**
- ✅ User registration with validation
- ✅ Login with credential verification
- ✅ Logout and session management
- ✅ Authentication state persistence
- ✅ Form validation and error handling
- ✅ Password strength requirements
- ✅ Email format validation

#### **Weight Tracking System (90% Coverage)**
- ✅ Weight entry creation and editing
- ✅ Data validation and error handling
- ✅ Weight history management
- ✅ Statistics calculations
- ✅ Chart visualization
- ✅ Entry deletion and confirmation
- 🔄 Advanced analytics (in progress)

#### **Testing Infrastructure (100% Coverage)**
- ✅ Page Object Model implementation
- ✅ Authentication fixtures
- ✅ Data generators and cleanup
- ✅ Database management
- ✅ Artifact management
- ✅ Cross-browser testing setup

### 🚧 In Development

#### **Meal Tracking System (30% Coverage)**
- 🔄 Daily meal entry and editing
- 🔄 Macro calculation validation
- 🔄 Food search and selection
- ⏳ Meal timing and scheduling
- ⏳ Nutritional analysis

#### **Food Database Management (20% Coverage)**
- 🔄 Food creation and editing
- 🔄 Search functionality
- ⏳ Batch operations
- ⏳ Import/export features

#### **Reports & Analytics (10% Coverage)**
- ⏳ Nutrition report generation
- ⏳ Performance analytics
- ⏳ Data visualization
- ⏳ Export capabilities

#### **User Settings (0% Coverage)**
- ⏳ Profile management
- ⏳ Preference settings
- ⏳ Unit conversions
- ⏳ Theme customization

### 📊 Test Statistics
- **Total Test Files:** 12
- **Total Test Cases:** 150+
- **Passing Tests:** 120+ (80%)
- **Page Object Classes:** 15
- **Utility Functions:** 25+
- **Test Fixtures:** 5

## 🔧 Configuration

### Environment Variables
```env
# Application Configuration
BASE_URL=http://localhost:8080
NODE_ENV=test

# Database Configuration
DB_PATH=./data/origin/nutrition_app.db
BACKUP_PATH=./data/backups/

# Test Configuration
CLEANUP_ARTIFACTS=true
CLEANUP_MODE=selective
HEADLESS=true
BROWSER=chromium
```

### Playwright Configuration
- **Browsers:** Chromium (primary), Firefox, WebKit
- **Parallel Execution:** Enabled for faster test runs
- **Retry Logic:** 2 retries on CI, 0 locally
- **Timeouts:** 10s action, 30s navigation
- **Artifacts:** Screenshots, videos, traces

## 🎯 Test Scenarios

### Critical User Journeys
1. **New User Registration** → Profile Setup → First Meal Entry
2. **Daily Nutrition Tracking** → Meal Planning → Progress Review
3. **Weight Management** → Goal Setting → Progress Monitoring
4. **Food Database** → Custom Food Creation → Meal Integration
5. **Analytics Review** → Report Generation → Data Export

### Edge Cases & Validation
- Form validation with invalid data
- Network error handling
- Session timeout scenarios
- Data persistence verification
- Cross-browser compatibility
- Mobile responsiveness

## 📈 Reporting & Analytics

### HTML Reports
- Visual test results with screenshots
- Test execution timeline
- Failure analysis and debugging
- Performance metrics

### Artifact Management
- Automatic screenshot capture
- Video recording on failures
- Trace collection for debugging
- Organized artifact storage

### CI/CD Integration
- GitHub Actions compatibility
- Docker container support
- Parallel test execution
- Automated reporting

## 🤝 Contributing

### Development Workflow
1. Create feature branch
2. Implement tests following Page Object Model
3. Add data generators and fixtures
4. Update documentation
5. Submit pull request

### Testing Standards
- Follow Page Object Model pattern
- Use descriptive test names
- Include proper assertions
- Add screenshot verification
- Maintain test data cleanup

### Code Quality
- ESLint configuration
- Prettier formatting
- JSDoc documentation
- Error handling standards

## 🔍 Debugging & Troubleshooting

### Common Issues
```bash
# Browser installation issues
npx playwright install --force

# Database connection problems
npm run db:cleanup
npm run verify

# Artifact cleanup
npm run artifacts:clean:all
```

### Debug Mode
```bash
# Run specific test in debug mode
npx playwright test tests/auth/login.spec.js --debug

# Use UI mode for interactive debugging
npm run test:ui
```

## 📚 Documentation

### Test Writing Guide
- Page Object Model best practices
- Fixture usage patterns
- Data generation strategies
- Assertion techniques

### API Reference
- Page class methods
- Utility functions
- Configuration options
- Environment variables

## 🔗 Links & Resources

- **Main Application:** [NutriStats Repository](https://github.com/yourusername/NutriStats)
- **Live Demo:** [http://34.59.48.42:8080](http://34.59.48.42:8080)
- **Playwright Documentation:** [https://playwright.dev](https://playwright.dev)
- **Testing Best Practices:** [Internal Wiki](./docs/testing-guide.md)

## 📄 License

This testing framework is part of the NutriStats project ecosystem. See the main repository for licensing information.

## 📞 Contact

For questions about the testing framework or contributions:
- Create an issue in this repository
- Contact the development team
- Join our testing discussions

---

**🏆 Ensuring Quality Through Comprehensive Testing**

> This framework is actively maintained and continuously improved to provide reliable testing coverage for the NutriStats application. Join us in building robust, professional-grade nutrition software for athletes worldwide.