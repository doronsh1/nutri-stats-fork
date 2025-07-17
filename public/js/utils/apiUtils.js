// API utility functions for handling authentication and errors

/**
 * Enhanced fetch wrapper with authentication error handling
 * @param {string} url - The API endpoint URL
 * @param {object} options - Fetch options (method, headers, body, etc.)
 * @param {boolean} showErrorMessages - Whether to show error messages to user (default: true)
 * @param {boolean} isAuthCheck - Whether this is an authentication check (default: false)
 * @returns {Promise} - Returns the response or throws an error
 */
async function authenticatedFetch(url, options = {}, showErrorMessages = true, isAuthCheck = false) {
    try {
        const response = await fetch(url, {
            credentials: 'include', // Include cookies for session authentication
            ...options
        });

        // Handle authentication errors
        if (response.status === 401) {
            // Only trigger authentication error handling if we're not on a public page
            if (!isPublicPage() && !isAuthCheck) {
                handleAuthenticationError();
            }
            throw new Error('Authentication required');
        }

        // Handle other HTTP errors
        if (!response.ok) {
            const errorMessage = await getErrorMessage(response);
            if (showErrorMessages && !isAuthCheck) {
                showUserError(`Request failed: ${errorMessage}`);
            }
            throw new Error(`HTTP ${response.status}: ${errorMessage}`);
        }

        return response;
    } catch (error) {
        // Handle network errors
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            if (showErrorMessages && !isAuthCheck) {
                showUserError('Network error. Please check your connection and try again.');
            }
            throw new Error('Network error');
        }
        throw error;
    }
}

/**
 * Handle authentication errors by redirecting to login
 */
function handleAuthenticationError() {
    console.log('Authentication error detected, redirecting to login...');
    
    // Clear any stored user state
    clearUserState();
    
    // Show a brief message before redirect
    showUserError('Your session has expired. Redirecting to login...', 'warning');
    
    // Redirect to login page after a short delay
    setTimeout(() => {
        window.location.href = '/login.html';
    }, 1500);
}

/**
 * Clear user state from the UI
 */
function clearUserState() {
    // Clear user display if it exists
    const userDisplay = document.getElementById('userDisplay');
    if (userDisplay) {
        userDisplay.textContent = '';
    }
    
    // Clear any cached data
    localStorage.removeItem('userSettings');
    sessionStorage.clear();
}

/**
 * Extract error message from response
 */
async function getErrorMessage(response) {
    try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return data.message || data.error || 'Unknown error';
        } else {
            return await response.text() || 'Unknown error';
        }
    } catch (e) {
        return 'Unknown error';
    }
}

/**
 * Check if current page is a public page that doesn't require authentication
 */
function isPublicPage() {
    const currentPath = window.location.pathname.toLowerCase();
    const publicPages = ['/login.html', '/register.html', '/'];
    return publicPages.some(page => currentPath.endsWith(page)) || currentPath === '/';
}

/**
 * Show error message to user
 */
function showUserError(message, type = 'error') {
    console.error(message);
    
    // Try to find an existing error container or create one
    let errorContainer = document.getElementById('error-container');
    if (!errorContainer) {
        errorContainer = createErrorContainer();
    }
    
    // Create error alert
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type === 'error' ? 'danger' : 'warning'} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Add to container
    errorContainer.appendChild(alertDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

/**
 * Create error container if it doesn't exist
 */
function createErrorContainer() {
    const container = document.createElement('div');
    container.id = 'error-container';
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    container.style.maxWidth = '400px';
    
    document.body.appendChild(container);
    return container;
}

/**
 * Enhanced API call helpers for common operations
 */
const API = {
    // Settings API
    settings: {
        get: () => authenticatedFetch('/api/settings'),
        save: (data) => authenticatedFetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
    },
    
    // Foods API
    foods: {
        getAll: () => authenticatedFetch('/api/foods'),
        add: (food) => authenticatedFetch('/api/foods', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(food)
        }),
        update: (index, food) => authenticatedFetch(`/api/foods/${index}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(food)
        }),
        delete: (index) => authenticatedFetch(`/api/foods/${index}`, {
            method: 'DELETE'
        })
    },
    
    // Daily meals API
    meals: {
        get: (dayName) => authenticatedFetch(`/api/daily-meals/${dayName}`),
        saveMacros: (dayName, macros) => authenticatedFetch(`/api/daily-meals/${dayName}/macros`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(macros)
        }),
        updateMealTime: (dayName, mealId, time) => authenticatedFetch(`/api/daily-meals/${dayName}/meals/${mealId}/time`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ time })
        }),
        addItem: (dayName, mealId, item) => authenticatedFetch(`/api/daily-meals/${dayName}/meals/${mealId}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        }),
        updateItem: (dayName, mealId, itemId, item) => authenticatedFetch(`/api/daily-meals/${dayName}/meals/${mealId}/items/${itemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        }),
        deleteItem: (dayName, mealId, itemId) => authenticatedFetch(`/api/daily-meals/${dayName}/meals/${mealId}/items/${itemId}`, {
            method: 'DELETE'
        })
    },
    
    // Auth API
    auth: {
        me: () => authenticatedFetch('/api/auth/me', {}, false, true), // Silent auth check
        logout: () => authenticatedFetch('/api/auth/logout', { method: 'POST' })
    }
};

/**
 * Check if user is authenticated on page load
 */
async function checkAuthentication() {
    try {
        const response = await API.auth.me();
        const user = await response.json();
        return user;
    } catch (error) {
        // Authentication check failed, user will be redirected by handleAuthenticationError
        return null;
    }
}

/**
 * Initialize authentication check for protected pages
 */
function initializeAuth() {
    // Only run auth checks on protected pages
    if (isPublicPage()) {
        console.log('Public page - skipping authentication check');
        return;
    }
    
    // Check authentication when page loads
    checkAuthentication().then(user => {
        if (!user) {
            console.log('User not authenticated, redirecting...');
            // User will be redirected by the error handler
        } else {
            console.log('User authenticated:', user.name || user.email);
        }
    });
}

// Export functions for use in other files
window.authenticatedFetch = authenticatedFetch;
window.API = API;
window.checkAuthentication = checkAuthentication;
window.initializeAuth = initializeAuth;
window.handleAuthenticationError = handleAuthenticationError;
window.showUserError = showUserError;
window.isPublicPage = isPublicPage; 