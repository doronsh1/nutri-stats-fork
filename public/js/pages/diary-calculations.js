function updateRowTotals(input) {
    const row = input.closest('tr');
    const table = row.closest('table');
    updateTotals(table);
}

function updateTotals(table) {
    const rows = table.querySelectorAll('.meal-row');
    let totals = {
        calories: 0,
        carbs: 0,
        protein: 0,
        fat: 0,
        proteinG: 0
    };

    rows.forEach(row => {
        const nutritionalDivs = row.querySelectorAll('.nutritional-value');
        if (nutritionalDivs.length >= 5) {
            totals.calories += parseFloat(nutritionalDivs[0].textContent) || 0;
            totals.carbs += parseFloat(nutritionalDivs[1].textContent) || 0;
            totals.protein += parseFloat(nutritionalDivs[2].textContent) || 0;
            totals.fat += parseFloat(nutritionalDivs[3].textContent) || 0;
            totals.proteinG += parseFloat(nutritionalDivs[4].textContent) || 0;
        }
    });

    // Update footer totals
    const totalCells = table.querySelectorAll('tfoot td');
    if (totalCells.length >= 6) {
        totalCells[1].textContent = totals.calories.toFixed(1);
        totalCells[2].textContent = totals.carbs.toFixed(1);
        totalCells[3].textContent = totals.protein.toFixed(1);
        totalCells[4].textContent = totals.fat.toFixed(1);
        totalCells[5].textContent = totals.proteinG.toFixed(1);
    }

    // Update header stats after updating totals
    updateHeaderStats();
}

function calculateMacroStats() {
    // Get protein level (as percentage of body weight)
    const proteinLevel = parseFloat(document.getElementById('proteinLevelInput').value) || 0;
    const fatLevel = parseFloat(document.getElementById('fatLevelInput').value) || 0;
    
    // Calculate target protein and fat in grams
    const targetProteinG = proteinLevel * userWeight;
    const targetFatG = fatLevel * userWeight;
    
    // Calculate calories from protein and fat (protein = 4 cal/g, fat = 9 cal/g)
    const proteinCalories = targetProteinG * 4;
    const fatCalories = targetFatG * 9;
    
    // Calculate remaining calories for carbs
    const remainingCalories = Math.max(0, goalCalories - proteinCalories - fatCalories);
    const carbCalories = remainingCalories;
    const targetCarbG = carbCalories / 4; // carbs = 4 cal/g
    
    // Calculate percentages
    const proteinPercentage = goalCalories > 0 ? (proteinCalories / goalCalories) * 100 : 0;
    const fatPercentage = goalCalories > 0 ? (fatCalories / goalCalories) * 100 : 0;
    const carbPercentage = goalCalories > 0 ? (carbCalories / goalCalories) * 100 : 0;
    
    // Update the display
    document.getElementById('proteinPercentage').textContent = proteinPercentage.toFixed(1);
    document.getElementById('proteinGrams').textContent = Math.round(targetProteinG);
    document.getElementById('proteinCalories').textContent = Math.round(proteinCalories);
    
    document.getElementById('fatPercentage').textContent = fatPercentage.toFixed(1);
    document.getElementById('fatGrams').textContent = Math.round(targetFatG);
    document.getElementById('fatCalories').textContent = Math.round(fatCalories);
    
    document.getElementById('carboPercentage').textContent = carbPercentage.toFixed(1);
    document.getElementById('carboGrams').textContent = Math.round(targetCarbG);
    document.getElementById('carboCalories').textContent = Math.round(carbCalories);
    
    // Update second row with actual values
    updateHeaderStats();
    
    // Save macro settings
    saveMacroSettings();
}

function updateHeaderStats() {
    const tables = document.querySelectorAll('.meal-table');
    let totals = {
        calories: 0,
        carbs: 0,
        protein: 0,
        fat: 0,
        proteinG: 0
    };

    // Sum up all meal totals
    tables.forEach(table => {
        const totalCells = table.querySelectorAll('tfoot td');
        if (totalCells.length >= 7) {
            totals.calories += parseFloat(totalCells[2].textContent) || 0;
            totals.carbs += parseFloat(totalCells[3].textContent) || 0;
            totals.protein += parseFloat(totalCells[4].textContent) || 0;
            totals.fat += parseFloat(totalCells[5].textContent) || 0;
            totals.proteinG += parseFloat(totalCells[6].textContent) || 0;
        }
    });

    // Get target values from the first row
    const proteinLevel = parseFloat(document.getElementById('proteinLevelInput').value) || 0;
    const fatLevel = parseFloat(document.getElementById('fatLevelInput').value) || 0;
    
    const targetProteinG = proteinLevel * userWeight;
    const targetFatG = fatLevel * userWeight;
    const proteinCalories = targetProteinG * 4;
    const fatCalories = targetFatG * 9;
    const remainingCalories = Math.max(0, goalCalories - proteinCalories - fatCalories);
    const targetCarbG = remainingCalories / 4;

    // Calculate actual percentages based on consumed calories
    const actualProteinPercentage = totals.calories > 0 ? (totals.protein / totals.calories) * 100 : 0;
    const actualFatPercentage = totals.calories > 0 ? (totals.fat / totals.calories) * 100 : 0;
    const actualCarbPercentage = totals.calories > 0 ? (totals.carbs / totals.calories) * 100 : 0;

    // Calculate actual protein level (g per kg body weight)
    const actualProteinLevel = userWeight > 0 ? totals.proteinG / userWeight : 0;
    const actualFatLevel = userWeight > 0 ? (totals.fat / 9) / userWeight : 0; // Convert fat calories to grams, then to g/kg

    // Update second row elements
    const mealProteinLevel = document.getElementById('mealProteinLevel');
    const mealProteinPercentage = document.getElementById('mealProteinPercentage');
    const mealProtein = document.getElementById('mealProtein');
    const mealProteinCal = document.getElementById('mealProteinCal');
    const mealFatLevel = document.getElementById('mealFatLevel');
    const mealFatPercentage = document.getElementById('mealFatPercentage');
    const mealFat = document.getElementById('mealFat');
    const mealFatCal = document.getElementById('mealFatCal');
    const mealCarbPercentage = document.getElementById('mealCarbPercentage');
    const mealCarb = document.getElementById('mealCarb');
    const mealCarbCal = document.getElementById('mealCarbCal');
    const mealGoal = document.getElementById('mealGoal');

    if (mealProteinLevel) mealProteinLevel.textContent = actualProteinLevel.toFixed(1);
    if (mealProteinPercentage) mealProteinPercentage.textContent = actualProteinPercentage.toFixed(1);
    if (mealProtein) mealProtein.textContent = totals.proteinG.toFixed(1);
    if (mealProteinCal) mealProteinCal.textContent = totals.protein.toFixed(1);
    if (mealFatLevel) mealFatLevel.textContent = actualFatLevel.toFixed(1);
    if (mealFatPercentage) mealFatPercentage.textContent = actualFatPercentage.toFixed(1);
    if (mealFat) mealFat.textContent = (totals.fat / 9).toFixed(1); // Convert calories to grams
    if (mealFatCal) mealFatCal.textContent = totals.fat.toFixed(1);
    if (mealCarbPercentage) mealCarbPercentage.textContent = actualCarbPercentage.toFixed(1);
    if (mealCarb) mealCarb.textContent = (totals.carbs / 4).toFixed(1); // Convert calories to grams
    if (mealCarbCal) mealCarbCal.textContent = totals.carbs.toFixed(1);
    if (mealGoal) {
        mealGoal.textContent = totals.calories.toFixed(1);
        
        // Color coding based on goal achievement
        const goalDifference = Math.abs(totals.calories - goalCalories);
        const goalPercentageDiff = goalCalories > 0 ? (goalDifference / goalCalories) * 100 : 0;
        
        if (goalPercentageDiff <= GOAL_GREEN_THRESHOLD) {
            mealGoal.style.backgroundColor = '#d4edda'; // Green
            mealGoal.style.border = '1px solid #c3e6cb';
        } else if (goalPercentageDiff <= GOAL_YELLOW_THRESHOLD) {
            mealGoal.style.backgroundColor = '#fff3cd'; // Yellow
            mealGoal.style.border = '1px solid #ffeaa7';
        } else {
            mealGoal.style.backgroundColor = '#f8d7da'; // Red
            mealGoal.style.border = '1px solid #f5c6cb';
        }
    }
}