// Nutrition Reports Manager
class NutritionReports {
    constructor() {
        this.settings = null;
        this.weeklyData = {};
        this.charts = {};
        this.initialized = false;
    }

    async init() {
        if (this.initialized) {
            console.log('NutritionReports already initialized, skipping');
            return;
        }

        try {
            console.log('Initializing NutritionReports...');
            await this.loadSettings();
            await this.loadWeeklyData();
            this.generateWeeklyReport();
            this.initialized = true;
            console.log('NutritionReports initialized successfully');
        } catch (error) {
            console.error('NutritionReports: Initialization failed:', error);
            this.initialized = false; // Reset on failure
        }
    }

    async loadSettings() {
        try {
            const response = await API.settings.get();
            this.settings = await response.json();
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async loadWeeklyData() {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

        for (const day of days) {
            try {
                const response = await API.meals.get(day);
                this.weeklyData[day] = await response.json();
            } catch (error) {
                console.error(`Error loading ${day} data:`, error);
                this.weeklyData[day] = { meals: [] };
            }
        }
    }

    calculateDayTotals(dayData) {
        let totals = {
            calories: 0,
            carbs: 0,
            protein: 0,
            fat: 0,
            proteinG: 0
        };

        if (!dayData.meals) return totals;

        dayData.meals.forEach(meal => {
            if (meal.items) {
                meal.items.forEach(item => {
                    totals.calories += parseFloat(item.calories) || 0;
                    totals.carbs += parseFloat(item.carbs) || 0;
                    totals.protein += parseFloat(item.protein) || 0;
                    totals.fat += parseFloat(item.fat) || 0;
                    totals.proteinG += parseFloat(item.proteinG) || 0;
                });
            }
        });

        return totals;
    }

    generateWeeklyReport() {
        const weeklyTotals = this.calculateWeeklyTotals();
        this.updateAchievementStats(weeklyTotals);
        this.createWeeklyCaloriesChart(weeklyTotals);
        this.updateWeeklyMacroTable(weeklyTotals);
    }   
 calculateWeeklyTotals() {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        return days.map((day, index) => {
            const totals = this.calculateDayTotals(this.weeklyData[day]);

            // Get daily macro settings for this day
            const dayData = this.weeklyData[day];
            const baseGoalCalories = this.settings?.totalCalories || 2700;
            const dailyAdjustment = dayData.calorieAdjustment || 0;
            const goalCalories = baseGoalCalories + dailyAdjustment;

            // Get daily protein level for this day
            const dailyProteinLevel = dayData.proteinLevel || 0;
            const proteinTarget = (this.settings?.weight || 70) * dailyProteinLevel;

            const calorieAchievement = goalCalories > 0 ? (totals.calories / goalCalories) * 100 : 0;

            let status = 'needs-improvement';
            if (calorieAchievement >= 95 && calorieAchievement <= 105) {
                status = 'excellent';
            } else if (calorieAchievement >= 90 && calorieAchievement <= 110) {
                status = 'good';
            }

            return {
                day: dayNames[index],
                dayKey: day,
                ...totals,
                goalCalories,
                proteinTarget,
                calorieAchievement,
                status,
                dailyAdjustment
            };
        });
    }

    updateAchievementStats(weeklyTotals) {
        const totalCalories = weeklyTotals.reduce((sum, day) => sum + day.calories, 0);
        const avgDailyCalories = totalCalories / 7;

        // Calculate average goal based on daily goals
        const totalGoalCalories = weeklyTotals.reduce((sum, day) => sum + day.goalCalories, 0);
        const avgGoalCalories = totalGoalCalories / 7;
        const goalAchievement = avgGoalCalories > 0 ? (avgDailyCalories / avgGoalCalories) * 100 : 0;

        // Calculate average protein target based on daily protein levels
        const totalProteinTarget = weeklyTotals.reduce((sum, day) => sum + day.proteinTarget, 0);
        const avgProteinTarget = totalProteinTarget / 7;
        const avgProtein = weeklyTotals.reduce((sum, day) => sum + day.protein + day.proteinG, 0) / 7;
        const proteinAchievement = avgProteinTarget > 0 ? (avgProtein / avgProteinTarget) * 100 : 0;

        // Calculate average fat target based on daily fat levels
        const userWeight = this.settings?.weight || 70;
        let totalFatTarget = 0;
        let totalFat = 0;

        weeklyTotals.forEach(day => {
            const dayData = this.weeklyData[day.dayKey] || {};
            const dailyFatLevel = dayData.fatLevel || 0;
            const fatTarget = userWeight * dailyFatLevel;
            totalFatTarget += fatTarget;
            totalFat += day.fat;
        });

        const avgFatTarget = totalFatTarget / 7;
        const avgFat = totalFat / 7;
        const fatAchievement = avgFatTarget > 0 ? (avgFat / avgFatTarget) * 100 : 0;

        // Calculate average carb target based on remaining calories after protein and fat targets
        let totalCarbTarget = 0;
        let totalCarbs = 0;

        weeklyTotals.forEach(day => {
            const dayData = this.weeklyData[day.dayKey] || {};
            const dailyFatLevel = dayData.fatLevel || 0;
            const fatTarget = userWeight * dailyFatLevel;

            const targetProteinCalories = day.proteinTarget * 4;
            const targetFatCalories = fatTarget * 9;
            const remainingCalories = Math.max(0, day.goalCalories - targetProteinCalories - targetFatCalories);
            const carbTarget = remainingCalories / 4;

            totalCarbTarget += carbTarget;
            totalCarbs += day.carbs;
        });

        const avgCarbTarget = totalCarbTarget / 7;
        const avgCarbs = totalCarbs / 7;
        const carbsAchievement = avgCarbTarget > 0 ? (avgCarbs / avgCarbTarget) * 100 : 0;

        const daysOnTrack = weeklyTotals.filter(day =>
            day.calorieAchievement >= 95 && day.calorieAchievement <= 105
        ).length;

        document.getElementById('avgDailyCalories').textContent = `${Math.round(avgDailyCalories)} kcal`;
        document.getElementById('goalAchievement').textContent = `${goalAchievement.toFixed(1)}%`;
        document.getElementById('proteinAchievement').textContent = `${proteinAchievement.toFixed(1)}%`;
        document.getElementById('fatAchievement').textContent = `${fatAchievement.toFixed(1)}%`;
        document.getElementById('carbsAchievement').textContent = `${carbsAchievement.toFixed(1)}%`;
        document.getElementById('daysOnTrack').textContent = `${daysOnTrack}/7 days`;
    }

    createWeeklyCaloriesChart(weeklyTotals) {
        const ctx = document.getElementById('weeklyCaloriesChart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.charts.weeklyCalories) {
            this.charts.weeklyCalories.destroy();
            this.charts.weeklyCalories = null;
        }

        // Also check for any existing Chart.js instance on this canvas
        const existingChart = Chart.getChart(ctx);
        if (existingChart) {
            existingChart.destroy();
        }

        this.charts.weeklyCalories = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: weeklyTotals.map(day => day.day.slice(0, 3)),
                datasets: [
                    {
                        label: 'Actual Calories',
                        data: weeklyTotals.map(day => day.calories),
                        backgroundColor: weeklyTotals.map(day => {
                            if (day.status === 'excellent') return 'rgba(40, 167, 69, 0.8)';
                            if (day.status === 'good') return 'rgba(255, 193, 7, 0.8)';
                            return 'rgba(220, 53, 69, 0.8)';
                        }),
                        borderColor: weeklyTotals.map(day => {
                            if (day.status === 'excellent') return 'rgba(40, 167, 69, 1)';
                            if (day.status === 'good') return 'rgba(255, 193, 7, 1)';
                            return 'rgba(220, 53, 69, 1)';
                        }),
                        borderWidth: 2
                    },
                    {
                        label: 'Daily Goals',
                        data: weeklyTotals.map(day => day.goalCalories),
                        type: 'line',
                        borderColor: 'rgba(26, 115, 232, 1)',
                        backgroundColor: 'rgba(26, 115, 232, 0.1)',
                        borderWidth: 3,
                        pointRadius: 5,
                        pointBackgroundColor: 'rgba(26, 115, 232, 1)'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Calories' }
                    }
                }
            }
        });

        // Add resize listener for proper chart resizing
        this.setupResizeListener();
    }

    setupResizeListener() {
        // Debounce resize events to avoid excessive calls
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (this.charts.weeklyCalories) {
                    this.charts.weeklyCalories.resize();
                }
            }, 250);
        });
    }

    updateWeeklyMacroTable(weeklyTotals) {
        const tbody = document.querySelector('#weeklyMacroTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        weeklyTotals.forEach(day => {
            const statusText = {
                'excellent': 'Excellent',
                'good': 'Good',
                'needs-improvement': 'Needs Improvement'
            };

            // Calculate macro achievement percentages
            const totalProtein = day.protein + day.proteinG;
            const proteinAchievement = day.proteinTarget > 0 ? (totalProtein / day.proteinTarget) * 100 : 0;

            // For fat and carbs, we need to calculate targets based on daily macro settings
            // Get the daily macro data to calculate fat and carb targets
            const dayData = this.weeklyData[day.dayKey] || {};
            const userWeight = this.settings?.weight || 70;
            const dailyFatLevel = dayData.fatLevel || 0;
            const fatTarget = userWeight * dailyFatLevel;
            const fatAchievement = fatTarget > 0 ? (day.fat / fatTarget) * 100 : 0;

            // For carbs, calculate remaining calories after TARGET protein and fat (not actual consumed)
            // This should match the diary.html calculation which uses target values
            const targetProteinCalories = day.proteinTarget * 4;
            const targetFatCalories = fatTarget * 9;
            const remainingCalories = Math.max(0, day.goalCalories - targetProteinCalories - targetFatCalories);
            const carbTarget = remainingCalories / 4;

            const carbAchievement = carbTarget > 0 ? (day.carbs / carbTarget) * 100 : 0;

            // Helper function to get status class based on achievement percentage
            const getStatusClass = (achievement) => {
                if (achievement >= 95 && achievement <= 105) return 'status-excellent';
                if (achievement >= 90 && achievement <= 110) return 'status-good';
                return 'status-needs-improvement';
            };

            // Calculate calorie achievement percentage
            const calorieAchievement = day.goalCalories > 0 ? (day.calories / day.goalCalories) * 100 : 0;

            // Calculate overall status based on all macro achievements
            const macroAchievements = [
                { name: 'calories', value: calorieAchievement, hasTarget: day.goalCalories > 0 },
                { name: 'protein', value: proteinAchievement, hasTarget: day.proteinTarget > 0 },
                { name: 'fat', value: fatAchievement, hasTarget: fatTarget > 0 },
                { name: 'carbs', value: carbAchievement, hasTarget: carbTarget > 0 }
            ];

            // Only consider macros that have targets set
            const macrosWithTargets = macroAchievements.filter(macro => macro.hasTarget);

            let overallStatus = 'needs-improvement';
            if (macrosWithTargets.length > 0) {
                const excellentCount = macrosWithTargets.filter(macro =>
                    macro.value >= 95 && macro.value <= 105
                ).length;

                const goodCount = macrosWithTargets.filter(macro =>
                    macro.value >= 90 && macro.value <= 110
                ).length;

                const redCount = macrosWithTargets.filter(macro =>
                    macro.value < 90 || macro.value > 110
                ).length;

                // Determine overall status
                if (excellentCount === macrosWithTargets.length) {
                    overallStatus = 'excellent'; // All macros are excellent
                } else if (redCount === 0 && goodCount >= macrosWithTargets.length * 0.7) {
                    overallStatus = 'good'; // No red macros and at least 70% are good/excellent
                } else {
                    overallStatus = 'needs-improvement'; // Has red macros or too many yellows
                }
            }

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${day.day}</strong></td>
                <td>
                    ${day.calories > 0 ?
                    `<span class="status-badge ${getStatusClass(calorieAchievement)}">${Math.round(day.calories)} / ${Math.round(day.goalCalories)} (${calorieAchievement.toFixed(0)}%)${day.dailyAdjustment !== 0 ? ` (${day.dailyAdjustment > 0 ? '+' : ''}${day.dailyAdjustment})` : ''}</span>` :
                    `${Math.round(day.calories)} / ${Math.round(day.goalCalories)}${day.dailyAdjustment !== 0 ? ` (${day.dailyAdjustment > 0 ? '+' : ''}${day.dailyAdjustment})` : ''}`
                }
                </td>
                <td>
                    ${totalProtein > 0 && day.proteinTarget > 0 ?
                    `<span class="status-badge ${getStatusClass(proteinAchievement)}">${totalProtein.toFixed(1)} / ${Math.round(day.proteinTarget)} (${proteinAchievement.toFixed(0)}%)</span>` :
                    `${totalProtein.toFixed(1)} / ${Math.round(day.proteinTarget)}`
                }
                </td>
                <td>
                    ${fatTarget > 0 && day.fat > 0 ?
                    `<span class="status-badge ${getStatusClass(fatAchievement)}">${day.fat.toFixed(1)} / ${fatTarget.toFixed(1)} (${fatAchievement.toFixed(0)}%)</span>` :
                    fatTarget > 0 ? `${day.fat.toFixed(1)} / ${fatTarget.toFixed(1)}` : `${day.fat.toFixed(1)}`
                }
                </td>
                <td>
                    ${carbTarget > 0 && day.carbs > 0 ?
                    `<span class="status-badge ${getStatusClass(carbAchievement)}">${day.carbs.toFixed(1)} / ${carbTarget.toFixed(1)} (${carbAchievement.toFixed(0)}%)</span>` :
                    carbTarget > 0 ? `${day.carbs.toFixed(1)} / ${carbTarget.toFixed(1)}` : `${day.carbs.toFixed(1)}`
                }
                </td>
                <td><span class="status-badge status-${overallStatus}">${statusText[overallStatus]}</span></td>
            `;
            tbody.appendChild(row);
        });
    }
}

// Export for use in other modules
window.NutritionReports = NutritionReports;