const fs = require('fs');
const path = require('path');

const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const mealsDir = path.join(__dirname);

// Ensure meals directory exists
if (!fs.existsSync(mealsDir)) {
    fs.mkdirSync(mealsDir, { recursive: true });
}

// Create default data for each day
days.forEach(day => {
    const filePath = path.join(mealsDir, `${day}.json`);
    if (!fs.existsSync(filePath)) {
        const defaultData = {
            proteinLevel: 1.9,
            fatLevel: 0.8,
            calorieAdjustment: 0,
            meals: Array.from({length: 6}, (_, i) => ({
                id: i + 1,
                time: `${(8 + i * 3).toString().padStart(2, '0')}:00`,
                items: []
            }))
        };
        fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
        console.log(`Created ${day}.json`);
    } else {
        console.log(`${day}.json already exists`);
    }
}); 