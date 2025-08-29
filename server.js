// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const session = require('express-session');

// Database initialization (non-blocking)
const { initializeDatabase, testConnection } = require('./src/database/init');

// Email service initialization
const EmailService = require('./src/services/emailService');

// Initialize express app
const app = express();
const port = process.env.PORT || 8080;

// Middleware for parsing JSON and logging
app.use(express.json());

// Session middleware for authentication
app.use(session({
    secret: 'nutrition-app-secret-key-' + Date.now(), // In production, use environment variable
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

app.use((req, res, next) => {
    // Skip logging common bot/scanner requests
    const botPatterns = [
        '/download/', '/get.php', '/wp-admin', '/phpmyadmin', 
        '/admin', '/robots.txt', '/favicon.ico'
    ];
    
    const isBotRequest = botPatterns.some(pattern => req.url.includes(pattern));
    
    if (!isBotRequest) {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    }
    next();
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Import route handlers
const foodsRoutes = require('./src/routes/foodsRoutes');
const dailyMealsRoutes = require('./src/routes/dailyMealsRoutes');
const settingsRoutes = require('./src/routes/settingsRoutes');
const authRoutes = require('./src/routes/auth'); // Use JWT-based auth
const weightRoutes = require('./src/routes/weightRoutes');
const measurementsRoutes = require('./src/routes/measurementsRoutes');

// Ensure data directory exists for SQLite database
async function ensureDataDirectory() {
    try {
        await fs.mkdir(path.join(__dirname, 'src', 'data'), { recursive: true });
    } catch (error) {
        console.error('Error creating data directory:', error);
    }
}

// Mount API routes
app.use('/api/auth', authRoutes);              // Authentication routes
app.use('/api/foods', foodsRoutes);
app.use('/api/daily-meals', dailyMealsRoutes); // Keep original path to maintain compatibility
app.use('/api/meals', dailyMealsRoutes);       // Add new path for consistency
app.use('/api/settings', settingsRoutes);
app.use('/api/weight', weightRoutes);          // Weight tracking routes
app.use('/api/measurements', measurementsRoutes); // Measurements tracking routes

// Test route to verify API is working
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working' });
});

// Version endpoint - simplified to just use package.json
app.get('/api/version', (req, res) => {
    try {
        const packageJson = require('./package.json');
        const buildDate = new Date().toISOString();
        
        res.json({
            version: packageJson.version,
            buildDate: buildDate,
            fullVersion: `v${packageJson.version}`
        });
    } catch (error) {
        console.error('Error reading version info:', error);
        res.status(500).json({ 
            version: '1.0.0',
            buildDate: new Date().toISOString(),
            fullVersion: 'v1.0.0'
        });
    }
});

// Default route - serve login page (let frontend handle auth)
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    console.log('404 Not Found:', req.url);
    res.status(404).json({ error: 'Not Found' });
});

// Initialize server
async function startServer() {
    try {
        // Ensure data directory exists for SQLite database
        await ensureDataDirectory();

        // Skip database operations if SKIP_DB_DEPLOY is set
        if (process.env.SKIP_DB_DEPLOY === 'true') {
            console.log('⚠️  Database deployment skipped (SKIP_DB_DEPLOY=true)');
        } else {
            // Initialize database (non-blocking - server starts even if DB fails)
            initializeDatabaseAsync();

            // Run database migrations
            try {
                const migrations = require('./src/database/migrations');
                await migrations.migrate();
            } catch (migrationError) {
                console.error('⚠️  Migration failed, but server will continue:', migrationError.message);
            }
        }

        // Initialize and validate email service configuration
        console.log('Initializing email service...');
        const emailService = new EmailService();
        emailService.validateConfiguration();

        // Get version from package.json
        const packageJson = require('./package.json');
        const version = `v${packageJson.version}`;

        // Start the server - bind to all interfaces for cloud deployment
        app.listen(port, '0.0.0.0', () => {
            console.log('=================================');
            console.log(`🚀 NutriStats Server ${version}`);
            console.log(`Server is running on port ${port}`);
            console.log('Available routes:');
            console.log('- GET  /api/test         (Test endpoint)');
            console.log('- GET  /api/version      (Version info)');
            console.log('- POST /api/auth/*       (Authentication endpoints)');
            console.log('- GET  /api/foods        (Get all foods)');
            console.log('- POST /api/foods        (Add new food)');
            console.log('- GET  /api/daily-meals  (Get daily meals - user-specific)');
            console.log('- GET  /api/meals        (Alias for daily-meals)');
            console.log('- GET  /api/settings     (Get settings - user-specific)');
            console.log('- GET  /api/weight       (Get weight entries - user-specific)');
            console.log('- GET  /api/measurements (Get measurement entries - user-specific)');
            console.log('=================================');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Simple database initialization
async function initializeDatabaseAsync() {
    try {
        console.log('Connecting to database...');
        
        const connected = await testConnection();
        if (connected) {
            await initializeDatabase();
            console.log('Database ready');
        } else {
            console.log('Database not available');
        }
    } catch (error) {
        console.log('Database error:', error.message);
    }
}

startServer(); 