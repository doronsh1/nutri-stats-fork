const express = require('express');
const path = require('path');
const fs = require('fs').promises;

// Initialize express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware for parsing JSON and logging
app.use(express.json());
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Import route handlers
const foodsRoutes = require('./src/routes/foodsRoutes');
const dailyMealsRoutes = require('./src/routes/dailyMealsRoutes');
const settingsRoutes = require('./src/routes/settingsRoutes');

// Ensure data directories exist
async function ensureDirectories() {
    try {
        await fs.mkdir(path.join(__dirname, 'src', 'data'), { recursive: true });
        await fs.mkdir(path.join(__dirname, 'src', 'data', 'meals'), { recursive: true });
        await fs.mkdir(path.join(__dirname, 'src', 'data', 'foods'), { recursive: true });
    } catch (error) {
        console.error('Error creating directories:', error);
        throw error;
    }
}

// Mount API routes
app.use('/api/foods', foodsRoutes);
app.use('/api/daily-meals', dailyMealsRoutes); // Keep original path to maintain compatibility
app.use('/api/meals', dailyMealsRoutes);       // Add new path for consistency
app.use('/api/settings', settingsRoutes);

// Test route to verify API is working
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working' });
});

// Default route - redirect to diary
app.get('/', (req, res) => {
    res.redirect('/diary.html');
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
        // Ensure all required directories exist
        await ensureDirectories();

        // Start the server
        app.listen(port, () => {
            console.log('=================================');
            console.log(`Server is running on port ${port}`);
            console.log('Available routes:');
            console.log('- GET  /api/test         (Test endpoint)');
            console.log('- GET  /api/foods        (Get all foods)');
            console.log('- POST /api/foods        (Add new food)');
            console.log('- GET  /api/daily-meals  (Get daily meals)');
            console.log('- GET  /api/meals        (Alias for daily-meals)');
            console.log('- GET  /api/settings     (Get settings)');
            console.log('=================================');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer(); 