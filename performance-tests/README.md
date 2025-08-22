# NutriStats Performance Tests - K6 Testing Suite

[![K6](https://img.shields.io/badge/K6-Performance%20Testing-7D64FF?style=flat&logo=k6&logoColor=white)](https://k6.io/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Grafana](https://img.shields.io/badge/Grafana-Monitoring-F46800?style=flat&logo=grafana&logoColor=white)](https://grafana.com/)
[![PowerShell](https://img.shields.io/badge/PowerShell-Automation-5391FE?style=flat&logo=powershell&logoColor=white)](https://docs.microsoft.com/en-us/powershell/)

Professional performance testing suite for the NutriStats API using K6, designed for load testing, stress testing, and performance validation.

## Table of Contents

- [Overview](#-overview)
- [Installation](#installation)
- [Test Types](#-test-types)
- [Running Tests](#-running-tests)
- [Grafana Integration](#-grafana-integration)
- [Configuration](#️-configuration)
- [Key Metrics](#-key-metrics)
- [Load Patterns](#-load-patterns)
- [Troubleshooting](#-troubleshooting)
- [Related Projects](#-related-projects)

## 🔗 Related Projects

- **[NutriStats Main Application](https://github.com/TomerTTB/Stats)** - The main NutriStats nutrition tracking platform

## 🎯 Overview

K6 performance testing suite for the NutriStats API focusing on response times, throughput, error rates, and system behavior under load. Features automatic JWT authentication, Grafana integration, and flexible load patterns.

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
   - Download and install Grafana from [grafana.com](https://grafana.com/grafana/download)
   - Start Grafana service (default: http://localhost:3000)

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

| Test | Purpose | Load | Thresholds |
|------|---------|------|------------|
| **smoke** | API validation | 10 users, 40s | 95% < 2s, <5% failures |
| **login** | User login flow | 10-20 users, 3m | 95% < 1s, <2% failures |
| **user-journey** | Complete athlete workflow | 20 users, 5.5m | 95% < 1.5s, <3% failures |
| **food-database** | Heavy food operations | 30-100 users, 4m | 95% < 600ms, <2% failures |
| **meal-planning-spike** | Peak usage spikes | Spikes to 200 users | 95% < 2s, <10% failures |
| **analytics-reporting** | Data-heavy operations | 25-75 users, 4.75m | 95% < 2s, <5% failures |
| **concurrent-data-entry** | Multi-user data entry | 40-80 users, 4m | 95% < 1s, <3% failures |

## 🚀 Running Tests

### PowerShell Script (Recommended)

```powershell
# Basic test execution
.\run-k6.ps1 smoke
.\run-k6.ps1 login
.\run-k6.ps1 user-journey
.\run-k6.ps1 food-database
.\run-k6.ps1 meal-planning-spike
.\run-k6.ps1 analytics-reporting
.\run-k6.ps1 concurrent-data-entry

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

### Quick Commands

```bash
# NPM scripts
npm run test:smoke                 # Smoke test
npm run test:login                 # Login flow test
npm run test:user-journey          # Complete user journey test
npm run test:food-database         # Food database load test
npm run test:meal-planning-spike   # Meal planning spike test
npm run test:analytics-reporting   # Analytics reporting stress test
npm run test:concurrent-data-entry # Concurrent data entry test

# Direct K6
k6 run tests/smoke-test.js
k6 run --out json=results.json tests/stress-test.js
k6 cloud tests/smoke-test.js
```

## 📊 Grafana Integration

### Setup
1. **Install**: Download InfluxDB and Grafana from official sites
2. **Configure**: Add InfluxDB data source in Grafana (`http://localhost:8086`, database: `k6`)
3. **Run with output**: `.\run-k6.ps1 load -OutputFormat "influxdb=http://localhost:8086/k6"`

### K6 Cloud
```powershell
.\run-k6.ps1 smoke -Cloud  # Cloud execution with web dashboard
```

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

## 📈 Key Metrics

- **http_req_duration**: Response time (avg, p95)
- **http_req_failed**: Error rate
- **http_reqs**: Requests per second
- **checks**: Validation success rate

### Sample Output
```
✓ api responsive
✓ auth system responsive  

checks.........................: 96.8% ✓ 2420    ✗ 80
http_req_duration..............: avg=145ms p(95)=420ms
http_req_failed................: 1.8%  ✓ 45     ✗ 2455
http_reqs......................: 2500   41.7/s
```

## 🔄 Load Patterns

```bash
# Light load
"30s:10,2m:10,30s:0"

# Stress pattern  
"2m:20,3m:50,3m:80,2m:0"

# Spike pattern
"1m:10,30s:100,1m:10,30s:0"
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

---

**Ensuring Peak Performance for Athletic Nutrition** 🏆