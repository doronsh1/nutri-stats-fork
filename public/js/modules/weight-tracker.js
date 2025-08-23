// Weight Tracker Manager
class WeightTracker {
    constructor() {
        this.weightData = [];
        this.settings = null;
        this.chart = null;
        this.initialized = false;
        this.isMetricSystem = true; // Default to metric
        this.weightUnit = 'kg'; // Default unit
    }

    async init() {
        if (this.initialized) {
            console.log('WeightTracker already initialized, skipping');
            return;
        }

        try {
            console.log('Initializing WeightTracker...');
            await this.loadSettings();
            this.updateUnitSystem();
            await this.loadWeightData();
            this.setupEventListeners();
            this.updateWeightStatistics();
            this.createWeightChart();
            this.updateWeightTable();
            this.initialized = true;
            console.log('WeightTracker initialized successfully');
        } catch (error) {
            console.error('WeightTracker: Initialization failed:', error);
            this.initialized = false; // Reset on failure
        }
    }

    async loadSettings() {
        try {
            const response = await API.settings.get();
            this.settings = await response.json();
            this.isMetricSystem = this.settings.unitSystem === 'metric';
            console.log('Weight: Unit system loaded -', this.isMetricSystem ? 'Metric' : 'Imperial');
        } catch (error) {
            console.error('Error loading settings:', error);
            this.isMetricSystem = true; // Default to metric
        }
    }

    updateUnitSystem() {
        const unitDisplay = document.getElementById('weightUnitDisplay');
        if (unitDisplay) {
            if (this.isMetricSystem) {
                unitDisplay.textContent = 'kg';
                this.weightUnit = 'kg';
            } else {
                unitDisplay.textContent = 'lb';
                this.weightUnit = 'lb';
            }
            console.log('Weight unit system updated:', this.weightUnit);
        }
    }

    async loadWeightData() {
        try {
            const response = await API.weight.getAll();
            const data = await response.json();
            this.weightData = data.entries || [];
        } catch (error) {
            console.error('Error loading weight data:', error);
            this.weightData = [];
        }
    }

    setupEventListeners() {
        const weightForm = document.getElementById('weightForm');
        const weightDate = document.getElementById('weightDate');

        // Set today's date as default
        if (weightDate) {
            weightDate.value = new Date().toISOString().split('T')[0];
        }

        // Handle form submission
        if (weightForm) {
            weightForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleWeightSubmit();
            });
        }
    }

    async handleWeightSubmit() {
        const date = document.getElementById('weightDate').value;
        const weight = document.getElementById('weightValue').value;
        const note = document.getElementById('weightNote').value;

        if (!date || !weight) {
            alert('Please fill in date and weight');
            return;
        }

        try {
            const entry = { date, weight: parseFloat(weight), note };
            await API.weight.add(entry);
            await this.refreshWeightData();
            this.resetForm();
        } catch (error) {
            console.error('Error saving weight entry:', error);
            alert('Error saving weight entry');
        }
    }

    async refreshWeightData() {
        await this.loadWeightData();
        this.updateWeightStatistics();
        this.updateWeightChart();
        this.updateWeightTable();
    }

    resetForm() {
        document.getElementById('weightForm').reset();
        document.getElementById('weightDate').value = new Date().toISOString().split('T')[0];
    }

    updateWeightStatistics() {
        const currentWeight = this.weightData.length > 0 ? this.weightData[0].weight : 0;
        const latestWeightChange = this.calculateLatestWeightChange();
        const weightChange = this.calculateWeightChange();
        const avgWeightChange = this.calculateAvgWeightChange();
        const trend = this.calculateTrend();

        document.getElementById('currentWeight').textContent = currentWeight ? `${currentWeight.toFixed(1)} ${this.weightUnit}` : 'No data';
        document.getElementById('latestWeightChange').textContent = latestWeightChange !== null ? `${latestWeightChange > 0 ? '+' : ''}${latestWeightChange.toFixed(1)} ${this.weightUnit}` : 'No data';
        document.getElementById('weightChange').textContent = weightChange ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} ${this.weightUnit}` : 'No change';
        document.getElementById('avgWeightChange').textContent = avgWeightChange ? `${avgWeightChange > 0 ? '+' : ''}${avgWeightChange.toFixed(1)} ${this.weightUnit}/week` : 'No data';
        document.getElementById('weightTrend').textContent = trend;
    }

    calculateLatestWeightChange() {
        if (this.weightData.length < 2) return null;
        return this.weightData[0].weight - this.weightData[1].weight;
    }

    calculateWeightChange() {
        if (this.weightData.length < 2) return 0;
        return this.weightData[0].weight - this.weightData[this.weightData.length - 1].weight;
    }

    calculateTotalWeightChange() {
        if (this.weightData.length < 2) return 0;
        // Calculate difference between current weight (first entry) and starting weight (last entry)
        const currentWeight = this.weightData[0].weight;
        const startingWeight = this.weightData[this.weightData.length - 1].weight;
        return currentWeight - startingWeight;
    }

    calculateAvgWeightChange() {
        if (this.weightData.length < 2) return 0;

        // Calculate actual days between first and last entry
        const firstEntry = this.weightData[this.weightData.length - 1]; // Oldest entry
        const lastEntry = this.weightData[0]; // Most recent entry

        const firstDate = new Date(firstEntry.date);
        const lastDate = new Date(lastEntry.date);
        const totalDays = Math.abs((lastDate - firstDate) / (1000 * 60 * 60 * 24)); // Convert milliseconds to days

        if (totalDays === 0) return 0; // Same day entries

        const totalChange = this.calculateTotalWeightChange();

        // Calculate average change per week (7 days)
        const avgPerDay = totalChange / totalDays;
        return avgPerDay * 7; // Weekly average
    }

    calculateTrend() {
        if (this.weightData.length < 3) return 'Insufficient data';

        const recent = this.weightData.slice(0, 3);
        const total = recent.reduce((sum, entry) => sum + entry.weight, 0);
        const average = total / recent.length;
        const latest = recent[0].weight;

        if (latest > average + 0.5) return '↗️ Increasing';
        if (latest < average - 0.5) return '↘️ Decreasing';
        return '↔️ Stable';
    }

    createWeightChart() {
        const ctx = document.getElementById('weightChart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }

        // Also check for any existing Chart.js instance on this canvas
        const existingChart = Chart.getChart(ctx);
        if (existingChart) {
            existingChart.destroy();
        }

        const chartData = this.weightData.slice().reverse();
        const labels = chartData.map(entry => new Date(entry.date).toLocaleDateString());
        const weights = chartData.map(entry => entry.weight);

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `Weight (${this.weightUnit})`,
                    data: weights,
                    borderColor: 'rgba(26, 115, 232, 1)',
                    backgroundColor: 'rgba(26, 115, 232, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 6,
                    pointBackgroundColor: 'rgba(26, 115, 232, 1)',
                    pointBorderColor: 'white',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        title: { display: true, text: `Weight (${this.weightUnit})` }
                    },
                    x: {
                        title: { display: true, text: 'Date' },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 0,
                            maxTicksLimit: 10
                        }
                    }
                }
            }
        });

        // Add resize listener for proper chart resizing
        this.setupWeightChartResizeListener();
    }

    async refreshSettings() {
        await this.loadSettings();
        this.updateUnitSystem();
        this.updateWeightStatistics();
        this.createWeightChart();
        this.updateWeightTable();
        console.log('Weight: Settings refreshed');
    }

    setupWeightChartResizeListener() {
        // Debounce resize events to avoid excessive calls
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (this.chart) {
                    this.chart.resize();
                }
            }, 250);
        });
    }

    updateWeightChart() {
        if (!this.chart) return;

        const chartData = this.weightData.slice().reverse();
        const labels = chartData.map(entry => new Date(entry.date).toLocaleDateString());
        const weights = chartData.map(entry => entry.weight);

        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = weights;
        this.chart.update();
    }

    updateWeightTable() {
        const tbody = document.querySelector('#weightEntriesTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.weightData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No weight entries yet. Add your first entry above.</td></tr>';
            return;
        }

        this.weightData.forEach((entry, index) => {
            const row = document.createElement('tr');
            row.setAttribute('data-entry-id', entry.id);

            const change = index < this.weightData.length - 1 ?
                entry.weight - this.weightData[index + 1].weight : 0;

            const changeText = change !== 0 ?
                `${change > 0 ? '+' : ''}${change.toFixed(1)} ${this.weightUnit}` : '-';

            const changeClass = change > 0 ? 'text-danger' : change < 0 ? 'text-success' : '';

            row.innerHTML = `
                <td>
                    <span class="weight-value">${new Date(entry.date).toLocaleDateString()}</span>
                    <input type="date" class="form-control weight-edit d-none" value="${entry.date}">
                </td>
                <td>
                    <span class="weight-value">${entry.weight.toFixed(1)} ${this.weightUnit}</span>
                    <div class="input-group weight-edit d-none">
                        <input type="number" class="form-control weight-edit" value="${entry.weight}" step="0.1" min="0">
                        <span class="input-group-text">${this.weightUnit}</span>
                    </div>
                </td>
                <td class="${changeClass}">${changeText}</td>
                <td>
                    <span class="weight-value">${entry.note || '-'}</span>
                    <input type="text" class="form-control weight-edit d-none" value="${entry.note || ''}" placeholder="Note">
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button type="button" class="btn btn-outline-primary edit-btn">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button type="button" class="btn btn-outline-success save-btn d-none">
                            <i class="bi bi-check"></i>
                        </button>
                        <button type="button" class="btn btn-outline-secondary cancel-btn d-none">
                            <i class="bi bi-x"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger delete-btn">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            `;

            tbody.appendChild(row);

            // Add event listeners for this row
            const editBtn = row.querySelector('.edit-btn');
            const saveBtn = row.querySelector('.save-btn');
            const cancelBtn = row.querySelector('.cancel-btn');
            const deleteBtn = row.querySelector('.delete-btn');

            editBtn.addEventListener('click', () => this.handleEditInline(row));
            saveBtn.addEventListener('click', () => this.handleSaveInline(row));
            cancelBtn.addEventListener('click', () => this.handleCancelInline(row));
            deleteBtn.addEventListener('click', () => this.deleteEntry(entry.id));
        });
    }

    // Handle inline editing
    handleEditInline(row) {
        // Hide all other edit forms if any are open
        document.querySelectorAll('tr.editing').forEach(editingRow => {
            if (editingRow !== row) {
                this.handleCancelInline(editingRow);
            }
        });

        // Show edit form
        row.classList.add('editing');
        row.querySelectorAll('.weight-value').forEach(span => span.classList.add('d-none'));
        row.querySelectorAll('.weight-edit').forEach(input => input.classList.remove('d-none'));
        row.querySelector('.edit-btn').classList.add('d-none');
        row.querySelector('.save-btn').classList.remove('d-none');
        row.querySelector('.cancel-btn').classList.remove('d-none');
    }

    // Handle saving inline edit
    async handleSaveInline(row) {
        const entryId = row.getAttribute('data-entry-id');

        // Select inputs by their type for more reliability
        const dateInput = row.querySelector('input[type="date"]');
        const weightInput = row.querySelector('input[type="number"]');
        const noteInput = row.querySelector('input[type="text"]');

        const updatedEntry = {
            date: dateInput.value,
            weight: parseFloat(weightInput.value),
            note: noteInput.value
        };

        // Validate data
        if (!updatedEntry.date || !updatedEntry.weight || updatedEntry.weight <= 0) {
            alert('Please enter valid date and weight values');
            return;
        }

        try {
            await API.weight.update(entryId, updatedEntry);
            await this.refreshWeightData();
        } catch (error) {
            console.error('Error updating weight entry:', error);
            alert('Error updating weight entry. Please try again.');
            this.handleCancelInline(row);
        }
    }

    // Handle canceling inline edit
    handleCancelInline(row) {
        row.classList.remove('editing');
        row.querySelectorAll('.weight-value').forEach(span => span.classList.remove('d-none'));
        row.querySelectorAll('.weight-edit').forEach(input => input.classList.add('d-none'));
        row.querySelector('.edit-btn').classList.remove('d-none');
        row.querySelector('.save-btn').classList.add('d-none');
        row.querySelector('.cancel-btn').classList.add('d-none');
    }

    async deleteEntry(id) {
        if (!confirm('Are you sure you want to delete this weight entry?')) return;

        // Find the row being deleted for immediate feedback
        const row = document.querySelector(`tr[data-entry-id="${id}"]`);
        if (row) {
            row.style.opacity = '0.5';
            row.style.pointerEvents = 'none';
        }

        try {
            await API.weight.delete(id);

            // Immediate UI update - remove the row
            if (row) {
                row.remove();
            }

            // Update local data
            this.weightData = this.weightData.filter(entry => entry.id !== id);

            // Update statistics and chart with existing data
            this.updateWeightStatistics();
            this.updateWeightChart();

            // Show empty state if no entries left
            if (this.weightData.length === 0) {
                const tbody = document.querySelector('#weightEntriesTable tbody');
                if (tbody) {
                    tbody.innerHTML = '<tr><td colspan="5" class="text-center">No weight entries yet. Add your first entry above.</td></tr>';
                }
            }

        } catch (error) {
            console.error('Error deleting weight entry:', error);
            alert('Error deleting weight entry');

            // Restore the row if delete failed
            if (row) {
                row.style.opacity = '1';
                row.style.pointerEvents = 'auto';
            }
        }
    }
}

// Export for use in other modules
window.WeightTracker = WeightTracker;