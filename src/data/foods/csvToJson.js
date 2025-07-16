const fs = require('fs').promises;
const path = require('path');
const { parse } = require('csv-parse/sync'); // Using sync parser for simplicity

async function convertCsvToJson() {
    try {
        // Read the CSV file
        const csvFilePath = path.join(__dirname, 'foods.csv');
        const jsonFilePath = path.join(__dirname, 'foods.json');
        
        const csvContent = await fs.readFile(csvFilePath, 'utf-8');
        
        // Parse CSV content
        const records = parse(csvContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            bom: true // Handle BOM if present
        });

        // Transform data
        const foods = records
            .filter(record => {
                // Filter out empty rows and separator rows
                return record.Item && 
                       record.Item.trim() !== '' && 
                       !record.Item.includes('"""""""') &&
                       record.Item !== 'TEST'; // Filter out test row
            })
            .map(record => {
                // Clean and convert data
                const item = record.Item.trim();
                const amount = parseFloat(record.Amount) || 0;
                const calories = parseFloat(record.Calories) || null;
                const carbs = parseFloat(record.Carbs) || null;
                const protein = parseFloat(record.Protein) || null;
                const fat = parseFloat(record.Fat) || null;
                const proteinGeneral = parseFloat(record['Protein General']) || null;

                return {
                    item,
                    amount,
                    calories,
                    carbs,
                    protein,
                    fat,
                    proteinGeneral
                };
            });

        // Save as JSON
        const jsonContent = {
            foods: foods
        };

        await fs.writeFile(
            jsonFilePath, 
            JSON.stringify(jsonContent, null, 2), 
            'utf-8'
        );

        console.log(`Successfully converted ${foods.length} food items to JSON`);
        console.log(`JSON file saved at: ${jsonFilePath}`);
        
        // Print first few items as sample
        console.log('\nSample of converted items:');
        console.log(JSON.stringify(foods.slice(0, 3), null, 2));

    } catch (error) {
        console.error('Error converting CSV to JSON:', error);
    }
}

convertCsvToJson(); 