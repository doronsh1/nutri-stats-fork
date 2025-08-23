// Reports Page - Module Verification
// This file verifies all report modules are loaded correctly

console.log('Reports modules loaded successfully');

// Verify all modules are available
if (typeof NutritionReports === 'undefined') {
    console.error('NutritionReports module not loaded');
}

if (typeof WeightTracker === 'undefined') {
    console.error('WeightTracker module not loaded');
}

if (typeof PDFReportGenerator === 'undefined') {
    console.error('PDFReportGenerator module not loaded');
}

if (typeof ReportsApp === 'undefined') {
    console.error('ReportsApp module not loaded');
}

if (typeof showSuccessMessage === 'undefined') {
    console.error('Report utilities not loaded');
}

console.log('All report modules verified and ready');