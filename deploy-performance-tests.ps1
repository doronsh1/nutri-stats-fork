#!/usr/bin/env pwsh

Write-Host "Deploying performance-tests folder to nutri-stats-performance-k6 repository..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "performance-tests")) {
    Write-Host "Error: performance-tests folder not found. Make sure you're in the project root." -ForegroundColor Red
    Read-Host "Press Enter to continue..."
    exit 1
}

# Check if git is available
try {
    git --version | Out-Null
} catch {
    Write-Host "Error: Git is not installed or not in PATH." -ForegroundColor Red
    Read-Host "Press Enter to continue..."
    exit 1
}

# Check if performance-tests folder has been committed
Write-Host "Checking if performance-tests folder is committed..." -ForegroundColor Yellow
$performanceTestsStatus = git status --porcelain performance-tests/
if ($performanceTestsStatus) {
    Write-Host "Performance-tests folder has uncommitted changes. Committing them first..." -ForegroundColor Yellow
    git add performance-tests/
    git commit -m "Add performance tests for K6 deployment"
    Write-Host "Changes committed successfully." -ForegroundColor Green
}

# Check if there are any commits with performance-tests
$hasPerformanceCommits = git log --oneline --follow -- performance-tests/ 2>$null
if (-not $hasPerformanceCommits) {
    Write-Host "No commits found for performance-tests folder. Creating initial commit..." -ForegroundColor Yellow
    git add performance-tests/
    git commit -m "Initial commit: Add K6 performance tests"
    Write-Host "Initial commit created successfully." -ForegroundColor Green
}

# Add the remote repository if it doesn't exist
try {
    git remote get-url performance-repo 2>$null | Out-Null
    Write-Host "Remote repository already exists, updating URL..." -ForegroundColor Yellow
    git remote set-url performance-repo https://github.com/TomerTTB/nutri-stats-performance-k6.git
} catch {
    Write-Host "Adding remote repository..." -ForegroundColor Yellow
    git remote add performance-repo https://github.com/TomerTTB/nutri-stats-performance-k6.git
}

# Push the performance-tests subtree to the remote repository
Write-Host "Pushing performance-tests folder to remote repository..." -ForegroundColor Yellow

try {
    # Split the subtree and get the commit hash
    Write-Host "Splitting performance-tests subtree..." -ForegroundColor Yellow
    $commitHash = git subtree split --prefix=performance-tests HEAD
    if ($commitHash) {
        Write-Host "Pushing to remote repository..." -ForegroundColor Yellow
        git push performance-repo "${commitHash}:main" --force
        Write-Host "Successfully deployed performance-tests folder to nutri-stats-performance-k6 repository!" -ForegroundColor Green
    } else {
        throw "Failed to split subtree"
    }
} catch {
    Write-Host "Error: Failed to push performance-tests folder." -ForegroundColor Red
    Write-Host "This might be because:" -ForegroundColor Yellow
    Write-Host "1. The remote repository doesn't exist or you don't have access" -ForegroundColor Yellow
    Write-Host "2. You need to authenticate with GitHub" -ForegroundColor Yellow
    Write-Host "3. Network connectivity issues" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Try running these commands manually:" -ForegroundColor Cyan
    Write-Host "git add performance-tests/" -ForegroundColor Gray
    Write-Host "git commit -m 'Add performance tests'" -ForegroundColor Gray
    Write-Host "git subtree push --prefix=performance-tests performance-repo main" -ForegroundColor Gray
    Read-Host "Press Enter to continue..."
    exit 1
}

Write-Host ""
Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "Repository URL: https://github.com/TomerTTB/nutri-stats-performance-k6" -ForegroundColor Cyan
Write-Host ""

Read-Host "Press Enter to continue..."