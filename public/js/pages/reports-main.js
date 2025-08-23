// Main Reports Page Initialization
// This file coordinates all the report modules

// Global instances
let nutritionReports = null;
let weightTracker = null;
let measurementsManager = null;
let pdfGenerator = null;

// Note: Report initialization is now handled by ReportsApp class

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Prevent double initialization
    if (window.reportsInitialized) {
        console.log('Reports already initialized, skipping');
        return;
    }
    
    if (!window.reportsApp) {
        console.log('Creating ReportsApp instance');
        window.reportsApp = new ReportsApp();
        window.reportsInitialized = true;
    } else {
        console.log('ReportsApp already exists, skipping initialization');
    }
});

// Also initialize on window load as backup for slow connections
window.addEventListener('load', () => {
    // Only initialize if not already done
    if (!window.reportsInitialized && !window.reportsApp) {
        console.log('Creating ReportsApp instance on window load');
        window.reportsApp = new ReportsApp();
        window.reportsInitialized = true;
    } else {
        console.log('Reports already initialized on window load, skipping');
    }
});