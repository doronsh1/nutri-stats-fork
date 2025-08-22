param(
    [Parameter(Position=0)]
    [ValidateSet("smoke", "login", "user-journey", "food-database", "meal-planning-spike", "analytics-reporting", "concurrent-data-entry")]
    [string]$TestType = "smoke",
    
    [string]$BaseUrl = "http://localhost:8080",
    [string]$TestEmail = "performance@nutristats.com", 
    [string]$TestPassword = "NutriStats1",
    [string]$Stages = "",
    [string]$OutputFormat = "",
    [string]$OutputFile = "",
    [switch]$Cloud,
    [switch]$Help
)

# Show help if requested
if ($Help) {
    Write-Host "K6 Performance Test Runner for NutriStats"
    Write-Host ""
    Write-Host "Usage: .\run-k6.ps1 [TestType] [Options]"
    Write-Host ""
    Write-Host "Test Types:"
    Write-Host "  smoke                 - Happy path validation for all API endpoints"
    Write-Host "  login                 - Realistic user login flow simulation"
    Write-Host "  user-journey          - Complete athlete daily nutrition workflow"
    Write-Host "  food-database         - Heavy food search and CRUD operations"
    Write-Host "  meal-planning-spike   - Peak usage spikes during meal planning"
    Write-Host "  analytics-reporting   - Data-heavy analytics and reporting operations"
    Write-Host "  concurrent-data-entry - Multi-user concurrent data entry testing"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -BaseUrl        API base URL (default: http://localhost:8080)"
    Write-Host "  -TestEmail      Test user email (default: demo@nutristats.com)"
    Write-Host "  -TestPassword   Test user password (default: NutriStats1)"
    Write-Host "  -Stages         Custom stages for custom test (e.g., '10s:5,1m:10,10s:0')"
    Write-Host "  -OutputFormat   Output format (json, csv, etc.)"
    Write-Host "  -OutputFile     Output file path"
    Write-Host "  -Cloud          Run test in K6 Cloud"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\run-k6.ps1 basic"
    Write-Host "  .\run-k6.ps1 stress -OutputFormat json -OutputFile results.json"
    Write-Host "  .\run-k6.ps1 custom -Stages '10s:5,1m:10,10s:0'"
    return
}

# Map test types to files
$testFiles = @{
    "smoke" = "tests/smoke-test.js"
    "login" = "tests/login-test.js"
    "user-journey" = "tests/user-journey-test.js"
    "food-database" = "tests/food-database-load-test.js"
    "meal-planning-spike" = "tests/meal-planning-spike-test.js"
    "analytics-reporting" = "tests/analytics-reporting-stress-test.js"
    "concurrent-data-entry" = "tests/concurrent-data-entry-test.js"
}

$testFile = $testFiles[$TestType]
if (-not $testFile) {
    Write-Error "Invalid test type: $TestType"
    return
}

# Build K6 command
$k6Args = @("run")

# Add environment variables
$k6Args += "--env", "BASE_URL=$BaseUrl"
$k6Args += "--env", "TEST_EMAIL=$TestEmail"
$k6Args += "--env", "TEST_PASSWORD=$TestPassword"
$k6Args += "--env", "PROJECT_ID=$3729747"

# Add output options
if ($OutputFormat) {
    if ($OutputFile) {
        $k6Args += "-o", "$OutputFormat=$OutputFile"
    } else {
        $k6Args += "-o", $OutputFormat
    }
}

# Add cloud output if requested
if ($Cloud) {
    $k6Args += "-o", "cloud"
}

# Add stages for custom test
if ($TestType -eq "custom" -and $Stages) {
    $stageList = $Stages -split ","
    foreach ($stage in $stageList) {
        $k6Args += "--stage", $stage.Trim()
    }
}

# Add test file
$k6Args += $testFile

Write-Host "Running K6 test: $TestType"
Write-Host "Test file: $testFile"
Write-Host "Base URL: $BaseUrl"
Write-Host "Project ID: 3729747"

# Run K6
& k6 @k6Args