/**
 * Centralized exports for all test utilities
 */

const ApiHelpers = require('./api-helpers');
const { 
  NutritionAssertions,
  createNutritionAssertions,
  assertElementCount,
  assertElementHasClass,
  assertElementDoesNotHaveClass,
  assertMultipleElementsVisible,
  assertMultipleElementsHidden,
  assertPagePerformance
} = require('./assertions');

const {
  generateRandomString,
  generateRandomNumber,
  generateRandomEmail,
  generateRandomPhone,
  generateRandomDate,
  generateTestUser,
  generateTestFood,
  generateTestMeal,
  generateTestWeightEntry,
  generateTestNutritionGoals,
  generateTestDataArray,
  generateRelatedTestData,
  generateEdgeCaseData,
  generateScenarioData
} = require('./data-generators');

const {
  wait,
  retryWithBackoff,
  generateTestId,
  formatDateForApi,
  getDateRange,
  parseNutritionFromText,
  calculateNutritionTotals,
  isValidEmail,
  validatePasswordStrength,
  cleanupTestFiles,
  saveTestData,
  loadTestData,
  takeContextualScreenshot,
  getBrowserInfo,
  monitorNetworkRequests,
  waitForNetworkIdle,
  simulateNetworkConditions,
  captureConsoleLogs,
  mockApiResponses
} = require('./test-helpers');

const {
  DebugHelpers,
  createDebugHelpers,
  enableDebugMode,
  disableDebugMode,
  isDebugMode
} = require('./debug-helpers');

module.exports = {
  // API Helpers
  ApiHelpers,
  
  // Assertions
  NutritionAssertions,
  createNutritionAssertions,
  assertElementCount,
  assertElementHasClass,
  assertElementDoesNotHaveClass,
  assertMultipleElementsVisible,
  assertMultipleElementsHidden,
  assertPagePerformance,
  
  // Data Generators
  generateRandomString,
  generateRandomNumber,
  generateRandomEmail,
  generateRandomPhone,
  generateRandomDate,
  generateTestUser,
  generateTestFood,
  generateTestMeal,
  generateTestWeightEntry,
  generateTestNutritionGoals,
  generateTestDataArray,
  generateRelatedTestData,
  generateEdgeCaseData,
  generateScenarioData,
  
  // Test Helpers
  wait,
  retryWithBackoff,
  generateTestId,
  formatDateForApi,
  getDateRange,
  parseNutritionFromText,
  calculateNutritionTotals,
  isValidEmail,
  validatePasswordStrength,
  cleanupTestFiles,
  saveTestData,
  loadTestData,
  takeContextualScreenshot,
  getBrowserInfo,
  monitorNetworkRequests,
  waitForNetworkIdle,
  simulateNetworkConditions,
  captureConsoleLogs,
  mockApiResponses,
  
  // Debug Helpers
  DebugHelpers,
  createDebugHelpers,
  enableDebugMode,
  disableDebugMode,
  isDebugMode
};