const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const foodService = require('../database/foodService');

// Debug logging
router.use((req, res, next) => {
    console.log(`[Foods Route] ${req.method} ${req.url}`);
    next();
});

// Get all foods - requires authentication, user-specific database
router.get('/', authenticateToken, async (req, res) => {
    console.log('Handling GET request for /api/foods');
    try {
        const { search } = req.query;
        const userId = req.user.id;
        
        let foods;
        if (search) {
            // Use search functionality with user context
            foods = await foodService.searchFoods(search, userId);
        } else {
            // Get all foods for this user
            foods = await foodService.getAllFoods(userId);
        }
        
        // Maintain the same response format as before
        res.json({ foods: foods });
    } catch (error) {
        console.error('Error in GET /api/foods:', error);
        res.status(500).json({ error: 'Failed to load foods database' });
    }
});

// Search foods endpoint (alternative to query parameter)
router.get('/search', authenticateToken, async (req, res) => {
    console.log('Handling GET request for /api/foods/search');
    try {
        const { q } = req.query;
        const userId = req.user.id;
        const foods = await foodService.searchFoods(q || '', userId);
        
        res.json({ foods: foods });
    } catch (error) {
        console.error('Error in GET /api/foods/search:', error);
        res.status(500).json({ error: 'Failed to search foods database' });
    }
});

// Add new food - requires authentication, user-specific database
router.post('/', authenticateToken, async (req, res) => {
    console.log('Handling POST request for /api/foods');
    try {
        const userId = req.user.id;
        const success = await foodService.addFood(req.body, userId);
        if (success) {
            res.status(201).json(req.body);
        } else {
            res.status(500).json({ error: 'Failed to add food to database' });
        }
    } catch (error) {
        console.error('Error in POST /api/foods:', error);
        res.status(500).json({ error: 'Failed to add new food' });
    }
});

// Update food - requires authentication, user-specific database
router.put('/:index', authenticateToken, async (req, res) => {
    console.log('Handling PUT request for /api/foods/:index');
    try {
        const index = parseInt(req.params.index);
        const userId = req.user.id;
        
        // Get user's foods to validate index
        const allFoods = await foodService.getAllFoods(userId);
        if (index < 0 || index >= allFoods.length) {
            return res.status(404).json({ error: 'Food not found' });
        }

        // Update food with user context (Copy-on-Write)
        const success = await foodService.updateFood(index, req.body, userId);
        if (success) {
            res.json(req.body);
        } else {
            res.status(500).json({ error: 'Failed to update food in database' });
        }
    } catch (error) {
        console.error('Error in PUT /api/foods/:index:', error);
        res.status(500).json({ error: 'Failed to update food' });
    }
});

// Delete food - requires authentication, user-specific database
router.delete('/:index', authenticateToken, async (req, res) => {
    console.log('Handling DELETE request for /api/foods/:index');
    try {
        const index = parseInt(req.params.index);
        const userId = req.user.id;
        
        // Get user's foods to validate index
        const allFoods = await foodService.getAllFoods(userId);
        if (index < 0 || index >= allFoods.length) {
            return res.status(404).json({ error: 'Food not found' });
        }

        // Delete food with user context (soft delete for global, hard delete for custom)
        const success = await foodService.deleteFood(index, userId);
        if (success) {
            res.status(204).send();
        } else {
            res.status(500).json({ error: 'Failed to delete food from database' });
        }
    } catch (error) {
        console.error('Error in DELETE /api/foods/:index:', error);
        res.status(500).json({ error: 'Failed to delete food' });
    }
});

module.exports = router; 