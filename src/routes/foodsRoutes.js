const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Update the path to be relative to the project root
const FOODS_FILE = path.join(__dirname, '..', 'data', 'foods', 'foods.json');

// Debug logging
router.use((req, res, next) => {
    console.log(`[Foods Route] ${req.method} ${req.url}`);
    next();
});

// Helper function to read foods file
async function readFoodsFile() {
    try {
        // Check if file exists
        try {
            await fs.access(FOODS_FILE);
        } catch (error) {
            console.error('Foods file does not exist:', FOODS_FILE);
            // Create an empty foods file if it doesn't exist
            await fs.writeFile(FOODS_FILE, JSON.stringify({ foods: [] }, null, 2), 'utf8');
        }
        
        const data = await fs.readFile(FOODS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading foods file:', error);
        console.error('Attempted to read from:', FOODS_FILE);
        throw error;
    }
}

// Helper function to write foods file
async function writeFoodsFile(data) {
    try {
        await fs.writeFile(FOODS_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing foods file:', error);
        throw error;
    }
}

// Get all foods
router.get('/', async (req, res) => {
    console.log('Handling GET request for /api/foods');
    try {
        const data = await readFoodsFile();
        res.json(data);
    } catch (error) {
        console.error('Error in GET /api/foods:', error);
        res.status(500).json({ error: 'Failed to load foods database' });
    }
});

// Add new food
router.post('/', async (req, res) => {
    try {
        const data = await readFoodsFile();
        data.foods.push(req.body);
        await writeFoodsFile(data);
        res.status(201).json(req.body);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add new food' });
    }
});

// Update food
router.put('/:index', async (req, res) => {
    try {
        const index = parseInt(req.params.index);
        const data = await readFoodsFile();
        
        if (index < 0 || index >= data.foods.length) {
            return res.status(404).json({ error: 'Food not found' });
        }

        data.foods[index] = req.body;
        await writeFoodsFile(data);
        res.json(req.body);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update food' });
    }
});

// Delete food
router.delete('/:index', async (req, res) => {
    try {
        const index = parseInt(req.params.index);
        const data = await readFoodsFile();
        
        if (index < 0 || index >= data.foods.length) {
            return res.status(404).json({ error: 'Food not found' });
        }

        data.foods.splice(index, 1);
        await writeFoodsFile(data);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete food' });
    }
});

module.exports = router; 