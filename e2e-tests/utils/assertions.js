/**
 * Custom assertion helpers for application-specific validations
 */

const { expect } = require('@playwright/test');

/**
 * Custom assertions for nutrition tracking application
 */
class NutritionAssertions {
  constructor(page) {
    this.page = page;
  }

  /**
   * Assert nutrition values are within expected range
   * @param {Object} actual - Actual nutrition values
   * @param {Object} expected - Expected nutrition values
   * @param {number} tolerance - Tolerance percentage (default 5%)
   */
  async assertNutritionValues(actual, expected, tolerance = 5) {
    const nutrients = ['calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium'];
    
    for (const nutrient of nutrients) {
      if (expected[nutrient] !== undefined) {
        const actualValue = actual[nutrient] || 0;
        const expectedValue = expected[nutrient];
        const toleranceValue = expectedValue * (tolerance / 100);
        const minValue = expectedValue - toleranceValue;
        const maxValue = expectedValue + toleranceValue;
        
        expect(actualValue).toBeGreaterThanOrEqual(minValue);
        expect(actualValue).toBeLessThanOrEqual(maxValue);
      }
    }
  }

  /**
   * Assert meal totals are calculated correctly
   * @param {string} mealSelector - Meal section selector
   * @param {Object} expectedTotals - Expected nutrition totals
   */
  async assertMealTotals(mealSelector, expectedTotals) {
    const caloriesText = await this.page.textContent(`${mealSelector} .meal-calories`);
    const proteinText = await this.page.textContent(`${mealSelector} .meal-protein`);
    const carbsText = await this.page.textContent(`${mealSelector} .meal-carbs`);
    const fatText = await this.page.textContent(`${mealSelector} .meal-fat`);
    
    const actualTotals = {
      calories: parseFloat(caloriesText.replace(/[^\d.]/g, '')),
      protein: parseFloat(proteinText.replace(/[^\d.]/g, '')),
      carbs: parseFloat(carbsText.replace(/[^\d.]/g, '')),
      fat: parseFloat(fatText.replace(/[^\d.]/g, ''))
    };
    
    await this.assertNutritionValues(actualTotals, expectedTotals);
  }

  /**
   * Assert daily nutrition totals
   * @param {Object} expectedTotals - Expected daily totals
   */
  async assertDailyTotals(expectedTotals) {
    const dailyTotalsSelector = '[data-testid="daily-totals"]';
    await this.page.waitForSelector(dailyTotalsSelector);
    
    const caloriesText = await this.page.textContent(`${dailyTotalsSelector} .total-calories`);
    const proteinText = await this.page.textContent(`${dailyTotalsSelector} .total-protein`);
    const carbsText = await this.page.textContent(`${dailyTotalsSelector} .total-carbs`);
    const fatText = await this.page.textContent(`${dailyTotalsSelector} .total-fat`);
    
    const actualTotals = {
      calories: parseFloat(caloriesText.replace(/[^\d.]/g, '')),
      protein: parseFloat(proteinText.replace(/[^\d.]/g, '')),
      carbs: parseFloat(carbsText.replace(/[^\d.]/g, '')),
      fat: parseFloat(fatText.replace(/[^\d.]/g, ''))
    };
    
    await this.assertNutritionValues(actualTotals, expectedTotals);
  }

  /**
   * Assert nutrition goals progress
   * @param {Object} expectedProgress - Expected progress percentages
   */
  async assertNutritionGoalsProgress(expectedProgress) {
    const goalsSelector = '[data-testid="nutrition-goals"]';
    await this.page.waitForSelector(goalsSelector);
    
    for (const [nutrient, expectedPercent] of Object.entries(expectedProgress)) {
      const progressBar = `${goalsSelector} .${nutrient}-progress`;
      const progressText = await this.page.textContent(`${progressBar} .progress-text`);
      const actualPercent = parseFloat(progressText.replace('%', ''));
      
      expect(actualPercent).toBeCloseTo(expectedPercent, 1);
    }
  }

  /**
   * Assert food search results
   * @param {Array} expectedFoods - Expected food items
   */
  async assertFoodSearchResults(expectedFoods) {
    const resultsSelector = '[data-testid="food-search-results"]';
    await this.page.waitForSelector(resultsSelector);
    
    const resultItems = await this.page.locator(`${resultsSelector} .food-item`).count();
    expect(resultItems).toBe(expectedFoods.length);
    
    for (let i = 0; i < expectedFoods.length; i++) {
      const foodItem = `${resultsSelector} .food-item:nth-child(${i + 1})`;
      const foodName = await this.page.textContent(`${foodItem} .food-name`);
      const foodCalories = await this.page.textContent(`${foodItem} .food-calories`);
      
      expect(foodName).toContain(expectedFoods[i].name);
      expect(foodCalories).toContain(expectedFoods[i].calories.toString());
    }
  }

  /**
   * Assert weight trend direction
   * @param {string} expectedTrend - Expected trend ('up', 'down', 'stable')
   */
  async assertWeightTrend(expectedTrend) {
    const trendSelector = '[data-testid="weight-trend"]';
    await this.page.waitForSelector(trendSelector);
    
    const trendElement = this.page.locator(trendSelector);
    
    switch (expectedTrend) {
      case 'up':
        await expect(trendElement).toHaveClass(/trend-up/);
        break;
      case 'down':
        await expect(trendElement).toHaveClass(/trend-down/);
        break;
      case 'stable':
        await expect(trendElement).toHaveClass(/trend-stable/);
        break;
      default:
        throw new Error(`Unknown trend: ${expectedTrend}`);
    }
  }

  /**
   * Assert chart data points
   * @param {string} chartSelector - Chart container selector
   * @param {Array} expectedDataPoints - Expected data points
   */
  async assertChartData(chartSelector, expectedDataPoints) {
    await this.page.waitForSelector(chartSelector);
    
    // Wait for chart to render
    await this.page.waitForTimeout(1000);
    
    const dataPoints = await this.page.evaluate((selector) => {
      const chart = document.querySelector(selector);
      const canvas = chart.querySelector('canvas');
      
      if (!canvas) return null;
      
      // This would need to be adapted based on the actual chart library used
      // For now, we'll check if the chart container has the expected number of data attributes
      return chart.dataset.pointCount || chart.querySelectorAll('.data-point').length;
    }, chartSelector);
    
    if (dataPoints !== null) {
      expect(parseInt(dataPoints)).toBe(expectedDataPoints.length);
    }
  }

  /**
   * Assert form validation errors
   * @param {Object} expectedErrors - Expected validation errors by field
   */
  async assertFormValidationErrors(expectedErrors) {
    for (const [fieldName, expectedError] of Object.entries(expectedErrors)) {
      const errorSelector = `[data-testid="${fieldName}-error"]`;
      await this.page.waitForSelector(errorSelector);
      
      const errorText = await this.page.textContent(errorSelector);
      expect(errorText).toContain(expectedError);
    }
  }

  /**
   * Assert toast notification
   * @param {string} expectedMessage - Expected notification message
   * @param {string} type - Notification type ('success', 'error', 'warning', 'info')
   */
  async assertToastNotification(expectedMessage, type = 'success') {
    const toastSelector = `[data-testid="toast-${type}"]`;
    await this.page.waitForSelector(toastSelector, { timeout: 5000 });
    
    const toastText = await this.page.textContent(toastSelector);
    expect(toastText).toContain(expectedMessage);
  }

  /**
   * Assert loading state
   * @param {string} containerSelector - Container selector
   * @param {boolean} shouldBeLoading - Whether loading state should be present
   */
  async assertLoadingState(containerSelector, shouldBeLoading = true) {
    const loadingSelector = `${containerSelector} [data-testid="loading"]`;
    
    if (shouldBeLoading) {
      await this.page.waitForSelector(loadingSelector);
      await expect(this.page.locator(loadingSelector)).toBeVisible();
    } else {
      await this.page.waitForSelector(loadingSelector, { state: 'hidden', timeout: 10000 });
      await expect(this.page.locator(loadingSelector)).toBeHidden();
    }
  }

  /**
   * Assert pagination
   * @param {number} currentPage - Current page number
   * @param {number} totalPages - Total number of pages
   */
  async assertPagination(currentPage, totalPages) {
    const paginationSelector = '[data-testid="pagination"]';
    await this.page.waitForSelector(paginationSelector);
    
    const currentPageElement = `${paginationSelector} .current-page`;
    const totalPagesElement = `${paginationSelector} .total-pages`;
    
    const currentPageText = await this.page.textContent(currentPageElement);
    const totalPagesText = await this.page.textContent(totalPagesElement);
    
    expect(parseInt(currentPageText)).toBe(currentPage);
    expect(parseInt(totalPagesText)).toBe(totalPages);
  }

  /**
   * Assert table data
   * @param {string} tableSelector - Table selector
   * @param {Array} expectedData - Expected table data
   */
  async assertTableData(tableSelector, expectedData) {
    await this.page.waitForSelector(tableSelector);
    
    const rows = await this.page.locator(`${tableSelector} tbody tr`).count();
    expect(rows).toBe(expectedData.length);
    
    for (let i = 0; i < expectedData.length; i++) {
      const rowSelector = `${tableSelector} tbody tr:nth-child(${i + 1})`;
      const expectedRow = expectedData[i];
      
      for (const [columnIndex, expectedValue] of Object.entries(expectedRow)) {
        const cellSelector = `${rowSelector} td:nth-child(${parseInt(columnIndex) + 1})`;
        const cellText = await this.page.textContent(cellSelector);
        expect(cellText.trim()).toBe(expectedValue.toString());
      }
    }
  }

  /**
   * Assert URL contains expected parameters
   * @param {Object} expectedParams - Expected URL parameters
   */
  async assertUrlParameters(expectedParams) {
    const currentUrl = new URL(this.page.url());
    
    for (const [param, expectedValue] of Object.entries(expectedParams)) {
      const actualValue = currentUrl.searchParams.get(param);
      expect(actualValue).toBe(expectedValue);
    }
  }

  /**
   * Assert local storage contains expected data
   * @param {Object} expectedData - Expected localStorage data
   */
  async assertLocalStorage(expectedData) {
    const actualData = await this.page.evaluate(() => {
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        data[key] = localStorage.getItem(key);
      }
      return data;
    });
    
    for (const [key, expectedValue] of Object.entries(expectedData)) {
      expect(actualData[key]).toBe(expectedValue);
    }
  }

  /**
   * Assert session storage contains expected data
   * @param {Object} expectedData - Expected sessionStorage data
   */
  async assertSessionStorage(expectedData) {
    const actualData = await this.page.evaluate(() => {
      const data = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        data[key] = sessionStorage.getItem(key);
      }
      return data;
    });
    
    for (const [key, expectedValue] of Object.entries(expectedData)) {
      expect(actualData[key]).toBe(expectedValue);
    }
  }
}

/**
 * Create nutrition assertions instance
 * @param {Page} page - Playwright page object
 */
function createNutritionAssertions(page) {
  return new NutritionAssertions(page);
}

/**
 * Assert element count matches expected value
 * @param {Page} page - Playwright page object
 * @param {string} selector - Element selector
 * @param {number} expectedCount - Expected count
 */
async function assertElementCount(page, selector, expectedCount) {
  const actualCount = await page.locator(selector).count();
  expect(actualCount).toBe(expectedCount);
}

/**
 * Assert element has expected CSS class
 * @param {Page} page - Playwright page object
 * @param {string} selector - Element selector
 * @param {string} expectedClass - Expected CSS class
 */
async function assertElementHasClass(page, selector, expectedClass) {
  const element = page.locator(selector);
  await expect(element).toHaveClass(new RegExp(expectedClass));
}

/**
 * Assert element does not have CSS class
 * @param {Page} page - Playwright page object
 * @param {string} selector - Element selector
 * @param {string} className - CSS class that should not be present
 */
async function assertElementDoesNotHaveClass(page, selector, className) {
  const element = page.locator(selector);
  const classes = await element.getAttribute('class') || '';
  expect(classes).not.toContain(className);
}

/**
 * Assert multiple elements are visible
 * @param {Page} page - Playwright page object
 * @param {Array} selectors - Array of element selectors
 */
async function assertMultipleElementsVisible(page, selectors) {
  for (const selector of selectors) {
    await expect(page.locator(selector)).toBeVisible();
  }
}

/**
 * Assert multiple elements are hidden
 * @param {Page} page - Playwright page object
 * @param {Array} selectors - Array of element selectors
 */
async function assertMultipleElementsHidden(page, selectors) {
  for (const selector of selectors) {
    await expect(page.locator(selector)).toBeHidden();
  }
}

/**
 * Assert page performance metrics
 * @param {Page} page - Playwright page object
 * @param {Object} thresholds - Performance thresholds
 */
async function assertPagePerformance(page, thresholds = {}) {
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    return {
      loadTime: navigation.loadEventEnd - navigation.loadEventStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
      firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
    };
  });
  
  if (thresholds.loadTime) {
    expect(metrics.loadTime).toBeLessThan(thresholds.loadTime);
  }
  
  if (thresholds.domContentLoaded) {
    expect(metrics.domContentLoaded).toBeLessThan(thresholds.domContentLoaded);
  }
  
  if (thresholds.firstPaint) {
    expect(metrics.firstPaint).toBeLessThan(thresholds.firstPaint);
  }
  
  if (thresholds.firstContentfulPaint) {
    expect(metrics.firstContentfulPaint).toBeLessThan(thresholds.firstContentfulPaint);
  }
}

module.exports = {
  NutritionAssertions,
  createNutritionAssertions,
  assertElementCount,
  assertElementHasClass,
  assertElementDoesNotHaveClass,
  assertMultipleElementsVisible,
  assertMultipleElementsHidden,
  assertPagePerformance
};