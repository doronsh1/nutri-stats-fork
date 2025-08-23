// Application Manager
class ReportsApp {
    constructor() {
        // Set global reference immediately to prevent double initialization
        window.reportsApp = this;

        this.nutritionReports = new NutritionReports();
        this.weightTracker = new WeightTracker();
        this.measurementsManager = null; // Will be initialized when needed
        this.pdfGenerator = null; // Will be initialized in init()
        this.currentTab = 'nutrition';
        this.isInitialized = false;
        this.pendingTabSwitch = null;

        console.log('ReportsApp constructor called');
        this.init();
    }

    async init() {
        // Wait for DOM to be fully ready
        await this.waitForDOM();

        // Ensure proper initial state
        this.ensureInitialTabState();

        // Set up tab switching
        this.setupTabSwitching();

        // Initialize nutrition reports (default tab)
        await this.nutritionReports.init();

        // Mark as initialized
        this.isInitialized = true;

        // Process any pending tab switch
        if (this.pendingTabSwitch) {
            this.switchToTab(this.pendingTabSwitch);
            this.pendingTabSwitch = null;
        }

        // Make weight tracker globally accessible
        window.weightTracker = this.weightTracker;

        // Measurements manager will be created when needed (after measurements.js loads)

        // Initialize PDF generator
        if (typeof PDFReportGenerator !== 'undefined') {
            this.pdfGenerator = new PDFReportGenerator();
            this.pdfGenerator.init(this.nutritionReports, this.weightTracker, this.measurementsManager);
            window.pdfGenerator = this.pdfGenerator; // Make it globally accessible
            console.log('PDF generator initialized');
        } else {
            console.warn('PDFReportGenerator class not available');
        }

        // Make app instance globally accessible
        window.reportsApp = this;

        // Set up comprehensive chart resize handling
        this.setupGlobalResizeHandler();
    }

    waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'complete') {
                resolve();
            } else {
                const checkReady = () => {
                    if (document.readyState === 'complete') {
                        resolve();
                    } else {
                        setTimeout(checkReady, 10);
                    }
                };
                checkReady();
            }
        });
    }

    ensureInitialTabState() {
        const nutritionTab = document.getElementById('nutrition-tab');
        const weightTab = document.getElementById('weight-tab');
        const nutritionSection = document.getElementById('nutrition-section');
        const weightSection = document.getElementById('weight-section');

        if (nutritionTab && weightTab && nutritionSection && weightSection) {
            console.log('Setting initial tab state');

            // Deactivate all tabs
            nutritionTab.classList.remove('active');
            weightTab.classList.remove('active');

            // Hide all sections
            nutritionSection.classList.remove('active');
            weightSection.classList.remove('active');

            // Activate nutrition tab (default)
            nutritionTab.classList.add('active');
            nutritionSection.classList.add('active');

            console.log('Initial tab state set to nutrition');
        } else {
            console.error('Initial tab elements not found:', {
                nutritionTab: !!nutritionTab,
                weightTab: !!weightTab,
                nutritionSection: !!nutritionSection,
                weightSection: !!weightSection
            });
        }
    }

    setupTabSwitching() {
        const nutritionTab = document.getElementById('nutrition-tab');
        const weightTab = document.getElementById('weight-tab');
        const measurementsTab = document.getElementById('measurements-tab');

        if (!nutritionTab || !weightTab || !measurementsTab) {
            console.error('Tab buttons not found');
            return;
        }

        console.log('Setting up custom tab switching');

        // Handle nutrition tab click
        nutritionTab.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Nutrition tab clicked');
            this.switchToTab('nutrition');
        });

        // Handle weight tab click
        weightTab.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Weight tab clicked');
            this.switchToTab('weight');
        });

        // Handle measurements tab click
        measurementsTab.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Measurements tab clicked');
            this.switchToTab('measurements');
        });
    }

    switchToTab(tabName) {
        // If not initialized yet, queue the tab switch
        if (!this.isInitialized) {
            this.pendingTabSwitch = tabName;
            console.log(`Queuing tab switch to: ${tabName}`);
            return;
        }

        // Prevent switching if already on the same tab
        if (this.currentTab === tabName) {
            console.log(`Already on ${tabName} tab, skipping`);
            return;
        }

        console.log(`Switching from ${this.currentTab} to ${tabName}`);

        // Get tab buttons
        const nutritionTab = document.getElementById('nutrition-tab');
        const weightTab = document.getElementById('weight-tab');
        const measurementsTab = document.getElementById('measurements-tab');

        // Get report sections
        const nutritionSection = document.getElementById('nutrition-section');
        const weightSection = document.getElementById('weight-section');
        const measurementsSection = document.getElementById('measurements-section');

        // Validate elements exist
        if (!nutritionTab || !weightTab || !measurementsTab || !nutritionSection || !weightSection || !measurementsSection) {
            console.error('Required elements not found:', {
                nutritionTab: !!nutritionTab,
                weightTab: !!weightTab,
                measurementsTab: !!measurementsTab,
                nutritionSection: !!nutritionSection,
                weightSection: !!weightSection,
                measurementsSection: !!measurementsSection
            });
            return;
        }

        // Update current tab
        this.currentTab = tabName;

        // STEP 1: Deactivate all tab buttons
        nutritionTab.classList.remove('active');
        weightTab.classList.remove('active');
        measurementsTab.classList.remove('active');

        // STEP 2: Hide all sections
        nutritionSection.classList.remove('active');
        weightSection.classList.remove('active');
        measurementsSection.classList.remove('active');

        // STEP 3: Activate the selected tab and section
        if (tabName === 'nutrition') {
            nutritionTab.classList.add('active');
            nutritionSection.classList.add('active');
            console.log('Nutrition section activated');

        } else if (tabName === 'weight') {
            weightTab.classList.add('active');
            weightSection.classList.add('active');
            console.log('Weight section activated');

            // Initialize weight tracker if not already done
            this.weightTracker.init();

        } else if (tabName === 'measurements') {
            measurementsTab.classList.add('active');
            measurementsSection.classList.add('active');
            console.log('Measurements section activated');

            // Initialize measurements manager if not already done
            if (typeof MeasurementsManager !== 'undefined') {
                // Create measurements manager if it doesn't exist
                if (!this.measurementsManager) {
                    console.log('Creating measurements manager instance');
                    this.measurementsManager = new MeasurementsManager();
                    window.measurementsManager = this.measurementsManager;
                    
                    // Update PDF generator with measurements manager
                    if (this.pdfGenerator) {
                        this.pdfGenerator.setMeasurementsManager(this.measurementsManager);
                    }
                }

                // Initialize if not already done
                if (!this.measurementsManager.initialized) {
                    console.log('Initializing measurements manager');
                    this.measurementsManager.init();
                } else {
                    // Ensure default date is set when tab becomes active
                    if (typeof this.measurementsManager.setDefaultDate === 'function') {
                        this.measurementsManager.setDefaultDate();
                    }
                    // Re-setup event listeners to ensure they're attached
                    if (typeof this.measurementsManager.setupEventListeners === 'function') {
                        this.measurementsManager.setupEventListeners();
                    }
                }
            } else {
                console.warn('MeasurementsManager class not available');
            }
        }

        console.log(`Successfully switched to ${tabName} tab`);
    }

    setupGlobalResizeHandler() {
        let resizeTimeout;

        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                console.log('Window resized, updating charts...');

                // Resize nutrition chart if it exists and is visible
                if (this.nutritionReports.charts.weeklyCalories && this.currentTab === 'nutrition') {
                    this.nutritionReports.charts.weeklyCalories.resize();
                    console.log('Nutrition chart resized');
                }

                // Resize weight chart if it exists and is visible
                if (this.weightTracker.chart && this.currentTab === 'weight') {
                    this.weightTracker.chart.resize();
                    console.log('Weight chart resized');
                }

                // Resize measurements chart if it exists and is visible
                if (this.measurementsManager && this.measurementsManager.measurementChart && this.currentTab === 'measurements') {
                    this.measurementsManager.measurementChart.resize();
                    console.log('Measurements chart resized');
                }

                // Force resize all charts regardless of current tab (for better reliability)
                setTimeout(() => {
                    if (this.nutritionReports.charts.weeklyCalories) {
                        this.nutritionReports.charts.weeklyCalories.resize();
                    }
                    if (this.weightTracker.chart) {
                        this.weightTracker.chart.resize();
                    }
                    if (this.measurementsManager && this.measurementsManager.measurementChart) {
                        this.measurementsManager.measurementChart.resize();
                    }
                }, 100);

            }, 300); // Slightly longer debounce for better performance
        });
    }
}

// Export for use in other modules
window.ReportsApp = ReportsApp;