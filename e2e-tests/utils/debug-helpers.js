/**
 * Additional debugging utilities for enhanced test debugging
 */

const path = require('path');
const fs = require('fs').promises;

/**
 * Enhanced debugging utilities for Playwright tests
 */
class DebugHelpers {
  constructor(page, testInfo = null) {
    this.page = page;
    this.testInfo = testInfo;
    this.debugMode = process.env.DEBUG_TESTS === 'true';
  }

  /**
   * Log debug information with context
   * @param {string} message - Debug message
   * @param {Object} context - Additional context data
   */
  log(message, context = {}) {
    if (this.debugMode) {
      const timestamp = new Date().toISOString();
      const testName = this.testInfo?.title || 'unknown';
      console.log(`[DEBUG ${timestamp}] [${testName}] ${message}`, context);
    }
  }

  /**
   * Take debug screenshot with enhanced naming
   * @param {string} step - Current test step
   * @param {Object} options - Screenshot options
   */
  async debugScreenshot(step, options = {}) {
    if (!this.debugMode) return null;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const testName = this.testInfo?.title?.replace(/[^a-zA-Z0-9]/g, '-') || 'unknown';
    const filename = `debug-${testName}-${step}-${timestamp}.png`;
    const screenshotPath = path.join('e2e-tests', 'screenshots', 'debug', filename);

    try {
      await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
      await this.page.screenshot({ 
        path: screenshotPath, 
        fullPage: true,
        ...options 
      });
      
      this.log(`Debug screenshot taken: ${filename}`);
      return filename;
    } catch (error) {
      this.log(`Failed to take debug screenshot: ${error.message}`);
      return null;
    }
  }

  /**
   * Capture page state for debugging
   */
  async capturePageState() {
    if (!this.debugMode) return null;

    try {
      const state = {
        url: this.page.url(),
        title: await this.page.title(),
        viewport: await this.page.viewportSize(),
        cookies: await this.page.context().cookies(),
        localStorage: await this.page.evaluate(() => {
          const storage = {};
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            storage[key] = localStorage.getItem(key);
          }
          return storage;
        }),
        sessionStorage: await this.page.evaluate(() => {
          const storage = {};
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            storage[key] = sessionStorage.getItem(key);
          }
          return storage;
        }),
        timestamp: new Date().toISOString()
      };

      this.log('Page state captured', state);
      return state;
    } catch (error) {
      this.log(`Failed to capture page state: ${error.message}`);
      return null;
    }
  }

  /**
   * Save debug data to file
   * @param {Object} data - Debug data to save
   * @param {string} filename - Filename for debug data
   */
  async saveDebugData(data, filename) {
    if (!this.debugMode) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const testName = this.testInfo?.title?.replace(/[^a-zA-Z0-9]/g, '-') || 'unknown';
    const debugFilename = `debug-${testName}-${filename}-${timestamp}.json`;
    const debugPath = path.join('e2e-tests', 'debug-data', debugFilename);

    try {
      await fs.mkdir(path.dirname(debugPath), { recursive: true });
      await fs.writeFile(debugPath, JSON.stringify(data, null, 2));
      this.log(`Debug data saved: ${debugFilename}`);
    } catch (error) {
      this.log(`Failed to save debug data: ${error.message}`);
    }
  }

  /**
   * Highlight element for debugging
   * @param {string} selector - Element selector
   * @param {Object} options - Highlight options
   */
  async highlightElement(selector, options = {}) {
    if (!this.debugMode) return;

    const {
      color = 'red',
      duration = 2000,
      border = '3px solid'
    } = options;

    try {
      await this.page.evaluate(({ selector, color, border }) => {
        const element = document.querySelector(selector);
        if (element) {
          const originalBorder = element.style.border;
          element.style.border = `${border} ${color}`;
          
          setTimeout(() => {
            element.style.border = originalBorder;
          }, 2000);
        }
      }, { selector, color, border });

      this.log(`Element highlighted: ${selector}`);
    } catch (error) {
      this.log(`Failed to highlight element ${selector}: ${error.message}`);
    }
  }

  /**
   * Wait with debug logging
   * @param {number} ms - Milliseconds to wait
   * @param {string} reason - Reason for waiting
   */
  async debugWait(ms, reason = 'Unknown') {
    if (this.debugMode) {
      this.log(`Waiting ${ms}ms - Reason: ${reason}`);
    }
    await this.page.waitForTimeout(ms);
  }

  /**
   * Enhanced element interaction with debugging
   * @param {string} selector - Element selector
   * @param {string} action - Action to perform
   * @param {Object} options - Action options
   */
  async debugInteraction(selector, action, options = {}) {
    if (this.debugMode) {
      this.log(`Performing ${action} on ${selector}`, options);
      await this.highlightElement(selector);
    }

    const element = this.page.locator(selector);
    
    try {
      switch (action) {
        case 'click':
          await element.click(options);
          break;
        case 'fill':
          await element.fill(options.value || '', options);
          break;
        case 'select':
          await element.selectOption(options.value || '', options);
          break;
        case 'hover':
          await element.hover(options);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }
      
      if (this.debugMode) {
        this.log(`Successfully performed ${action} on ${selector}`);
      }
    } catch (error) {
      if (this.debugMode) {
        this.log(`Failed to perform ${action} on ${selector}: ${error.message}`);
        await this.debugScreenshot(`failed-${action}-${selector.replace(/[^a-zA-Z0-9]/g, '-')}`);
      }
      throw error;
    }
  }

  /**
   * Debug network activity
   * @param {Function} operation - Operation to monitor
   * @param {Object} options - Monitoring options
   */
  async debugNetworkActivity(operation, options = {}) {
    if (!this.debugMode) {
      return await operation();
    }

    const { logRequests = true, logResponses = true } = options;
    const networkActivity = [];

    const requestHandler = (request) => {
      const requestData = {
        type: 'request',
        url: request.url(),
        method: request.method(),
        timestamp: Date.now()
      };
      networkActivity.push(requestData);
      
      if (logRequests) {
        this.log(`Network Request: ${request.method()} ${request.url()}`);
      }
    };

    const responseHandler = (response) => {
      const responseData = {
        type: 'response',
        url: response.url(),
        status: response.status(),
        timestamp: Date.now()
      };
      networkActivity.push(responseData);
      
      if (logResponses) {
        this.log(`Network Response: ${response.status()} ${response.url()}`);
      }
    };

    this.page.on('request', requestHandler);
    this.page.on('response', responseHandler);

    try {
      const result = await operation();
      
      if (networkActivity.length > 0) {
        await this.saveDebugData(networkActivity, 'network-activity');
      }
      
      return result;
    } finally {
      this.page.off('request', requestHandler);
      this.page.off('response', responseHandler);
    }
  }

  /**
   * Debug console messages
   * @param {Function} operation - Operation to monitor
   */
  async debugConsoleMessages(operation) {
    if (!this.debugMode) {
      return await operation();
    }

    const consoleMessages = [];

    const consoleHandler = (msg) => {
      const messageData = {
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
        timestamp: Date.now()
      };
      consoleMessages.push(messageData);
      this.log(`Console ${msg.type()}: ${msg.text()}`);
    };

    this.page.on('console', consoleHandler);

    try {
      const result = await operation();
      
      if (consoleMessages.length > 0) {
        await this.saveDebugData(consoleMessages, 'console-messages');
      }
      
      return result;
    } finally {
      this.page.off('console', consoleHandler);
    }
  }

  /**
   * Create debug report for test failure
   * @param {Error} error - Test error
   */
  async createFailureReport(error) {
    if (!this.debugMode) return;

    const reportData = {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      pageState: await this.capturePageState(),
      timestamp: new Date().toISOString(),
      testInfo: this.testInfo ? {
        title: this.testInfo.title,
        file: this.testInfo.file,
        line: this.testInfo.line,
        column: this.testInfo.column
      } : null
    };

    await this.saveDebugData(reportData, 'failure-report');
    await this.debugScreenshot('failure');
    
    this.log('Failure report created', { error: error.message });
  }
}

/**
 * Create debug helpers instance
 * @param {Page} page - Playwright page object
 * @param {Object} testInfo - Test information object
 */
function createDebugHelpers(page, testInfo = null) {
  return new DebugHelpers(page, testInfo);
}

/**
 * Enable debug mode for current test session
 */
function enableDebugMode() {
  process.env.DEBUG_TESTS = 'true';
}

/**
 * Disable debug mode for current test session
 */
function disableDebugMode() {
  process.env.DEBUG_TESTS = 'false';
}

/**
 * Check if debug mode is enabled
 */
function isDebugMode() {
  return process.env.DEBUG_TESTS === 'true';
}

module.exports = {
  DebugHelpers,
  createDebugHelpers,
  enableDebugMode,
  disableDebugMode,
  isDebugMode
};