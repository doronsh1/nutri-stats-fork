const { query, isDatabaseAvailable } = require('./connection');

class MeasurementsService {
    constructor() {
        // Wait a moment for database to initialize, then check status
        setTimeout(() => this.checkDatabaseStatus(), 300);
    }

    // Check database status on startup
    async checkDatabaseStatus() {
        if (isDatabaseAvailable()) {
            console.log('📏 Measurements service using SQLite database');
        } else {
            console.log('🚫 Measurements database not available');
        }
    }

    // Get all measurement entries for a user
    async getUserMeasurementEntries(userId) {
        if (!isDatabaseAvailable()) {
            console.error('❌ Database not available');
            return { entries: [] };
        }

        try {
            const result = await query(`
                SELECT * FROM user_measurements 
                WHERE user_id = ? 
                ORDER BY date DESC, measurement_type ASC
            `, [userId]);

            return {
                entries: result.rows.map(row => ({
                    id: row.id.toString(),
                    date: row.date,
                    measurementType: row.measurement_type,
                    value: row.value,
                    unit: row.unit,
                    note: row.note || '',
                    createdAt: row.created_at
                }))
            };
        } catch (error) {
            console.error('❌ Database error getting measurement entries:', error.message);
            return { entries: [] };
        }
    }

    // Get measurement entries by type
    async getUserMeasurementsByType(userId, measurementType) {
        if (!isDatabaseAvailable()) {
            console.error('❌ Database not available');
            return { entries: [] };
        }

        try {
            const result = await query(`
                SELECT * FROM user_measurements 
                WHERE user_id = ? AND measurement_type = ?
                ORDER BY date DESC
            `, [userId, measurementType]);

            return {
                entries: result.rows.map(row => ({
                    id: row.id.toString(),
                    date: row.date,
                    measurementType: row.measurement_type,
                    value: row.value,
                    unit: row.unit,
                    note: row.note || '',
                    createdAt: row.created_at
                }))
            };
        } catch (error) {
            console.error('❌ Database error getting measurement entries by type:', error.message);
            return { entries: [] };
        }
    }

    // Get available measurement types for a user
    async getUserMeasurementTypes(userId) {
        if (!isDatabaseAvailable()) {
            console.error('❌ Database not available');
            return { types: [] };
        }

        try {
            const result = await query(`
                SELECT DISTINCT measurement_type, unit, COUNT(*) as count
                FROM user_measurements 
                WHERE user_id = ? 
                GROUP BY measurement_type, unit
                ORDER BY measurement_type ASC
            `, [userId]);

            return {
                types: result.rows.map(row => ({
                    type: row.measurement_type,
                    unit: row.unit,
                    count: row.count
                }))
            };
        } catch (error) {
            console.error('❌ Database error getting measurement types:', error.message);
            return { types: [] };
        }
    }

    // Add new measurement entry
    async addMeasurementEntry(userId, entryData) {
        if (!isDatabaseAvailable()) {
            console.error('❌ Database not available');
            return null;
        }

        console.log('📏 Adding measurement entry:', { userId, entryData });

        try {
            const { date, measurementType, value, unit, note } = entryData;

            console.log('📏 Executing INSERT query with params:', {
                userId, date, measurementType, value, unit, note: note || ''
            });

            const result = await query(`
                INSERT INTO user_measurements (user_id, date, measurement_type, value, unit, note)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [userId, date, measurementType, value, unit, note || '']);

            console.log('📏 INSERT result:', result);

            if (result.changes > 0) {
                // Return the newly created entry
                const newEntryResult = await query(`
                    SELECT * FROM user_measurements 
                    WHERE id = ?
                `, [result.lastInsertRowid]);

                if (newEntryResult.rows.length > 0) {
                    const row = newEntryResult.rows[0];
                    return {
                        id: row.id.toString(),
                        date: row.date,
                        measurementType: row.measurement_type,
                        value: row.value,
                        unit: row.unit,
                        note: row.note || '',
                        createdAt: row.created_at
                    };
                }
            }

            return null;
        } catch (error) {
            console.error('❌ Database error adding measurement entry:', error);
            console.error('❌ Error details:', {
                message: error.message,
                code: error.code,
                errno: error.errno,
                stack: error.stack
            });
            return null;
        }
    }

    // Update measurement entry
    async updateMeasurementEntry(userId, entryId, entryData) {
        if (!isDatabaseAvailable()) {
            console.error('❌ Database not available');
            return null;
        }

        try {
            const { date, measurementType, value, unit, note } = entryData;

            const result = await query(`
                UPDATE user_measurements 
                SET date = ?, measurement_type = ?, value = ?, unit = ?, note = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND user_id = ?
            `, [date, measurementType, value, unit, note || '', entryId, userId]);

            if (result.changes > 0) {
                // Return the updated entry
                const updatedEntryResult = await query(`
                    SELECT * FROM user_measurements 
                    WHERE id = ? AND user_id = ?
                `, [entryId, userId]);

                if (updatedEntryResult.rows.length > 0) {
                    const row = updatedEntryResult.rows[0];
                    return {
                        id: row.id.toString(),
                        date: row.date,
                        measurementType: row.measurement_type,
                        value: row.value,
                        unit: row.unit,
                        note: row.note || '',
                        createdAt: row.created_at
                    };
                }
            }

            return null;
        } catch (error) {
            console.error('❌ Database error updating measurement entry:', error.message);
            return null;
        }
    }

    // Delete measurement entry
    async deleteMeasurementEntry(userId, entryId) {
        if (!isDatabaseAvailable()) {
            console.error('❌ Database not available');
            return false;
        }

        try {
            const result = await query(`
                DELETE FROM user_measurements 
                WHERE id = ? AND user_id = ?
            `, [entryId, userId]);

            return result.changes > 0;
        } catch (error) {
            console.error('❌ Database error deleting measurement entry:', error.message);
            return false;
        }
    }

    // Get measurement statistics
    async getMeasurementStatistics(userId, measurementType) {
        if (!isDatabaseAvailable()) {
            console.error('❌ Database not available');
            return null;
        }

        try {
            const result = await query(`
                SELECT 
                    COUNT(*) as total_entries,
                    MIN(value) as min_value,
                    MAX(value) as max_value,
                    AVG(value) as avg_value,
                    MIN(date) as first_entry_date,
                    MAX(date) as last_entry_date
                FROM user_measurements 
                WHERE user_id = ? AND measurement_type = ?
            `, [userId, measurementType]);

            if (result.rows.length > 0) {
                const stats = result.rows[0];
                
                // Get latest measurement value and calculate changes
                const changeResult = await query(`
                    SELECT 
                        curr.value as current_value,
                        prev.value as previous_value,
                        first_entry.value as first_value
                    FROM user_measurements curr
                    LEFT JOIN user_measurements prev ON (
                        prev.user_id = curr.user_id 
                        AND prev.measurement_type = curr.measurement_type
                        AND prev.date < curr.date
                        AND prev.date = (
                            SELECT MAX(date) FROM user_measurements p2
                            WHERE p2.user_id = curr.user_id 
                            AND p2.measurement_type = curr.measurement_type
                            AND p2.date < curr.date
                        )
                    )
                    LEFT JOIN user_measurements first_entry ON (
                        first_entry.user_id = curr.user_id 
                        AND first_entry.measurement_type = curr.measurement_type
                        AND first_entry.date = (
                            SELECT MIN(date) FROM user_measurements 
                            WHERE user_id = curr.user_id AND measurement_type = curr.measurement_type
                        )
                    )
                    WHERE curr.user_id = ? AND curr.measurement_type = ?
                    AND curr.date = (
                        SELECT MAX(date) FROM user_measurements 
                        WHERE user_id = curr.user_id AND measurement_type = curr.measurement_type
                    )
                    LIMIT 1
                `, [userId, measurementType]);

                // Calculate average change between consecutive measurements
                const avgChangeResult = await query(`
                    SELECT AVG(curr.value - prev.value) as avg_change
                    FROM user_measurements curr
                    INNER JOIN user_measurements prev ON (
                        prev.user_id = curr.user_id 
                        AND prev.measurement_type = curr.measurement_type
                        AND prev.date < curr.date
                        AND prev.date = (
                            SELECT MAX(date) FROM user_measurements p2
                            WHERE p2.user_id = curr.user_id 
                            AND p2.measurement_type = curr.measurement_type
                            AND p2.date < curr.date
                        )
                    )
                    WHERE curr.user_id = ? AND curr.measurement_type = ?
                `, [userId, measurementType]);

                let latestChange = 0;
                let overallChange = 0;
                let avgChange = 0;
                
                if (changeResult.rows.length > 0) {
                    const result = changeResult.rows[0];
                    
                    // Calculate latest change (current - previous)
                    if (result.previous_value) {
                        latestChange = result.current_value - result.previous_value;
                    }
                    
                    // Calculate overall change (current - first)
                    if (result.first_value) {
                        overallChange = result.current_value - result.first_value;
                    }
                }

                // Get average change
                if (avgChangeResult.rows.length > 0 && avgChangeResult.rows[0].avg_change !== null) {
                    avgChange = avgChangeResult.rows[0].avg_change;
                }

                // Get the latest measurement value
                let latestValue = 0;
                if (changeResult.rows.length > 0) {
                    latestValue = changeResult.rows[0].current_value;
                }

                return {
                    totalEntries: stats.total_entries,
                    minValue: stats.min_value,
                    maxValue: stats.max_value,
                    latestValue: latestValue,
                    avgChange: parseFloat(avgChange.toFixed(2)) || 0,
                    firstEntryDate: stats.first_entry_date,
                    lastEntryDate: stats.last_entry_date,
                    latestChange: parseFloat(latestChange.toFixed(2)),
                    overallChange: parseFloat(overallChange.toFixed(2))
                };
            }

            return null;
        } catch (error) {
            console.error('❌ Database error getting measurement statistics:', error.message);
            return null;
        }
    }
}

module.exports = new MeasurementsService();