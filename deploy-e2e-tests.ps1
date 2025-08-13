#!/usr/bin/env pwsh

Write-Host "Deploying e2e-tests folder to nutri-stats-e2e-playwright repository..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "e2e-tests")) {
    Write-Host "Error: e2e-tests folder not found. Make sure you're in the project root." -ForegroundColor Red
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

# Add the remote repository if it doesn't exist
try {
    git remote get-url e2e-repo 2>$null | Out-Null
    Write-Host "Remote repository already exists, updating URL..." -ForegroundColor Yellow
    git remote set-url e2e-repo https://github.com/TomerTTB/nutri-stats-e2e-playwright.git
} catch {
    Write-Host "Adding remote repository..." -ForegroundColor Yellow
    git remote add e2e-repo https://github.com/TomerTTB/nutri-stats-e2e-playwright.git
}

# Push the e2e-tests subtree to the remote repository
Write-Host "Pushing e2e-tests folder to remote repository..." -ForegroundColor Yellow

try {
    git subtree push --prefix=e2e-tests e2e-repo main
    Write-Host "Successfully deployed e2e-tests folder to nutri-stats-e2e-playwright repository!" -ForegroundColor Green
} catch {
    Write-Host "Standard subtree push failed, trying force push method..." -ForegroundColor Yellow
    try {
        # Split the subtree and get the commit hash
        $commitHash = git subtree split --prefix=e2e-tests HEAD
        if ($commitHash) {
            git push e2e-repo "${commitHash}:main" --force
            Write-Host "Successfully force-deployed e2e-tests folder to nutri-stats-e2e-playwright repository!" -ForegroundColor Green
        } else {
            throw "Failed to split subtree"
        }
    } catch {
        Write-Host "Error: Failed to push e2e-tests folder." -ForegroundColor Red
        Write-Host "This might be because:" -ForegroundColor Yellow
        Write-Host "1. The remote repository doesn't exist or you don't have access" -ForegroundColor Yellow
        Write-Host "2. You need to authenticate with GitHub" -ForegroundColor Yellow
        Read-Host "Press Enter to continue..."
        exit 1
    }
}

Read-Host "Press Enter to continue..."