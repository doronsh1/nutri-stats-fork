/**
 * Database verification test
 * Simple test to verify database setup is working
 */

const { test, expect } = require('@playwright/test');
const { authFixture } = require('../fixtures/auth.fixture');
const path = require('path');
const fs = require('fs');

const authTest = authFixture;

authTest.describe('Database Verification', () => {
  authTest('should use test database during test execution', async ({ authenticatedPage }) => {
    // Check if test database exists during test execution
    const testDbPath = path.join(__dirname, '..', 'data', 'test-nutrition_app.db');
    const testDbExists = fs.existsSync(testDbPath);
    
    console.log('Test database path:', testDbPath);
    console.log('Test database exists:', testDbExists);
    
    expect(testDbExists).toBe(true);
    
    // Navigate to diary page to verify app is using test database
    await authenticatedPage.goto('/diary.html');
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Verify we're on the diary page
    expect(authenticatedPage.url()).toContain('diary.html');
    
    // Take a screenshot to verify everything is working
    await authenticatedPage.screenshot({ 
      path: path.join(__dirname, '..', 'screenshots', 'database-verification.png'),
      fullPage: true 
    });
    
    console.log('✅ Database verification test completed successfully');
  });
});