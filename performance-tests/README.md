# NutriStats Performance Tests - K6 Testing Suite

[![K6](https://img.shields.io/badge/K6-Performance%20Testing-7D64FF?style=flat&logo=k6&logoColor=white)](https://k6.io/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Grafana](https://img.shields.io/badge/Grafana-Monitoring-F46800?style=flat&logo=grafana&logoColor=white)](https://grafana.com/)
[![PowerShell](https://img.shields.io/badge/PowerShell-Automation-5391FE?style=flat&logo=powershell&logoColor=white)](https://docs.microsoft.com/en-us/powershell/)

Professional performance testing suite for the NutriStats API using K6, designed for comprehensive load testing, stress testing, and performance validation of nutrition tracking endpoints.

## 🔗 Related Projects

- **[NutriStats Main Application](https://github.com/TomerTTB/Stats)** - The main NutriStats nutrition tracking platform that these tests validate

## 🎯 Overview

NutriStats Performance Tests provide comprehensive performance validation for the NutriStats API using K6. This suite focuses on **performance over functionality**, emphasizing response times, throughput, error rates, and system behavior under various load conditions.

## Table of Contents

- [Core Features](#core-features)
- [Installation](#installation)
- [Test Types](#test-types)
- [Running Tests](#running-tests)
- [Grafana Integration](#grafana-integration)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Performance Metrics](#performance-metrics)
- [Authentication](#authentication)
- [Load Patterns](#load-patterns)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Related Projects](#related-projects)

## ✨ Core Features

### 🚀 Performance Testing Types
- **Smoke Tests** - API endpoint validation and basic functionality
- **Load Tests** - Normal traffic simulation and system responsiveness
- **Stress Tests** - Gradual load increase to identify system limits
- **Spike Tests** - Sudden traffic spikes and system resilience
- **Custom Tests** - Flexible load patterns for specific scenarios

### 📊 Advanced Monitoring & Reporting
- **Real-time Metrics** - Live performance data during test execution
- **Grafana Integration** - Visual dashboards and historical data analysis
- **K6 Cloud Support** - Cloud-based test execution and reporting
- **Multiple Output Formats** - JSON, CSV, and custom reporting formats
- **Threshold Validation** - Automated pass/fail criteria

### 🔐 Authentication Testing
- **JWT Token Management** - Automatic authentication and token refresh
- **Multi-user Simulation** - Concurrent user authentication scenarios
- **Session Management** - Token lifecycle and expiration handling
- **Rate Limiting Validation** - Authentication endpoint stress testing

### ⚙️ Flexible Configuration
- **Environment Variables** - Easy configuration for different environments
- **PowerShell Automation** - Windows-friendly test execution
- **NPM Scripts** - Cross-platform test commands
- **Custom Load Patterns** - Define specific user behavior scenarios

## Installation

### Prerequisites

1. **Install K6**:
   ```bash
   # Windows
   winget install k6
   
   # macOS
   brew install k6
   
   # Linux (Ubuntu/Debian)
   sudo gpg -k
   sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
   echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
   sudo apt-get update
   sudo apt-get install k6
   ```

2. **NutriStats Server**: Ensure the main application is running
   ```bash
   # Default: http://localhost:8080
   node server.js
   ```

3. **Optional - Grafana** (for advanced reporting):
   ```bash
   # Docker
   docker run -d -p 3000:3000 grafana/grafana
   ```

### Setup

1. **Clone this repository**:
   ```bash
   git clone https://github.com/TomerTTB/nutri-stats-performance-k6.git
   cd nutri-stats-performance-k6
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Verify installation**:
   ```bash
   k6 version
   ```

## 🧪 Test Types

### 1. Smoke Test (`smoke`)
- **Purpose**: API endpoint validation and basic functionality
- **Load**: 10 users over 40 seconds
- **Focus**: All endpoints working correctly
- **Thresholds**: 95% under 2s, <5% failures, 95% checks pass

### Next tests (Coming soon)

### 2. Load Test (`load`)
- **Purpose**: Normal traffic simulation
- **Load**: 5-10 users over 75 seconds
- **Focus**: System responsiveness under typical load
- **Thresholds**: 95% under 800ms, <2% failures

### 3. Auth Performance Test (`auth`)
- **Purpose**: Authentication system performance
- **Load**: 5-25 users over 70 seconds
- **Focus**: JWT operations, login/logout performance
- **Thresholds**: 95% under 500ms, <1% failures

### 4. Foods Performance Test (`foods`)
- **Purpose**: Foods API CRUD operations
- **Load**: 10-30 users over 105 seconds
- **Focus**: Database operations, search performance
- **Thresholds**: 95% under 600ms, <2% failures

### 5. Stress Test (`stress`)
- **Purpose**: System limits identification
- **Load**: 10-100 users over 12 minutes
- **Focus**: Breaking point analysis
- **Thresholds**: 95% under 1s, <5% failures

### 6. Spike Test (`spike`)
- **Purpose**: Traffic spike resilience
- **Load**: Sudden spikes to 150 users
- **Focus**: System recovery and stability
- **Thresholds**: 95% under 2s, <10% failures

### 7. Custom Test (`custom`)
- **Purpose**: Flexible load patterns
- **Load**: User-defined stages
- **Focus**: Specific scenarios
- **Thresholds**: 95% under 1s, <3% failures

## 🚀 Running Tests

### PowerShell Script (Recommended)

```powershell
# Basic test execution
.\run-k6.ps1 smoke
.\run-k6.ps1 load
.\run-k6.ps1 stress

# Custom environment
.\run-k6.ps1 smoke -BaseUrl "http://staging.nutristats.com"

# Custom credentials
.\run-k6.ps1 load -TestEmail "test@example.com" -TestPassword "MyPassword123"

# Save results to file
.\run-k6.ps1 stress -OutputFormat json -OutputFile "stress-results.json"

# Custom load pattern
.\run-k6.ps1 custom -Stages "30s:10,2m:50,30s:0"

# Run with Grafana output (local)
.\run-k6.ps1 load -OutputFormat "influxdb=http://localhost:8086/k6"

# Run in K6 Cloud
.\run-k6.ps1 smoke -Cloud

# Get help
.\run-k6.ps1 -Help
```

### NPM Scripts

```bash
# Quick test commands
npm run test:smoke     # Smoke test
npm run test:load      # Load test
npm run test:stress    # Stress test
npm run test:spike     # Spike test

# Custom tests
npm run test:custom    # Custom load test
npm run help           # Show available commands
```

### Direct K6 Commands

```bash
# Set environment variables
export BASE_URL=http://localhost:8080
export TEST_EMAIL=demo@nutristats.com
export TEST_PASSWORD=NutriStats1
export PROJECT_ID=3729747

# Run tests directly
k6 run tests/smoke-test.js
k6 run tests/load-test.js

# With custom stages
k6 run --stage 30s:10,2m:50,30s:0 tests/custom-test.js

# With output to file
k6 run --out json=results.json tests/stress-test.js

# With Grafana output
k6 run --out influxdb=http://localhost:8086/k6 tests/load-test.js

# K6 Cloud execution
k6 cloud tests/smoke-test.js
```

## 📊 Grafana Integration

### Local Grafana Setup

1. **Start InfluxDB and Grafana**:
   ```bash
   # Using Docker Compose
   docker-compose up -d influxdb grafana
   
   # Or individually
   docker run -d -p 8086:8086 influxdb:1.8
   docker run -d -p 3000:3000 grafana/grafana
   ```

2. **Configure InfluxDB data source in Grafana**:
   - URL: `http://localhost:8086`
   - Database: `k6`
   - User: `k6`
   - Password: `k6`

3. **Run tests with InfluxDB output**:
   ```powershell
   # Local Grafana monitoring
   .\run-k6.ps1 load -OutputFormat "influxdb=http://localhost:8086/k6"
   
   # Multiple outputs
   .\run-k6.ps1 stress -OutputFormat "json=results.json" -OutputFormat "influxdb=http://localhost:8086/k6"
   ```

### K6 Cloud Integration

```powershell
# Cloud execution with web dashboard
.\run-k6.ps1 smoke -Cloud

# Cloud execution with local results
k6 cloud --local-execution tests/load-test.js
```

### Grafana Dashboard Features

- **Real-time Metrics**: Live performance data during test execution
- **Historical Analysis**: Compare test runs over time
- **Custom Alerts**: Set up notifications for performance degradation
- **Multi-test Comparison**: Analyze different test types side by side

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `http://localhost:8080` | NutriStats API base URL |
| `TEST_EMAIL` | `performance@nutristats.com` | Test user email |
| `TEST_PASSWORD` | `NutriStats1` | Test user password |
| `PROJECT_ID` | `3729747` | K6 Cloud project ID |

### PowerShell Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `-BaseUrl` | String | Override API base URL |
| `-TestEmail` | String | Override test user email |
| `-TestPassword` | String | Override test user password |
| `-Stages` | String | Custom load stages (format: "30s:10,2m:50,30s:0") |
| `-OutputFormat` | String | Output format (json, csv, influxdb) |
| `-OutputFile` | String | Output file path |
| `-Cloud` | Switch | Run test in K6 Cloud |

### Performance Thresholds

Each test type has optimized thresholds:

```javascript
// Smoke Test
thresholds: {
    http_req_duration: ['p(95)<2000'],  // 95% under 2s
    http_req_failed: ['rate<0.05'],     // Less than 5% failures
    checks: ['rate>0.95']               // 95% checks pass
}

// Load Test
thresholds: {
    http_req_duration: ['p(95)<800'],   // 95% under 800ms
    http_req_failed: ['rate<0.02'],     // Less than 2% failures
    checks: ['rate>0.98']               // 98% checks pass
}

// Stress Test
thresholds: {
    http_req_duration: ['p(95)<1000'],  // 95% under 1s
    http_req_failed: ['rate<0.05'],     // Less than 5% failures
    checks: ['rate>0.90']               // 90% checks pass
}
```

## 🏗️ Project Structure

```
nutri-stats-performance-k6/
├── config/
│   └── test-config.js              # Test configuration and sample data
├── utils/
│   └── auth-helper.js              # JWT authentication utilities
├── tests/
│   ├── smoke-test.js               # Comprehensive API validation
│   ├── load-test.js                # Normal load simulation
│   ├── auth-test.js                # Authentication performance
│   ├── foods-test.js               # Foods API performance
│   ├── stress-test.js              # System limits testing
│   ├── spike-test.js               # Traffic spike testing
│   └── custom-test.js              # Flexible load patterns
├── examples/
│   └── api-auth-me-request.md      # API request examples
├── run-k6.ps1                     # PowerShell test runner
├── package.json                    # Project metadata and scripts
├── docker-compose.yml              # Grafana/InfluxDB setup
└── README.md                       # This documentation
```

## 📈 Performance Metrics

### K6 Built-in Metrics

- **http_req_duration**: Request response time
- **http_req_failed**: Failed request rate
- **http_reqs**: Total HTTP requests
- **data_received**: Data downloaded
- **data_sent**: Data uploaded
- **vus**: Virtual users
- **iterations**: Completed iterations

### Custom Metrics

- **api_responsive**: API availability check
- **auth_system_responsive**: Authentication system health
- **foods_api_responsive**: Foods API performance
- **endpoint_validation**: Individual endpoint checks

### Sample Output

```
✓ api responsive
✓ auth system responsive  
✓ foods api responsive
✓ endpoint validation

checks.........................: 96.8% ✓ 2420    ✗ 80
data_received..................: 2.1 MB 35 kB/s
data_sent......................: 780 kB 13 kB/s
http_req_duration..............: avg=145ms min=12ms med=98ms max=1.2s p(90)=285ms p(95)=420ms
http_req_failed................: 1.8%  ✓ 45     ✗ 2455
http_reqs......................: 2500   41.7/s
iteration_duration.............: avg=1.4s  min=0.9s med=1.2s max=2.8s p(90)=2.1s p(95)=2.4s
iterations.....................: 1250   20.8/s
vus............................: 25     min=10    max=25
vus_max........................: 25     min=25    max=25
```

## 🔐 Authentication

### JWT Token Management

Tests handle authentication automatically:

1. **Setup Phase**: Each virtual user authenticates once
2. **Token Reuse**: JWT tokens shared across requests
3. **Auto-refresh**: Automatic re-authentication on expiry
4. **Bearer Headers**: Proper Authorization header formatting

### Authentication Flow

```javascript
// Automatic authentication in setup
export function setup() {
    return setupAuth();
}

// Token usage in tests
export default function (data) {
    const { token } = data;
    const headers = getAuthHeaders(token);
    
    // All requests include authentication
    const response = http.get(`${config.baseUrl}/api/foods`, { headers });
}
```

## 🔄 Load Patterns

### Stage Format Examples

```bash
# Light load: 30s ramp to 10 users, 2m steady, 30s ramp down
"30s:10,2m:10,30s:0"

# Medium load: 1m ramp to 25 users, 3m steady, 1m ramp down  
"1m:25,3m:25,1m:0"

# Stress pattern: gradual increase to find limits
"2m:20,3m:50,3m:80,2m:0"

# Spike pattern: sudden traffic increases
"1m:10,30s:100,1m:10,30s:0"

# Complex pattern: multiple phases
"30s:5,1m:15,30s:30,2m:30,1m:50,30s:10,30s:0"
```

### Load Pattern Guidelines

- **Ramp-up**: Gradual user increase (avoid sudden spikes unless testing spikes)
- **Steady State**: Maintain load for meaningful duration
- **Ramp-down**: Graceful load decrease
- **Realistic Timing**: Match actual user behavior patterns

## 💡 Best Practices

### Test Execution

1. **Start Small**: Begin with smoke tests before load testing
2. **Baseline First**: Establish performance baselines
3. **Gradual Scaling**: Increase load incrementally
4. **Environment Consistency**: Use dedicated test environments
5. **Monitor Resources**: Watch server CPU, memory, database

### Performance Analysis

1. **Multiple Runs**: Execute tests multiple times for consistency
2. **Compare Results**: Track performance trends over time
3. **Identify Bottlenecks**: Focus on slowest endpoints
4. **Set Realistic Thresholds**: Base limits on business requirements
5. **Document Findings**: Record performance characteristics

### CI/CD Integration

```yaml
# Example GitHub Actions workflow
- name: Run Performance Tests
  run: |
    .\run-k6.ps1 smoke -OutputFormat json -OutputFile smoke-results.json
    .\run-k6.ps1 load -OutputFormat json -OutputFile load-results.json
```

## 🔧 Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| K6 not found | K6 not installed or not in PATH | Install K6 and add to system PATH |
| Connection refused | NutriStats server not running | Start server: `node server.js` |
| Authentication failures | Invalid test credentials | Check TEST_EMAIL and TEST_PASSWORD |
| High error rates | Server overloaded | Reduce load or scale server resources |
| Timeout errors | Network or server latency | Increase timeout thresholds |

### Debug Commands

```powershell
# Verbose test execution
.\run-k6.ps1 smoke -BaseUrl http://localhost:8080

# Check server status
curl http://localhost:8080/api/test

# Validate authentication
curl -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d '{"email":"demo@nutristats.com","password":"NutriStats1"}'

# Monitor server resources during tests
# Task Manager (Windows) or htop (Linux)
```

### Performance Optimization

1. **Database Indexing**: Ensure proper database indexes
2. **Connection Pooling**: Configure database connection limits
3. **Caching**: Implement response caching where appropriate
4. **Load Balancing**: Distribute load across multiple servers
5. **Resource Monitoring**: Track CPU, memory, and I/O usage

## 🔗 Related Projects

- **[NutriStats Main Application](https://github.com/TomerTTB/Stats)** - The main NutriStats nutrition tracking platform
- **[NutriStats E2E Tests](https://github.com/TomerTTB/nutri-stats-e2e-playwright)** - End-to-end testing suite with Playwright

## 📄 License

This performance testing suite is designed for the NutriStats application. Contact for licensing information.

## 📞 Contact

For performance testing questions, optimization recommendations, or technical support, please reach out through GitHub issues or professional channels.

---

**Ensuring Peak Performance for Athletic Nutrition** 🏆