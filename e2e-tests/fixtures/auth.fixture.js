/**
 * Authentication fixtures for login/logout states and user management
 * Provides user authentication fixtures, test user creation/cleanup utilities,
 * and browser context/storage management fixtures
 */

const { test: base, expect } = require('@playwright/test');
const ApiHelpers = require('../utils/api-helpers');
const { generateTestUser } = require('../utils/data-generators');
const DatabaseManager = require('../utils/database-manager');

/**
 * Authentication fixture that provides authenticated user context
 */
const authFixture = base.extend({
  /**
   * API helpers instance for authentication operations
   */
  apiHelpers: async ({ }, use) => {
    const apiHelpers = new ApiHelpers();
    await apiHelpers.init();
    await use(apiHelpers);
    await apiHelpers.cleanup();
  },

  /**
   * Test user fixture - creates and manages test user lifecycle
   */
  testUser: async ({ apiHelpers }, use) => {
    const userData = generateTestUser();
    let createdUser = null;
    let authToken = null;

    try {
      // Register the test user
      const registerResponse = await apiHelpers.registerUser(userData);

      if (!registerResponse.ok) {
        throw new Error(`Failed to register test user: ${JSON.stringify(registerResponse.data)}`);
      }

      createdUser = {
        ...userData,
        id: registerResponse.data.id || registerResponse.data.user?.id,
        ...registerResponse.data
      };

      // Login to get auth token
      const loginResponse = await apiHelpers.loginUser({
        email: userData.email,
        password: userData.password
      });

      if (!loginResponse.ok) {
        throw new Error(`Failed to login test user: ${JSON.stringify(loginResponse.data)}`);
      }

      authToken = loginResponse.data.token;
      createdUser.token = authToken;

      await use(createdUser);

    } finally {
      // Cleanup: delete the test user if it was created
      // Set CLEANUP_ENABLED=false to disable cleanup entirely
      if (createdUser && process.env.CLEANUP_ENABLED !== 'false') {
        try {
          if (authToken) {
            apiHelpers.setAuthToken(authToken);
          }
          // Add timeout to prevent hanging cleanup
          const cleanupPromise = apiHelpers.cleanupUserData();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Cleanup timeout')), 5000)
          );
          
          await Promise.race([cleanupPromise, timeoutPromise]);
        } catch (error) {
          // Silently ignore cleanup errors - they don't affect test results
          if (process.env.DEBUG_CLEANUP === 'true') {
            console.warn('Failed to cleanup test user:', error.message);
          }
        }
      }
    }
  },

  /**
   * Authenticated page fixture - provides page with logged-in user context
   */
  authenticatedPage: async ({ page, testUser }, use) => {
    // Set authentication token in localStorage
    await page.goto('/');

    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-id',
        username: 'testuser',
        email: 'test@example.com'
      }));
    }, testUser.token);

    // Navigate to a protected page to verify authentication
    await page.goto('/diary.html');

    // Wait for page to load and verify authentication
    await page.waitForLoadState('networkidle');

    // Verify we're not redirected to login
    expect(page.url()).not.toContain('login.html');

    await use(page);
  },

  /**
   * Clean browser context fixture - provides isolated browser context
   */
  cleanContext: async ({ browser }, use) => {
    const context = await browser.newContext({
      // Clear all storage
      storageState: undefined,
      // Disable cache
      ignoreHTTPSErrors: true,
      // Set viewport
      viewport: { width: 1280, height: 720 }
    });

    await use(context);
    await context.close();
  },

  /**
   * Authenticated context fixture - provides browser context with auth state
   */
  authenticatedContext: async ({ browser, testUser }, use) => {
    const context = await browser.newContext({
      storageState: undefined,
      ignoreHTTPSErrors: true,
      viewport: { width: 1280, height: 720 }
    });

    // Create a page to set up authentication state
    const setupPage = await context.newPage();
    await setupPage.goto('/');

    // Set authentication data in storage
    await setupPage.evaluate((userData) => {
      localStorage.setItem('authToken', userData.token);
      localStorage.setItem('user', JSON.stringify({
        id: userData.id,
        username: userData.username,
        email: userData.email
      }));
    }, testUser);

    await setupPage.close();
    await use(context);
    await context.close();
  }
});

/**
 * User management utilities for test setup and cleanup
 */
class UserManager {
  constructor(apiHelpers) {
    this.apiHelpers = apiHelpers;
    this.createdUsers = [];
  }

  /**
   * Create a test user with optional custom data
   * @param {Object} userData - Custom user data (optional)
   * @returns {Object} Created user data with auth token
   */
  async createTestUser(userData = {}) {
    const testUserData = generateTestUser(userData);

    try {
      // Register user
      const registerResponse = await this.apiHelpers.registerUser(testUserData);

      if (!registerResponse.ok) {
        throw new Error(`Failed to register user: ${JSON.stringify(registerResponse.data)}`);
      }

      // Login to get token
      const loginResponse = await this.apiHelpers.loginUser({
        email: testUserData.email,
        password: testUserData.password
      });

      if (!loginResponse.ok) {
        throw new Error(`Failed to login user: ${JSON.stringify(loginResponse.data)}`);
      }

      const createdUser = {
        ...testUserData,
        id: registerResponse.data.id || registerResponse.data.user?.id,
        token: loginResponse.data.token,
        ...registerResponse.data
      };

      this.createdUsers.push(createdUser);
      return createdUser;

    } catch (error) {
      console.error('Error creating test user:', error);
      throw error;
    }
  }

  /**
   * Create multiple test users
   * @param {number} count - Number of users to create
   * @param {Object} baseUserData - Base user data for all users
   * @returns {Array} Array of created user data
   */
  async createMultipleTestUsers(count = 3, baseUserData = {}) {
    const users = [];

    for (let i = 0; i < count; i++) {
      const userData = {
        ...baseUserData,
        username: `${baseUserData.username || 'testuser'}_${i}_${Date.now()}`,
        email: `test${i}_${Date.now()}@example.com`
      };

      const user = await this.createTestUser(userData);
      users.push(user);
    }

    return users;
  }

  /**
   * Login user and return authentication state
   * @param {Object} credentials - Login credentials
   * @returns {Object} Authentication state
   */
  async loginUser(credentials) {
    const loginResponse = await this.apiHelpers.loginUser(credentials);

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${JSON.stringify(loginResponse.data)}`);
    }

    return {
      token: loginResponse.data.token,
      user: loginResponse.data.user,
      isAuthenticated: true
    };
  }

  /**
   * Logout user
   * @returns {Object} Logout response
   */
  async logoutUser() {
    const logoutResponse = await this.apiHelpers.logoutUser();
    return logoutResponse;
  }

  /**
   * Delete a specific user
   * @param {string} userId - User ID to delete
   * @returns {Object} Delete response
   */
  async deleteUser(userId) {
    return await this.apiHelpers.deleteUser(userId);
  }

  /**
   * Cleanup all created test users
   */
  async cleanupAllUsers() {
    const cleanupResults = [];

    for (const user of this.createdUsers) {
      try {
        // Set auth token for the user
        this.apiHelpers.setAuthToken(user.token);

        // Cleanup user data
        const cleanupResult = await this.apiHelpers.cleanupUserData();
        cleanupResults.push({
          userId: user.id,
          username: user.username,
          success: true,
          result: cleanupResult
        });

      } catch (error) {
        console.warn(`Failed to cleanup user ${user.username}:`, error.message);
        cleanupResults.push({
          userId: user.id,
          username: user.username,
          success: false,
          error: error.message
        });
      }
    }

    this.createdUsers = [];
    return cleanupResults;
  }

  /**
   * Get current user profile
   * @returns {Object} User profile data
   */
  async getCurrentUserProfile() {
    const profileResponse = await this.apiHelpers.getCurrentUser();

    if (!profileResponse.ok) {
      throw new Error(`Failed to get user profile: ${JSON.stringify(profileResponse.data)}`);
    }

    return profileResponse.data;
  }

  /**
   * Verify user authentication status
   * @param {string} token - Auth token to verify
   * @returns {boolean} Authentication status
   */
  async verifyAuthentication(token) {
    try {
      if (!token) {
        return false;
      }
      
      this.apiHelpers.setAuthToken(token);
      const profileResponse = await this.apiHelpers.getCurrentUser();
      
      // Check if response is ok and has user data
      if (profileResponse.ok && profileResponse.data) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.warn('Authentication verification failed:', error.message);
      return false;
    }
  }
}

/**
 * Browser storage management utilities
 */
class StorageManager {
  constructor(page) {
    this.page = page;
  }

  /**
   * Set authentication state in browser storage
   * @param {Object} authState - Authentication state data
   */
  async setAuthState(authState) {
    await this.page.evaluate((state) => {
      if (state.token) {
        localStorage.setItem('authToken', state.token);
      }

      if (state.user) {
        localStorage.setItem('user', JSON.stringify(state.user));
      }

      if (state.sessionData) {
        for (const [key, value] of Object.entries(state.sessionData)) {
          sessionStorage.setItem(key, JSON.stringify(value));
        }
      }
    }, authState);
  }

  /**
   * Get authentication state from browser storage
   * @returns {Object} Current authentication state
   */
  async getAuthState() {
    return await this.page.evaluate(() => {
      const token = localStorage.getItem('authToken');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      return {
        token,
        user,
        isAuthenticated: !!(token && user)
      };
    });
  }

  /**
   * Clear all authentication data from storage
   */
  async clearAuthState() {
    await this.page.evaluate(() => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      sessionStorage.clear();
    });
  }

  /**
   * Clear all browser storage
   */
  async clearAllStorage() {
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  /**
   * Save current storage state
   * @returns {Object} Current storage state
   */
  async saveStorageState() {
    return await this.page.evaluate(() => {
      const localStorage_data = {};
      const sessionStorage_data = {};

      // Save localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        localStorage_data[key] = localStorage.getItem(key);
      }

      // Save sessionStorage
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        sessionStorage_data[key] = sessionStorage.getItem(key);
      }

      return {
        localStorage: localStorage_data,
        sessionStorage: sessionStorage_data
      };
    });
  }

  /**
   * Restore storage state
   * @param {Object} storageState - Previously saved storage state
   */
  async restoreStorageState(storageState) {
    await this.page.evaluate((state) => {
      // Clear existing storage
      localStorage.clear();
      sessionStorage.clear();

      // Restore localStorage
      if (state.localStorage) {
        for (const [key, value] of Object.entries(state.localStorage)) {
          localStorage.setItem(key, value);
        }
      }

      // Restore sessionStorage
      if (state.sessionStorage) {
        for (const [key, value] of Object.entries(state.sessionStorage)) {
          sessionStorage.setItem(key, value);
        }
      }
    }, storageState);
  }

  /**
   * Verify authentication state in storage
   * @returns {boolean} Whether user appears to be authenticated
   */
  async verifyAuthStateInStorage() {
    const authState = await this.getAuthState();
    return authState.isAuthenticated;
  }
}

module.exports = {
  authFixture,
  UserManager,
  StorageManager
};