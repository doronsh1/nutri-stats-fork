class UserSettings {
    constructor() {
        this.form = document.getElementById('userSettingsForm');
        this.bmrValue = document.getElementById('bmrValue');
        this.totalCalories = document.getElementById('totalCalories');
        this.weeklyCalories = document.getElementById('weeklyCalories');
        this.saveButton = this.form.querySelector('button[type="submit"]');
        this.unitSystem = document.getElementById('unitSystem');
        this.weightUnit = document.querySelector('.unit-weight');
        this.heightUnit = document.querySelector('.unit-height');
        this.userDisplay = document.getElementById('userDisplay');
        this.setupEventListeners();
        this.loadSettings();
    }

    setupEventListeners() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSettings();
        });

        // Update calculations and button state when any input changes
        ['userName', 'sex', 'age', 'weight', 'height', 'activityLevel', 'calorieAdjustment', 'mealInterval'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => {
                    if (id !== 'userName') {
                        this.updateCalculations();
                    }
                    this.setSaveButtonState(false);
                });
            }
        });

        // Handle unit system changes
        this.unitSystem.addEventListener('change', () => {
            this.updateUnitLabels();
            this.convertUnits();
            this.updateCalculations();
            this.setSaveButtonState(false);
        });
    }

    updateUnitLabels() {
        const isMetric = this.unitSystem.value === 'metric';
        this.weightUnit.textContent = isMetric ? 'kg' : 'lb';
        this.heightUnit.textContent = isMetric ? 'cm' : 'in';
    }

    convertUnits() {
        const isMetric = this.unitSystem.value === 'metric';
        const weightInput = document.getElementById('weight');
        const heightInput = document.getElementById('height');
        
        if (isMetric) {
            // Convert from imperial to metric
            weightInput.value = weightInput.value ? (parseFloat(weightInput.value) * 0.453592).toFixed(1) : '';
            heightInput.value = heightInput.value ? (parseFloat(heightInput.value) * 2.54).toFixed(1) : '';
        } else {
            // Convert from metric to imperial
            weightInput.value = weightInput.value ? (parseFloat(weightInput.value) * 2.20462).toFixed(1) : '';
            heightInput.value = heightInput.value ? (parseFloat(heightInput.value) / 2.54).toFixed(1) : '';
        }
    }

    getMetricValues() {
        const isMetric = this.unitSystem.value === 'metric';
        const weight = parseFloat(document.getElementById('weight').value);
        const height = parseFloat(document.getElementById('height').value);

        if (isMetric) {
            return { weight, height };
        } else {
            return {
                weight: weight * 0.453592, // lb to kg
                height: height * 2.54      // in to cm
            };
        }
    }

    calculateBMR(weight, height, age, sex) {
        if (sex === 'male') {
            return (13.397 * weight) + (4.799 * height) - (5.677 * age) + 88.362;
        } else {
            return (9.247 * weight) + (3.098 * height) - (4.330 * age) + 447.593;
        }
    }

    updateCalculations() {
        const formData = this.getFormData();
        if (!this.isValidData(formData)) return;

        const { weight, height } = this.getMetricValues();
        const bmr = this.calculateBMR(
            weight,
            height,
            parseInt(formData.age),
            formData.sex
        );

        const totalCals = (bmr * parseFloat(formData.activityLevel)) + parseInt(formData.calorieAdjustment);
        const weeklyCals = totalCals * 7;

        this.bmrValue.textContent = Math.round(bmr);
        this.totalCalories.textContent = Math.round(totalCals);
        this.weeklyCalories.textContent = Math.round(weeklyCals);
    }

    getFormData() {
        return {
            userName: document.getElementById('userName').value,
            unitSystem: this.unitSystem.value,
            sex: document.getElementById('sex').value,
            age: document.getElementById('age').value,
            weight: document.getElementById('weight').value,
            height: document.getElementById('height').value,
            activityLevel: document.getElementById('activityLevel').value,
            calorieAdjustment: document.getElementById('calorieAdjustment').value || '0',
            mealInterval: document.getElementById('mealInterval').value || '3'
        };
    }

    isValidData(data) {
        return data.age > 0 && data.weight > 0 && data.height > 0;
    }

    setSaveButtonState(saved) {
        if (saved) {
            this.saveButton.textContent = 'Saved ✓';
            this.saveButton.classList.remove('btn-primary');
            this.saveButton.classList.add('btn-success');
        } else {
            this.saveButton.textContent = 'Save Settings';
            this.saveButton.classList.remove('btn-success');
            this.saveButton.classList.add('btn-primary');
        }
    }

    async saveSettings() {
        const formData = this.getFormData();
        if (!this.isValidData(formData)) {
            this.saveButton.classList.add('btn-danger');
            this.saveButton.textContent = 'Invalid Data';
            setTimeout(() => this.setSaveButtonState(false), 2000);
            return;
        }

        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    bmr: parseFloat(this.bmrValue.textContent),
                    totalCalories: parseFloat(this.totalCalories.textContent),
                    weeklyCalories: parseFloat(this.weeklyCalories.textContent)
                })
            });

            if (!response.ok) throw new Error('Failed to save settings');
            
            // Update username display after successful save
            this.updateUserDisplay(formData.userName);
            this.setSaveButtonState(true);
        } catch (error) {
            console.error('Error saving settings:', error);
            this.saveButton.classList.add('btn-danger');
            this.saveButton.textContent = 'Error Saving';
            setTimeout(() => this.setSaveButtonState(false), 2000);
        }
    }

    updateUserDisplay(userName) {
        if (this.userDisplay) {
            this.userDisplay.textContent = userName || '';
        }
    }

    async loadSettings() {
        try {
            const response = await fetch('/api/settings');
            if (!response.ok) throw new Error('Failed to load settings');
            
            const settings = await response.json();
            this.populateForm(settings);
            this.updateUnitLabels();
            this.updateCalculations();
            this.updateUserDisplay(settings.userName);
            this.setSaveButtonState(true);
        } catch (error) {
            console.error('Error loading settings:', error);
            this.setSaveButtonState(false);
        }
    }

    populateForm(settings) {
        Object.entries(settings).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element) element.value = value;
        });
    }
}

// Initialize settings when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new UserSettings();
}); 