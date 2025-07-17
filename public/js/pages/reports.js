class NutritionReports {
    constructor() {
        this.settings = null;
        this.weeklyData = {};
        this.charts = {};
        this.init();
    }

    async init() {
        await this.loadSettings();
        await this.loadWeeklyData();
        this.generateWeeklyReport();
    }

    async loadSettings() {
        try {
            const response = await fetch('/api/settings');
            if (!response.ok) throw new Error('Failed to load settings');
            this.settings = await response.json();
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async loadWeeklyData() {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        
        for (const day of days) {
            try {
                const response = await fetch(`/api/daily-meals/${day}`);
                if (!response.ok) throw new Error(`Failed to load ${day} data`);
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
            const goalCalories = this.settings?.totalCalories || 2700;
            const proteinTarget = (this.settings?.weight || 70) * 1.9; // Default 1.9g/kg
            
            // Calculate goal achievement percentage
            const calorieAchievement = goalCalories > 0 ? (totals.calories / goalCalories) * 100 : 0;
            
            // Determine status
            let status = 'needs-improvement';
            if (calorieAchievement >= 95 && calorieAchievement <= 105) {
                status = 'excellent';
            } else if (calorieAchievement >= 85 && calorieAchievement <= 115) {
                status = 'good';
            }

            return {
                day: dayNames[index],
                dayKey: day,
                ...totals,
                goalCalories,
                proteinTarget,
                calorieAchievement,
                status
            };
        });
    }

    updateAchievementStats(weeklyTotals) {
        const totalCalories = weeklyTotals.reduce((sum, day) => sum + day.calories, 0);
        const avgDailyCalories = totalCalories / 7;
        const goalCalories = this.settings?.totalCalories || 2700;
        const goalAchievement = goalCalories > 0 ? (avgDailyCalories / goalCalories) * 100 : 0;
        
        const proteinTarget = (this.settings?.weight || 70) * 1.9;
        const avgProtein = weeklyTotals.reduce((sum, day) => sum + day.protein + day.proteinG, 0) / 7;
        const proteinAchievement = proteinTarget > 0 ? (avgProtein / proteinTarget) * 100 : 0;
        
        const daysOnTrack = weeklyTotals.filter(day => 
            day.calorieAchievement >= 95 && day.calorieAchievement <= 105
        ).length;
        const daysOnTrackPercentage = (daysOnTrack / 7) * 100;

        // Update text content
        document.getElementById('avgDailyCalories').textContent = `${Math.round(avgDailyCalories)} kcal`;
        document.getElementById('goalAchievement').textContent = `${goalAchievement.toFixed(1)}%`;
        document.getElementById('proteinAchievement').textContent = `${proteinAchievement.toFixed(1)}%`;
        document.getElementById('daysOnTrack').textContent = `${daysOnTrack}/7 days`;

        // Apply performance-based styling
        this.applyAchievementStyling(avgDailyCalories, goalAchievement, proteinAchievement, daysOnTrackPercentage);
    }

    applyAchievementStyling(avgCalories, goalAchievement, proteinAchievement, daysOnTrackPercentage) {
        // Get all stat items
        const statItems = document.querySelectorAll('.achievement-stats .stat-item');
        
        if (statItems.length >= 4) {
            // Clear existing performance classes
            statItems.forEach(item => {
                item.classList.remove('excellent', 'good', 'needs-improvement', 'neutral');
            });

            // Apply classes based on performance criteria
            
            // 1. Avg Daily Calories - based on whether there's data
            const caloriesClass = avgCalories > 0 ? 'neutral' : 'neutral';
            statItems[0].classList.add(caloriesClass);

            // 2. Goal Achievement - 95-105% excellent, 85-115% good, else needs improvement
            let goalClass = 'neutral';
            if (goalAchievement >= 95 && goalAchievement <= 105) {
                goalClass = 'excellent';
            } else if (goalAchievement >= 85 && goalAchievement <= 115) {
                goalClass = 'good';
            } else if (goalAchievement > 0) {
                goalClass = 'needs-improvement';
            }
            statItems[1].classList.add(goalClass);

            // 3. Protein Achievement - 90-110% excellent, 80-120% good, else needs improvement
            let proteinClass = 'neutral';
            if (proteinAchievement >= 90 && proteinAchievement <= 110) {
                proteinClass = 'excellent';
            } else if (proteinAchievement >= 80 && proteinAchievement <= 120) {
                proteinClass = 'good';
            } else if (proteinAchievement > 0) {
                proteinClass = 'needs-improvement';
            }
            statItems[2].classList.add(proteinClass);

            // 4. Days On Track - 6-7 days excellent, 4-5 days good, else needs improvement
            let daysClass = 'neutral';
            if (daysOnTrackPercentage >= 85.7) { // 6-7 days (85.7% = 6/7)
                daysClass = 'excellent';
            } else if (daysOnTrackPercentage >= 57.1) { // 4-5 days (57.1% = 4/7)
                daysClass = 'good';
            } else if (daysOnTrackPercentage > 0) {
                daysClass = 'needs-improvement';
            }
            statItems[3].classList.add(daysClass);
        }
    }

    createWeeklyCaloriesChart(weeklyTotals) {
        const ctx = document.getElementById('weeklyCaloriesChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.weeklyCalories) {
            this.charts.weeklyCalories.destroy();
        }

        const goalCalories = this.settings?.totalCalories || 2700;
        
        this.charts.weeklyCalories = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: weeklyTotals.map(day => day.day.slice(0, 3)), // Sun, Mon, etc.
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
                        label: 'Goal',
                        data: new Array(7).fill(goalCalories),
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
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    title: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Calories'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Day of Week'
                        }
                    }
                }
            }
        });
    }

    updateWeeklyMacroTable(weeklyTotals) {
        const tbody = document.querySelector('#weeklyMacroTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        weeklyTotals.forEach(day => {
            const row = document.createElement('tr');
            
            const statusText = {
                'excellent': 'Excellent',
                'good': 'Good',
                'needs-improvement': 'Needs Improvement'
            };

            row.innerHTML = `
                <td><strong>${day.day}</strong></td>
                <td>${Math.round(day.calories)}</td>
                <td>${(day.protein + day.proteinG).toFixed(1)}</td>
                <td>${day.fat.toFixed(1)}</td>
                <td>${day.carbs.toFixed(1)}</td>
                <td><span class="status-badge status-${day.status}">${statusText[day.status]}</span></td>
            `;
            
            tbody.appendChild(row);
        });
    }
}

// Initialize reports when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NutritionReports();
}); 