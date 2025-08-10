const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const measurementsService = require('../database/measurementsService');

// GET - Get all measurement entries for a user
router.get('/', authenticateToken, async (req, res) => {
    console.log('Handling GET request for /api/measurements');
    try {
        const userId = req.user.id;
        const measurementData = await measurementsService.getUserMeasurementEntries(userId);
        res.json(measurementData);
    } catch (error) {
        console.error('Error in GET /api/measurements:', error);
        res.status(500).json({ error: 'Failed to read measurement entries' });
    }
});

// GET - Get measurement entries by type
router.get('/type/:measurementType', authenticateToken, async (req, res) => {
    console.log(`Handling GET request for /api/measurements/type/${req.params.measurementType}`);
    try {
        const userId = req.user.id;
        const { measurementType } = req.params;
        const measurementData = await measurementsService.getUserMeasurementsByType(userId, measurementType);
        res.json(measurementData);
    } catch (error) {
        console.error('Error in GET /api/measurements/type:', error);
        res.status(500).json({ error: 'Failed to read measurement entries by type' });
    }
});

// GET - Get available measurement types for a user
router.get('/types', authenticateToken, async (req, res) => {
    console.log('Handling GET request for /api/measurements/types');
    try {
        const userId = req.user.id;
        const typesData = await measurementsService.getUserMeasurementTypes(userId);
        res.json(typesData);
    } catch (error) {
        console.error('Error in GET /api/measurements/types:', error);
        res.status(500).json({ error: 'Failed to read measurement types' });
    }
});

// GET - Get measurement statistics
router.get('/stats/:measurementType', authenticateToken, async (req, res) => {
    console.log(`Handling GET request for /api/measurements/stats/${req.params.measurementType}`);
    try {
        const userId = req.user.id;
        const { measurementType } = req.params;
        const stats = await measurementsService.getMeasurementStatistics(userId, measurementType);
        
        if (stats) {
            res.json(stats);
        } else {
            res.json({
                totalEntries: 0,
                minValue: 0,
                maxValue: 0,
                avgValue: 0,
                firstEntryDate: null,
                lastEntryDate: null,
                latestChange: 0,
                overallChange: 0
            });
        }
    } catch (error) {
        console.error('Error in GET /api/measurements/stats:', error);
        res.status(500).json({ error: 'Failed to read measurement statistics' });
    }
});

// POST - Add a new measurement entry
router.post('/', authenticateToken, async (req, res) => {
    console.log('Handling POST request for /api/measurements');
    console.log('Request body:', req.body);
    console.log('User ID:', req.user?.id);
    try {
        const userId = req.user.id;
        const { date, measurementType, value, unit, note } = req.body;
        
        // Validate required fields
        if (!date || !measurementType || !value || !unit) {
            return res.status(400).json({ 
                error: 'Date, measurement type, value, and unit are required' 
            });
        }
        
        // Validate value is a positive number
        const valueNum = parseFloat(value);
        if (isNaN(valueNum) || valueNum <= 0) {
            return res.status(400).json({ 
                error: 'Value must be a positive number' 
            });
        }
        
        // Validate date format
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
            return res.status(400).json({ error: 'Invalid date format' });
        }
        
        // Validate measurement type (only allow predefined types)
        const validMeasurementTypes = ['Waist', 'Thigh', 'Arm'];
        if (typeof measurementType !== 'string' || !validMeasurementTypes.includes(measurementType.trim())) {
            return res.status(400).json({ 
                error: 'Invalid measurement type. Must be one of: Waist, Thigh, Arm' 
            });
        }
        
        // Validate unit
        const validUnits = ['cm', 'in', 'mm'];
        if (!validUnits.includes(unit)) {
            return res.status(400).json({ 
                error: 'Invalid unit. Must be one of: cm, in, mm' 
            });
        }
        
        const entryData = {
            date: date,
            measurementType: measurementType.trim(),
            value: valueNum,
            unit: unit,
            note: note || ''
        };
        
        const newEntry = await measurementsService.addMeasurementEntry(userId, entryData);
        if (newEntry) {
            res.status(201).json(newEntry);
        } else {
            res.status(500).json({ error: 'Failed to create measurement entry' });
        }
    } catch (error) {
        console.error('Error in POST /api/measurements:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            userId: req.user?.id,
            body: req.body
        });
        res.status(500).json({ error: 'Failed to create measurement entry' });
    }
});

// PUT - Update a measurement entry
router.put('/:id', authenticateToken, async (req, res) => {
    console.log(`Handling PUT request for /api/measurements/${req.params.id}`);
    try {
        const userId = req.user.id;
        const entryId = req.params.id;
        const { date, measurementType, value, unit, note } = req.body;
        
        // Validate required fields
        if (!date || !measurementType || !value || !unit) {
            return res.status(400).json({ 
                error: 'Date, measurement type, value, and unit are required' 
            });
        }
        
        // Validate value is a positive number
        const valueNum = parseFloat(value);
        if (isNaN(valueNum) || valueNum <= 0) {
            return res.status(400).json({ 
                error: 'Value must be a positive number' 
            });
        }
        
        // Validate date format
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
            return res.status(400).json({ error: 'Invalid date format' });
        }
        
        // Validate measurement type (only allow predefined types)
        const validMeasurementTypes = ['Waist', 'Thigh', 'Arm'];
        if (typeof measurementType !== 'string' || !validMeasurementTypes.includes(measurementType.trim())) {
            return res.status(400).json({ 
                error: 'Invalid measurement type. Must be one of: Waist, Thigh, Arm' 
            });
        }
        
        // Validate unit
        const validUnits = ['cm', 'in', 'mm'];
        if (!validUnits.includes(unit)) {
            return res.status(400).json({ 
                error: 'Invalid unit. Must be one of: cm, in, mm' 
            });
        }
        
        const entryData = {
            date: date,
            measurementType: measurementType.trim(),
            value: valueNum,
            unit: unit,
            note: note || ''
        };
        
        const updatedEntry = await measurementsService.updateMeasurementEntry(userId, entryId, entryData);
        if (updatedEntry) {
            res.json(updatedEntry);
        } else {
            res.status(404).json({ error: 'Measurement entry not found or update failed' });
        }
    } catch (error) {
        console.error('Error in PUT /api/measurements:', error);
        res.status(500).json({ error: 'Failed to update measurement entry' });
    }
});

// DELETE - Delete a measurement entry
router.delete('/:id', authenticateToken, async (req, res) => {
    console.log(`Handling DELETE request for /api/measurements/${req.params.id}`);
    try {
        const userId = req.user.id;
        const entryId = req.params.id;
        
        const deleted = await measurementsService.deleteMeasurementEntry(userId, entryId);
        if (deleted) {
            res.json({ message: 'Measurement entry deleted successfully' });
        } else {
            res.status(404).json({ error: 'Measurement entry not found or delete failed' });
        }
    } catch (error) {
        console.error('Error in DELETE /api/measurements:', error);
        res.status(500).json({ error: 'Failed to delete measurement entry' });
    }
});

module.exports = router;