// Measurements Tracking Manager
class MeasurementsManager {
    constructor() {
        this.measurements = [];
        this.measurementTypes = ['Waist', 'Thigh', 'Arm']; // Predefined types
        this.currentMeasurementType = null;
        this.measurementChart = null;
        this.initialized = false;
        this.settings = null;
        this.isMetricSystem = true; // Default to metric
        this.defaultUnit = 'cm'; // Default unit
        this.boundHandleMeasurementSubmit = null; // Store bound handler
    }

    async init() {
        if (this.initialized) {
            console.log('MeasurementsManager already initialized, skipping');
            return;
        }

        try {
            console.log('Initializing MeasurementsManager...');
            await this.loadSettings();
            this.setupEventListeners();
            await this.loadAllMeasurements();
            this.setDefaultDate();
            this.updateUnitSystem();

            // Load Waist data by default
            await this.loadMeasurementTypeData('Waist');

            this.initialized = true;
            console.log('MeasurementsManager initialized successfully');
        } catch (error) {
            console.error('MeasurementsManager: Initialization failed:', error);
            this.initialized = false;
        }
    }

    setupEventListeners() {
        // Measurement form submission
        const measurementForm = document.getElementById('measurementForm');
        if (measurementForm) {
            console.log('📝 Attaching measurement form submit listener');
            // Remove any existing listeners first to prevent duplicates
            measurementForm.removeEventListener('submit', this.boundHandleMeasurementSubmit);
            // Bind the handler to preserve 'this' context
            this.boundHandleMeasurementSubmit = (e) => this.handleMeasurementSubmit(e);
            measurementForm.addEventListener('submit', this.boundHandleMeasurementSubmit);
        } else {
            console.error('❌ measurementForm element not found when setting up listeners');
        }

        // Measurement type selection
        const measurementTypeSelect = document.getElementById('measurementTypeSelect');
        if (measurementTypeSelect) {
            measurementTypeSelect.addEventListener('change', (e) => this.handleMeasurementTypeChange(e));
        }

        // Form measurement type selection
        const measurementTypeInput = document.getElementById('measurementTypeInput');
        if (measurementTypeInput) {
            measurementTypeInput.addEventListener('change', (e) => this.handleFormTypeChange(e));
        }
    }

    async loadSettings() {
        try {
            const response = await API.settings.get();
            this.settings = await response.json();
            this.isMetricSystem = this.settings.unitSystem === 'metric';
            console.log('Measurements: Unit system loaded -', this.isMetricSystem ? 'Metric' : 'Imperial');
        } catch (error) {
            console.error('Error loading settings for measurements:', error);
            this.isMetricSystem = true; // Default to metric
        }
    }

    updateUnitSystem() {
        const unitDisplay = document.getElementById('measurementUnitDisplay');
        if (!unitDisplay) return;

        // Set the unit display based on user's unit system
        if (this.isMetricSystem) {
            unitDisplay.textContent = 'cm';
            this.defaultUnit = 'cm';
        } else {
            unitDisplay.textContent = 'in';
            this.defaultUnit = 'in';
        }

        console.log('Unit system updated:', this.isMetricSystem ? 'Metric (cm)' : 'Imperial (in)');
    }

    setDefaultDate() {
        const dateInput = document.getElementById('measurementDate');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.value = today;
            console.log('📅 Set default date to:', today);
        } else {
            console.log('❌ measurementDate input not found');
        }
    }

    // Predefined measurement types - no need to load from API

    async loadAllMeasurements() {
        try {
            const response = await API.measurements.getAll();
            const data = await response.json();
            this.measurements = data.entries || [];
        } catch (error) {
            console.error('Error loading measurements:', error);
            this.measurements = [];
        }
    }

    async loadMeasurementsByType(measurementType) {
        try {
            const response = await API.measurements.getByType(measurementType);
            const data = await response.json();
            return data.entries || [];
        } catch (error) {
            console.error('Error loading measurements by type:', error);
            return [];
        }
    }

    async loadMeasurementStats(measurementType) {
        try {
            const response = await API.measurements.getStats(measurementType);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error loading measurement stats:', error);
            // Return empty stats object instead of null
            return {
                totalEntries: 0,
                minValue: 0,
                maxValue: 0,
                avgChange: 0,
                firstEntryDate: null,
                lastEntryDate: null,
                latestChange: 0,
                overallChange: 0
            };
        }
    }

    handleFormTypeChange(e) {
        // When user selects a type in the form, also update the main selector
        const selectedType = e.target.value;
        const mainSelect = document.getElementById('measurementTypeSelect');

        if (selectedType && mainSelect) {
            mainSelect.value = selectedType;
            this.loadMeasurementTypeData(selectedType);
        }
    }

    async handleMeasurementTypeChange(e) {
        const selectedType = e.target.value;
        const typeInput = document.getElementById('measurementTypeInput');

        if (selectedType && typeInput) {
            typeInput.value = selectedType;

            // Load data for this measurement type
            await this.loadMeasurementTypeData(selectedType);
        }
    }

    async loadMeasurementTypeData(measurementType) {
        this.currentMeasurementType = measurementType;

        try {
            // Load measurements and stats for this type
            const [measurements, stats] = await Promise.all([
                this.loadMeasurementsByType(measurementType),
                this.loadMeasurementStats(measurementType)
            ]);

            // Update UI
            this.updateMeasurementStats(stats, measurementType);
            this.updateMeasurementChart(measurements, measurementType);
            this.updateMeasurementTable(measurements, measurementType);
        } catch (error) {
            console.error('Error loading measurement type data:', error);
            this.showAlert('Error loading measurement data', 'danger');
        }
    }

    // All measurement data is always visible now - no need to show/hide

    updateMeasurementStats(stats, measurementType) {
        const currentElement = document.getElementById('currentMeasurement');
        const latestChangeElement = document.getElementById('latestMeasurementChange');
        const overallChangeElement = document.getElementById('measurementChange');
        const avgElement = document.getElementById('avgMeasurement');
        const progressElement = document.getElementById('measurementProgress');

        // If no stats or no entries, show empty state
        if (!stats || stats.totalEntries === 0) {
            if (currentElement) currentElement.textContent = '-';
            if (latestChangeElement) {
                latestChangeElement.textContent = '-';
                latestChangeElement.className = 'stat-value';
            }
            if (overallChangeElement) {
                overallChangeElement.textContent = '-';
                overallChangeElement.className = 'stat-value';
            }
            if (avgElement) avgElement.textContent = '-';
            if (progressElement) progressElement.textContent = '-';
            return;
        }

        // Use the default unit based on user's system
        const unit = this.defaultUnit;

        if (currentElement) {
            currentElement.textContent = stats.totalEntries > 0 ? `${stats.maxValue} ${unit}` : '-';
        }

        if (latestChangeElement) {
            if (stats.latestChange !== 0) {
                const changeText = stats.latestChange > 0 ? `+${stats.latestChange}` : `${stats.latestChange}`;
                latestChangeElement.textContent = `${changeText} ${unit}`;
                latestChangeElement.className = `stat-value ${stats.latestChange > 0 ? 'text-success' : 'text-danger'}`;
            } else {
                latestChangeElement.textContent = '-';
                latestChangeElement.className = 'stat-value';
            }
        }

        if (overallChangeElement) {
            if (stats.overallChange !== 0) {
                const changeText = stats.overallChange > 0 ? `+${stats.overallChange}` : `${stats.overallChange}`;
                overallChangeElement.textContent = `${changeText} ${unit}`;
                overallChangeElement.className = `stat-value ${stats.overallChange > 0 ? 'text-success' : 'text-danger'}`;
            } else {
                overallChangeElement.textContent = '-';
                overallChangeElement.className = 'stat-value';
            }
        }

        if (avgElement) {
            if (stats.avgChange !== 0 && stats.totalEntries > 1) {
                const changeText = stats.avgChange > 0 ? `+${stats.avgChange}` : `${stats.avgChange}`;
                avgElement.textContent = `${changeText} ${unit}`;
                avgElement.className = `stat-value ${stats.avgChange > 0 ? 'text-success' : 'text-danger'}`;
            } else {
                avgElement.textContent = '-';
                avgElement.className = 'stat-value';
            }
        }

        if (progressElement) {
            // Calculate progress trend like weight tracking
            let progressText = '-';
            if (stats.totalEntries >= 2) {
                if (stats.latestChange > 0) {
                    progressText = 'Increasing';
                } else if (stats.latestChange < 0) {
                    progressText = 'Decreasing';
                } else {
                    progressText = 'Stable';
                }
            } else if (stats.totalEntries === 1) {
                progressText = 'First Entry';
            }
            progressElement.textContent = progressText;
        }
    }

    updateMeasurementChart(measurements, measurementType) {
        const canvas = document.getElementById('measurementChart');
        const titleElement = document.getElementById('measurementChartTitle');

        // Always update title regardless of data
        if (titleElement) {
            titleElement.textContent = `${measurementType} Progress`;
        }

        if (!canvas) return;

        // Destroy existing chart first
        if (this.measurementChart) {
            this.measurementChart.destroy();
            this.measurementChart = null;
        }

        // If no data, don't create a chart
        if (measurements.length === 0) {
            return;
        }

        // Destroy existing chart
        if (this.measurementChart) {
            this.measurementChart.destroy();
        }

        // Sort measurements by date
        const sortedMeasurements = [...measurements].sort((a, b) => new Date(a.date) - new Date(b.date));

        // Prepare chart data
        const labels = sortedMeasurements.map(entry => {
            const date = new Date(entry.date);
            return date.toLocaleDateString();
        });

        const data = sortedMeasurements.map(entry => entry.value);
        const unit = measurements[0]?.unit || 'cm';

        const ctx = canvas.getContext('2d');
        this.measurementChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${measurementType} (${unit})`,
                    data: data,
                    borderColor: '#1a73e8',
                    backgroundColor: 'rgba(26, 115, 232, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#1a73e8',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function (context) {
                                return `${context.dataset.label}: ${context.parsed.y} ${unit}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: `${measurementType} (${unit})`
                        },
                        beginAtZero: false
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    updateMeasurementTable(measurements, measurementType) {
        const tableBody = document.querySelector('#measurementEntriesTable tbody');
        const titleElement = document.getElementById('measurementTableTitle');

        if (!tableBody) return;

        // Always update title regardless of data
        if (titleElement) {
            titleElement.textContent = `${measurementType} Entries`;
        }

        // Clear existing rows
        tableBody.innerHTML = '';

        if (measurements.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No ${measurementType.toLowerCase()} measurements yet. Add your first measurement below!</td></tr>`;
            return;
        }

        // Sort measurements by date (newest first)
        const sortedMeasurements = [...measurements].sort((a, b) => new Date(b.date) - new Date(a.date));

        // Calculate changes
        for (let i = 0; i < sortedMeasurements.length; i++) {
            const current = sortedMeasurements[i];
            const previous = sortedMeasurements[i + 1]; // Next in array is previous in time

            if (previous) {
                current.change = current.value - previous.value;
            } else {
                current.change = 0;
            }
        }

        // Populate table with edit-in-place functionality
        sortedMeasurements.forEach(entry => {
            const row = document.createElement('tr');
            row.setAttribute('data-entry-id', entry.id);

            const changeText = entry.change !== 0 ?
                (entry.change > 0 ? `+${entry.change.toFixed(1)}` : `${entry.change.toFixed(1)}`) :
                '-';
            const changeClass = entry.change > 0 ? 'text-success' : entry.change < 0 ? 'text-danger' : '';

            row.innerHTML = `
                <td>
                    <span class="measurement-value">${new Date(entry.date).toLocaleDateString()}</span>
                    <input type="date" class="form-control measurement-edit d-none" value="${entry.date}">
                </td>
                <td>
                    <span class="measurement-value">${entry.measurementType}</span>
                    <select class="form-select measurement-edit d-none">
                        <option value="Waist" ${entry.measurementType === 'Waist' ? 'selected' : ''}>Waist</option>
                        <option value="Thigh" ${entry.measurementType === 'Thigh' ? 'selected' : ''}>Thigh</option>
                        <option value="Arm" ${entry.measurementType === 'Arm' ? 'selected' : ''}>Arm</option>
                    </select>
                </td>
                <td>
                    <span class="measurement-value">${entry.value} ${entry.unit}</span>
                    <div class="input-group measurement-edit d-none">
                        <input type="number" class="form-control measurement-edit" value="${entry.value}" step="0.1" min="0">
                        <span class="input-group-text">${entry.unit}</span>
                    </div>
                </td>
                <td>
                    <span class="measurement-value">${entry.unit}</span>
                </td>
                <td class="${changeClass}">${changeText}</td>
                <td>
                    <span class="measurement-value">${entry.note || '-'}</span>
                    <input type="text" class="form-control measurement-edit d-none" value="${entry.note || ''}" placeholder="Note">
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

            tableBody.appendChild(row);

            // Add event listeners for this row
            const editBtn = row.querySelector('.edit-btn');
            const saveBtn = row.querySelector('.save-btn');
            const cancelBtn = row.querySelector('.cancel-btn');
            const deleteBtn = row.querySelector('.delete-btn');

            editBtn.addEventListener('click', () => this.handleEditInline(row));
            saveBtn.addEventListener('click', () => this.handleSaveInline(row));
            cancelBtn.addEventListener('click', () => this.handleCancelInline(row));
            deleteBtn.addEventListener('click', () => this.deleteMeasurement(entry.id));
        });
    }

    async handleMeasurementSubmit(e) {
        console.log('📝 Form submit handler called');
        e.preventDefault();
        e.stopPropagation();

        const form = e.target;

        // Get the unit from the display
        const unitDisplay = document.getElementById('measurementUnitDisplay');
        const measurementData = {
            date: document.getElementById('measurementDate').value,
            measurementType: document.getElementById('measurementTypeInput').value.trim(),
            value: parseFloat(document.getElementById('measurementValue').value),
            unit: unitDisplay ? unitDisplay.textContent : this.defaultUnit,
            note: document.getElementById('measurementNote').value.trim()
        };

        // Validation
        if (!measurementData.date || !measurementData.measurementType || !measurementData.value || !measurementData.unit) {
            this.showAlert('Please fill in all required fields', 'danger');
            return;
        }

        if (measurementData.value <= 0) {
            this.showAlert('Value must be a positive number', 'danger');
            return;
        }

        console.log('📏 Sending measurement data:', measurementData);

        try {
            console.log('📏 Attempting to add measurement:', measurementData);
            const response = await API.measurements.add(measurementData);

            if (response.ok) {
                console.log('✅ Measurement added successfully');
                this.showAlert('Measurement entry added successfully!', 'success');

                // Reset form
                form.reset();
                this.setDefaultDate();
                this.updateUnitSystem(); // Reset unit system

                // Reload all measurements data
                await this.loadAllMeasurements();

                // Always reload the current measurement type data
                await this.loadMeasurementTypeData(measurementData.measurementType);

                // Update the select to show the measurement type
                const select = document.getElementById('measurementTypeSelect');
                if (select) {
                    select.value = measurementData.measurementType;
                }
            } else {
                const errorData = await response.json();
                this.showAlert(errorData.error || 'Failed to add measurement entry', 'danger');
            }
        } catch (error) {
            console.error('Error adding measurement:', error);
            this.showAlert('Error adding measurement entry', 'danger');
        }
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
        row.querySelectorAll('.measurement-value').forEach(span => span.classList.add('d-none'));
        row.querySelectorAll('.measurement-edit').forEach(input => input.classList.remove('d-none'));
        row.querySelector('.edit-btn').classList.add('d-none');
        row.querySelector('.save-btn').classList.remove('d-none');
        row.querySelector('.cancel-btn').classList.remove('d-none');
    }

    // Handle saving inline edit
    async handleSaveInline(row) {
        const entryId = row.getAttribute('data-entry-id');

        // Select inputs by their type for more reliability
        const dateInput = row.querySelector('input[type="date"]');
        const typeSelect = row.querySelector('select.measurement-edit');
        const valueInput = row.querySelector('input[type="number"]');
        const noteInput = row.querySelector('input[type="text"]');

        const updatedEntry = {
            date: dateInput.value,
            measurementType: typeSelect.value,
            value: parseFloat(valueInput.value),
            unit: this.defaultUnit, // Keep the current unit system
            note: noteInput.value
        };

        // Validate data
        if (!updatedEntry.date || !updatedEntry.measurementType || !updatedEntry.value || updatedEntry.value <= 0) {
            this.showAlert('Please enter valid date, type, and measurement values', 'danger');
            return;
        }

        try {
            const response = await API.measurements.update(entryId, updatedEntry);

            if (response.ok) {
                this.showAlert('Measurement entry updated successfully!', 'success');

                // Reload all measurements data
                await this.loadAllMeasurements();

                // Reload current measurement type data
                if (this.currentMeasurementType) {
                    await this.loadMeasurementTypeData(this.currentMeasurementType);
                }
            } else {
                const errorData = await response.json();
                this.showAlert(errorData.error || 'Failed to update measurement entry', 'danger');
                this.handleCancelInline(row);
            }
        } catch (error) {
            console.error('Error updating measurement entry:', error);
            this.showAlert('Error updating measurement entry. Please try again.', 'danger');
            this.handleCancelInline(row);
        }
    }

    // Handle canceling inline edit
    handleCancelInline(row) {
        row.classList.remove('editing');
        row.querySelectorAll('.measurement-value').forEach(span => span.classList.remove('d-none'));
        row.querySelectorAll('.measurement-edit').forEach(input => input.classList.add('d-none'));
        row.querySelector('.edit-btn').classList.remove('d-none');
        row.querySelector('.save-btn').classList.add('d-none');
        row.querySelector('.cancel-btn').classList.add('d-none');
    }

    async deleteMeasurement(id) {
        if (!confirm('Are you sure you want to delete this measurement entry?')) {
            return;
        }

        // Find the row being deleted for immediate feedback
        const row = document.querySelector(`tr[data-entry-id="${id}"]`);
        if (row) {
            row.style.opacity = '0.5';
            row.style.pointerEvents = 'none';
        }

        try {
            const response = await API.measurements.delete(id);

            if (response.ok) {
                this.showAlert('Measurement entry deleted successfully!', 'success');

                // Immediate UI update - remove the row
                if (row) {
                    row.remove();
                }

                // Update local data
                this.measurements = this.measurements.filter(entry => entry.id !== id);

                // Reload current measurement type data
                if (this.currentMeasurementType) {
                    await this.loadMeasurementTypeData(this.currentMeasurementType);
                }

                // Show empty state if no entries left for current type
                const currentTypeEntries = this.measurements.filter(entry => entry.measurementType === this.currentMeasurementType);
                if (currentTypeEntries.length === 0) {
                    const tableBody = document.querySelector('#measurementEntriesTable tbody');
                    if (tableBody) {
                        tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No ${this.currentMeasurementType.toLowerCase()} measurements yet. Add your first measurement below!</td></tr>`;
                    }
                }
            } else {
                const errorData = await response.json();
                this.showAlert(errorData.error || 'Failed to delete measurement entry', 'danger');

                // Restore the row if delete failed
                if (row) {
                    row.style.opacity = '1';
                    row.style.pointerEvents = 'auto';
                }
            }
        } catch (error) {
            console.error('Error deleting measurement:', error);
            this.showAlert('Error deleting measurement entry', 'danger');

            // Restore the row if delete failed
            if (row) {
                row.style.opacity = '1';
                row.style.pointerEvents = 'auto';
            }
        }
    }

    async refreshSettings() {
        await this.loadSettings();
        this.updateUnitSystem();
        console.log('Measurements: Settings refreshed');
    }

    showAlert(message, type = 'info') {
        // Create alert element
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        // Insert at the top of the measurements content
        const measurementsContent = document.querySelector('.measurements-content');
        if (measurementsContent) {
            measurementsContent.insertBefore(alertDiv, measurementsContent.firstChild);

            // Auto-dismiss after 5 seconds
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.remove();
                }
            }, 5000);
        }
    }
}

// Create global instance
const measurementsManager = new MeasurementsManager();