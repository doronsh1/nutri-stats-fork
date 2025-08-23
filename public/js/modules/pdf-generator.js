// PDF Report Generator
class PDFReportGenerator {
    constructor() {
        this.nutritionReports = null;
        this.weightTracker = null;
        this.measurementsManager = null;
    }

    // Clean text for PDF to remove problematic Unicode characters
    cleanTextForPDF(text) {
        if (!text) return '';
        return text
            .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
            .replace(/—/g, '-') // Replace em dash with regular dash
            .replace(/–/g, '-') // Replace en dash with regular dash
            .replace(/'/g, "'") // Replace smart quotes
            .replace(/'/g, "'")
            .replace(/"/g, '"')
            .replace(/"/g, '"')
            .replace(/…/g, '...') // Replace ellipsis
            .replace(/þ/g, '') // Remove thorn character
            .replace(/[^\w\s\-\+\.\,\(\)\[\]\{\}\:\;\!\?\%\/\$]/g, '') // Keep only safe characters
            .trim();
    }

    init(nutritionReports, weightTracker, measurementsManager) {
        this.nutritionReports = nutritionReports;
        this.weightTracker = weightTracker;
        this.measurementsManager = measurementsManager;
        this.setupEventListeners();
    }

    // Method to update measurements manager reference when it becomes available
    setMeasurementsManager(measurementsManager) {
        this.measurementsManager = measurementsManager;
        console.log('PDF generator measurements manager updated');
    }

    async ensureAllDataLoaded() {
        console.log('Ensuring all data is loaded for PDF generation...');

        // Initialize weight tracker if not already done
        if (this.weightTracker && !this.weightTracker.initialized) {
            console.log('Initializing weight tracker...');
            await this.weightTracker.init();
        }

        // Initialize measurements manager if available and not already done
        if (!this.measurementsManager) {
            // Create measurements manager if it doesn't exist
            if (typeof MeasurementsManager !== 'undefined') {
                console.log('Creating measurements manager...');
                this.measurementsManager = new MeasurementsManager();
            }
        }

        if (this.measurementsManager && !this.measurementsManager.initialized) {
            console.log('Initializing measurements manager...');
            await this.measurementsManager.init();
        }

        // Ensure nutrition reports are initialized
        if (this.nutritionReports && !this.nutritionReports.initialized) {
            console.log('Initializing nutrition reports...');
            await this.nutritionReports.init();
        }

        console.log('All data loaded for PDF generation');
    }

    setupEventListeners() {
        console.log('Setting up PDF generator event listeners...');

        const nutritionBtn = document.getElementById('download-nutrition-pdf');
        const weightBtn = document.getElementById('download-weight-pdf');
        const measurementsBtn = document.getElementById('download-measurements-pdf');
        const completeBtn = document.getElementById('download-complete-pdf');

        console.log('PDF buttons found:', {
            nutrition: !!nutritionBtn,
            weight: !!weightBtn,
            measurements: !!measurementsBtn,
            complete: !!completeBtn
        });

        if (nutritionBtn) {
            nutritionBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Nutrition PDF download clicked');
                this.generateNutritionPDF();
            });
        }

        if (weightBtn) {
            weightBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Weight PDF download clicked');
                this.generateWeightPDF();
            });
        }

        if (measurementsBtn) {
            measurementsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Measurements PDF download clicked');
                this.generateMeasurementsPDF();
            });
        }

        if (completeBtn) {
            completeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Complete PDF download clicked');
                this.generateCompletePDF();
            });
        }

        console.log('PDF event listeners setup complete');
    }

    async generateNutritionPDF() {
        console.log('generateNutritionPDF called');
        const button = document.getElementById('download-nutrition-pdf');
        try {
            // Show loading state
            if (button) {
                button.classList.add('generating-pdf');
                button.textContent = 'Generating PDF...';
            }

            console.log('Checking jsPDF availability:', !!window.jspdf);
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');

            // Add header
            this.addPDFHeader(pdf, 'Nutrition Report');

            // Add nutrition stats with proper spacing
            let currentY = await this.addNutritionStats(pdf, 55);

            // Add chart with proper spacing
            currentY = await this.addNutritionChart(pdf, currentY + 10);

            // Add new page for macro table
            pdf.addPage();
            this.addPDFHeader(pdf, 'Nutrition Report');

            // Add macro table on second page
            await this.addMacroTable(pdf, 55);

            // Save the PDF
            const fileName = `nutrition-report-${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);

            // Show success message
            if (typeof showSuccessMessage === 'function') {
                showSuccessMessage('Nutrition report downloaded successfully!');
            }

        } catch (error) {
            console.error('Error generating nutrition PDF:', error);
            if (typeof showErrorMessage === 'function') {
                showErrorMessage('Error generating PDF. Please try again.');
            }
        } finally {
            // Reset button state
            if (button) {
                button.classList.remove('generating-pdf');
                button.innerHTML = '<i class="bi bi-file-earmark-pdf"></i> Nutrition Report PDF';
            }
        }
    }

    async generateWeightPDF() {
        const button = document.getElementById('download-weight-pdf');
        try {
            button.classList.add('generating-pdf');
            button.textContent = 'Generating PDF...';

            // Ensure weight tracker is initialized and has data
            if (this.weightTracker) {
                if (!this.weightTracker.initialized) {
                    console.log('Initializing weight tracker for PDF...');
                    await this.weightTracker.init();
                }

                // Ensure chart is created if we have data
                if (this.weightTracker.weightData && this.weightTracker.weightData.length > 0) {
                    console.log('Creating weight chart for PDF...');
                    this.weightTracker.createWeightChart();
                    // Wait for chart to be fully rendered
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');

            // Add header
            this.addPDFHeader(pdf, 'Weight Tracking Report');

            // Add weight stats with proper spacing
            let currentY = await this.addWeightStats(pdf, 55);

            // Add weight chart with proper spacing
            currentY = await this.addWeightChart(pdf, currentY + 10);

            // Add new page for weight table
            pdf.addPage();
            this.addPDFHeader(pdf, 'Weight Tracking Report');

            // Add weight table on second page
            await this.addWeightTable(pdf, 55);

            // Save the PDF
            const fileName = `weight-report-${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);

            if (typeof showSuccessMessage === 'function') {
                showSuccessMessage('Weight report downloaded successfully!');
            }

        } catch (error) {
            console.error('Error generating weight PDF:', error);
            if (typeof showErrorMessage === 'function') {
                showErrorMessage('Error generating PDF. Please try again.');
            }
        } finally {
            button.classList.remove('generating-pdf');
            button.innerHTML = '<i class="bi bi-file-earmark-pdf"></i> Weight Report PDF';
        }
    }

    async generateMeasurementsPDF() {
        const button = document.getElementById('download-measurements-pdf');
        try {
            button.classList.add('generating-pdf');
            button.textContent = 'Generating PDF...';

            // Ensure measurements manager is initialized and has data
            if (!this.measurementsManager) {
                // Create measurements manager if it doesn't exist
                if (typeof MeasurementsManager !== 'undefined') {
                    console.log('Creating measurements manager for PDF...');
                    this.measurementsManager = new MeasurementsManager();
                } else {
                    throw new Error('MeasurementsManager class not available');
                }
            }

            if (!this.measurementsManager.initialized) {
                console.log('Initializing measurements manager for PDF...');
                await this.measurementsManager.init();
            }

            // Load all measurements data
            console.log('Loading all measurement data for PDF report...');
            await this.measurementsManager.loadAllMeasurements();

            // Load data for all measurement types to ensure we have complete data
            const measurementTypes = ['Waist', 'Thigh', 'Arm'];
            for (const type of measurementTypes) {
                await this.measurementsManager.loadMeasurementTypeData(type);
            }

            // Populate the recent entries table with all measurement data for PDF
            if (typeof this.measurementsManager.populateRecentEntriesTable === 'function') {
                await this.measurementsManager.populateRecentEntriesTable();
            }

            // Wait for UI updates
            await new Promise(resolve => setTimeout(resolve, 500));

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');

            // Add header
            this.addPDFHeader(pdf, 'Measurements Report');

            // Add measurements stats with proper spacing
            let currentY = await this.addMeasurementsStats(pdf, 55);

            // Add measurements chart with proper spacing
            currentY = await this.addMeasurementsChart(pdf, currentY + 10);

            // Add new page for measurements table
            pdf.addPage();
            this.addPDFHeader(pdf, 'Measurements Report');

            // Add measurements table on second page
            await this.addMeasurementsTable(pdf, 55);

            // Save the PDF
            const fileName = `measurements-report-${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);

            if (typeof showSuccessMessage === 'function') {
                showSuccessMessage('Measurements report downloaded successfully!');
            }

        } catch (error) {
            console.error('Error generating measurements PDF:', error);
            if (typeof showErrorMessage === 'function') {
                showErrorMessage('Error generating PDF. Please try again.');
            }
        } finally {
            button.classList.remove('generating-pdf');
            button.innerHTML = '<i class="bi bi-file-earmark-pdf"></i> Measurements Report PDF';
        }
    }

    async generateCompletePDF() {
        const button = document.getElementById('download-complete-pdf');
        try {
            button.classList.add('generating-pdf');
            button.textContent = 'Generating PDF...';

            // Ensure all managers are initialized and have data
            await this.ensureAllDataLoaded();

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');

            // Add header
            this.addPDFHeader(pdf, 'Complete Health Report');

            // Nutrition Section
            pdf.setFillColor(52, 152, 219); // Blue section header
            pdf.rect(15, 52, 180, 10, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(16);
            pdf.setFont(undefined, 'bold');
            pdf.text('Nutrition Report', 20, 59);
            pdf.setTextColor(0, 0, 0);

            let currentY = await this.addNutritionStats(pdf, 70);
            currentY = await this.addNutritionChart(pdf, currentY + 5);

            // Add new page for nutrition macro table
            pdf.addPage();
            this.addPDFHeader(pdf, 'Complete Health Report');

            await this.addMacroTable(pdf, 55);

            // Add new page for weight section
            pdf.addPage();
            this.addPDFHeader(pdf, 'Complete Health Report');

            pdf.setFillColor(46, 204, 113); // Green section header
            pdf.rect(15, 52, 180, 10, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(16);
            pdf.setFont(undefined, 'bold');
            pdf.text('Weight Tracking', 20, 59);
            pdf.setTextColor(0, 0, 0);

            currentY = await this.addWeightStats(pdf, 70);
            currentY = await this.addWeightChart(pdf, currentY + 5);

            // Add new page for weight entries table
            pdf.addPage();
            this.addPDFHeader(pdf, 'Complete Health Report');

            await this.addWeightTable(pdf, 55);

            // Add new page for measurements section
            pdf.addPage();
            this.addPDFHeader(pdf, 'Complete Health Report');

            pdf.setFillColor(155, 89, 182); // Purple section header
            pdf.rect(15, 52, 180, 10, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(16);
            pdf.setFont(undefined, 'bold');
            pdf.text('Body Measurements', 20, 59);
            pdf.setTextColor(0, 0, 0);

            currentY = await this.addMeasurementsStats(pdf, 70);
            currentY = await this.addMeasurementsChart(pdf, currentY + 5);

            // Add new page for measurements entries table
            pdf.addPage();
            this.addPDFHeader(pdf, 'Complete Health Report');

            await this.addMeasurementsTable(pdf, 55);

            // Add footer to all pages
            const pageCount = pdf.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                pdf.setPage(i);
                pdf.setFontSize(8);
                pdf.setTextColor(128, 128, 128);
                pdf.text(`Page ${i} of ${pageCount}`, 20, 285);
                pdf.text('Generated by NutriStats', 150, 285);
            }

            // Save the PDF
            const fileName = `complete-health-report-${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);

            if (typeof showSuccessMessage === 'function') {
                showSuccessMessage('Complete health report downloaded successfully!');
            }

        } catch (error) {
            console.error('Error generating complete PDF:', error);
            if (typeof showErrorMessage === 'function') {
                showErrorMessage('Error generating PDF. Please try again.');
            }
        } finally {
            button.classList.remove('generating-pdf');
            button.innerHTML = '<i class="bi bi-file-earmark-pdf-fill"></i> Complete Report PDF';
        }
    }

    addPDFHeader(pdf, title) {
        // Get user name from localStorage
        let userName = 'User';
        try {
            const userData = localStorage.getItem('user');
            if (userData) {
                const user = JSON.parse(userData);
                userName = user.name || user.email || 'User';
            }
        } catch (error) {
            console.log('Could not get user data for PDF header:', error);
        }

        // Add colored background for header using site's green color
        pdf.setFillColor(40, 167, 69); // Site's green color #28a745
        pdf.rect(0, 0, 210, 35, 'F');

        // Add logo/title in white
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(24);
        pdf.setFont(undefined, 'bold');
        pdf.text('NutriStats', 20, 18);

        pdf.setFontSize(14);
        pdf.setFont(undefined, 'normal');
        pdf.text(title, 20, 28);

        // Add username in the top right
        pdf.setFontSize(12);
        pdf.text(`Report for: ${userName}`, 130, 18);

        // Add date under the username
        pdf.setFontSize(10);
        const dateStr = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        pdf.text(dateStr, 130, 28);

        // Reset text color to black for rest of document
        pdf.setTextColor(0, 0, 0);
    }

    async addNutritionStats(pdf, startY = 55) {
        const avgCalories = this.cleanTextForPDF(document.getElementById('avgDailyCalories')?.textContent) || 'N/A';
        const goalAchievement = this.cleanTextForPDF(document.getElementById('goalAchievement')?.textContent) || 'N/A';
        const proteinAchievement = this.cleanTextForPDF(document.getElementById('proteinAchievement')?.textContent) || 'N/A';
        const fatAchievement = this.cleanTextForPDF(document.getElementById('fatAchievement')?.textContent) || 'N/A';
        const carbsAchievement = this.cleanTextForPDF(document.getElementById('carbsAchievement')?.textContent) || 'N/A';
        const daysOnTrack = this.cleanTextForPDF(document.getElementById('daysOnTrack')?.textContent) || 'N/A';

        // Section header with background
        pdf.setFillColor(236, 240, 241); // Light gray background
        pdf.rect(15, startY - 5, 180, 8, 'F');

        pdf.setTextColor(52, 73, 94); // Dark blue-gray
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.text('Weekly Nutrition Summary', 20, startY);

        // Reset text color and add stats with better formatting
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(11);
        pdf.setFont(undefined, 'normal');

        const stats = [
            { label: 'Average Daily Calories:', value: this.cleanTextForPDF(avgCalories) },
            { label: 'Goal Achievement:', value: this.cleanTextForPDF(goalAchievement) },
            { label: 'Protein Target:', value: this.cleanTextForPDF(proteinAchievement) },
            { label: 'Fat Target:', value: this.cleanTextForPDF(fatAchievement) },
            { label: 'Carbs Target:', value: this.cleanTextForPDF(carbsAchievement) },
            { label: 'Days On Track:', value: this.cleanTextForPDF(daysOnTrack) }
        ];

        let yPos = startY + 12;
        stats.forEach((stat, index) => {
            // Alternating row colors for better readability
            if (index % 2 === 0) {
                pdf.setFillColor(249, 249, 249);
                pdf.rect(15, yPos - 3, 180, 8, 'F');
            }

            pdf.setFont(undefined, 'bold');
            pdf.text(stat.label, 20, yPos);

            pdf.setFont(undefined, 'normal');
            pdf.setTextColor(40, 167, 69); // Green for values
            pdf.text(stat.value, 120, yPos);
            pdf.setTextColor(0, 0, 0); // Reset to black

            yPos += 10;
        });

        return yPos + 5;
    }

    async addNutritionChart(pdf, startY = 120) {
        // Section header for chart
        pdf.setFillColor(236, 240, 241);
        pdf.rect(15, startY - 5, 180, 8, 'F');

        pdf.setTextColor(52, 73, 94);
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.text('Weekly Calories Chart', 20, startY);

        startY += 10;

        const chartCanvas = document.getElementById('weeklyCaloriesChart');
        if (!chartCanvas) {
            pdf.setTextColor(231, 76, 60); // Red for error
            pdf.setFontSize(10);
            pdf.text('Nutrition chart not available', 20, startY + 10);
            pdf.setTextColor(0, 0, 0); // Reset color
            return startY + 30;
        }

        try {
            // Check if chart is visible and has content
            const rect = chartCanvas.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) {
                console.warn('Nutrition chart canvas has no dimensions');
                pdf.setTextColor(231, 76, 60);
                pdf.setFontSize(10);
                pdf.text('Nutrition chart not visible', 20, startY + 10);
                pdf.setTextColor(0, 0, 0);
                return startY + 30;
            }

            // Wait a bit for chart to be fully rendered
            await new Promise(resolve => setTimeout(resolve, 100));

            const canvas = await html2canvas(chartCanvas, {
                backgroundColor: '#ffffff',
                scale: 2, // Higher quality
                useCORS: true,
                allowTaint: false,
                logging: false
            });

            // Validate canvas has content
            if (canvas.width === 0 || canvas.height === 0) {
                throw new Error('Generated canvas has no dimensions');
            }

            const imgData = canvas.toDataURL('image/png');

            // Validate the generated image data
            if (!imgData || imgData === 'data:,' || imgData.length < 100) {
                throw new Error('Invalid image data generated');
            }

            const imgWidth = 170;
            const imgHeight = 100; // Optimized height for perfect proportion

            pdf.addImage(imgData, 'PNG', 20, startY + 10, imgWidth, imgHeight);

            return startY + imgHeight + 20;
        } catch (error) {
            console.error('Error adding nutrition chart to PDF:', error);
            pdf.setTextColor(231, 76, 60);
            pdf.setFontSize(10);
            pdf.text('Nutrition chart could not be generated', 20, startY + 10);
            pdf.setFontSize(8);
            pdf.text(`Error: ${error.message}`, 20, startY + 20);
            pdf.setTextColor(0, 0, 0);
            return startY + 35;
        }
    }

    async addMacroTable(pdf, startY = 200) {
        const table = document.getElementById('weeklyMacroTable');
        let yPos = startY;

        if (table) {
            // Section header with background
            pdf.setFillColor(236, 240, 241);
            pdf.rect(15, startY - 5, 180, 8, 'F');

            pdf.setTextColor(52, 73, 94);
            pdf.setFontSize(14);
            pdf.setFont(undefined, 'bold');
            pdf.text('Daily Macro Breakdown', 20, startY);

            const rows = table.querySelectorAll('tbody tr');
            yPos = startY + 15;

            // Table header
            pdf.setFillColor(41, 128, 185);
            pdf.rect(15, yPos - 5, 180, 8, 'F');

            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(10);
            pdf.setFont(undefined, 'bold');
            pdf.text('Day', 20, yPos);
            pdf.text('Calories', 60, yPos);
            pdf.text('Protein', 100, yPos);
            pdf.text('Carbs', 130, yPos);
            pdf.text('Fat', 160, yPos);

            yPos += 10;
            pdf.setTextColor(0, 0, 0);
            pdf.setFont(undefined, 'normal');

            rows.forEach((row, rowIndex) => {
                if (yPos > 270) {
                    pdf.addPage();
                    this.addPDFHeader(pdf, 'Nutrition Report');
                    yPos = 60;
                }

                // Alternating row colors
                if (rowIndex % 2 === 0) {
                    pdf.setFillColor(249, 249, 249);
                    pdf.rect(15, yPos - 3, 180, 8, 'F');
                }

                const cells = row.querySelectorAll('td');
                if (cells.length >= 5) {
                    const day = this.cleanTextForPDF(cells[0]?.textContent?.trim()) || '';
                    const calories = this.cleanTextForPDF(cells[1]?.textContent?.trim()) || '';
                    const protein = this.cleanTextForPDF(cells[2]?.textContent?.trim()) || '';
                    const carbs = this.cleanTextForPDF(cells[3]?.textContent?.trim()) || '';
                    const fat = this.cleanTextForPDF(cells[4]?.textContent?.trim()) || '';

                    pdf.setFontSize(9);
                    pdf.text(day, 20, yPos);
                    pdf.text(calories, 60, yPos);
                    pdf.text(protein, 100, yPos);
                    pdf.text(carbs, 130, yPos);
                    pdf.text(fat, 160, yPos);
                    yPos += 8;
                }
            });
        } else {
            // If no table found, add a message
            pdf.setTextColor(128, 128, 128);
            pdf.setFontSize(10);
            pdf.text('No macro data available', 20, startY + 10);
            pdf.setTextColor(0, 0, 0);
            yPos = startY + 20;
        }

        return yPos + 10;
    }

    async addWeightStats(pdf, startY = 55) {
        // Ensure weight tracker is initialized and has data
        if (this.weightTracker && !this.weightTracker.initialized) {
            console.log('Initializing weight tracker for PDF generation');
            await this.weightTracker.init();
        }

        // Try to get data from weight tracker directly if available
        let currentWeight = 'N/A';
        let latestChange = 'N/A';
        let overallChange = 'N/A';
        let avgChange = 'N/A';
        let trend = 'N/A';

        if (this.weightTracker && this.weightTracker.weightData && this.weightTracker.weightData.length > 0) {
            const weightData = this.weightTracker.weightData;
            const unit = this.weightTracker.weightUnit || 'kg';

            // Calculate stats directly from data
            currentWeight = `${weightData[0].weight.toFixed(1)} ${unit}`;

            if (weightData.length >= 2) {
                const latestChangeValue = weightData[0].weight - weightData[1].weight;
                latestChange = `${latestChangeValue > 0 ? '+' : ''}${latestChangeValue.toFixed(1)} ${unit}`;

                const overallChangeValue = weightData[0].weight - weightData[weightData.length - 1].weight;
                overallChange = `${overallChangeValue > 0 ? '+' : ''}${overallChangeValue.toFixed(1)} ${unit}`;

                const avgChangeValue = this.weightTracker.calculateAvgWeightChange();
                avgChange = `${avgChangeValue > 0 ? '+' : ''}${avgChangeValue.toFixed(1)} ${unit}/week`;

                trend = this.weightTracker.calculateTrend();
            }
        } else {
            // Fallback to DOM elements with text cleaning
            currentWeight = this.cleanTextForPDF(document.getElementById('currentWeight')?.textContent) || 'N/A';
            latestChange = this.cleanTextForPDF(document.getElementById('latestWeightChange')?.textContent) || 'N/A';
            overallChange = this.cleanTextForPDF(document.getElementById('weightChange')?.textContent) || 'N/A';
            avgChange = this.cleanTextForPDF(document.getElementById('avgWeightChange')?.textContent) || 'N/A';
            trend = this.cleanTextForPDF(document.getElementById('weightTrend')?.textContent) || 'N/A';
        }

        // Section header with background
        pdf.setFillColor(236, 240, 241);
        pdf.rect(15, startY - 5, 180, 8, 'F');

        pdf.setTextColor(52, 73, 94);
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.text('Weight Statistics', 20, startY);

        // Reset text color and add stats with better formatting
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(11);
        pdf.setFont(undefined, 'normal');

        const stats = [
            { label: 'Current Weight:', value: this.cleanTextForPDF(currentWeight) },
            { label: 'Latest Change:', value: this.cleanTextForPDF(latestChange) },
            { label: 'Overall Change:', value: this.cleanTextForPDF(overallChange) },
            { label: 'Average Change:', value: this.cleanTextForPDF(avgChange) },
            { label: 'Trend:', value: this.cleanTextForPDF(trend) }
        ];

        let yPos = startY + 12;
        stats.forEach((stat, index) => {
            // Alternating row colors for better readability
            if (index % 2 === 0) {
                pdf.setFillColor(249, 249, 249);
                pdf.rect(15, yPos - 3, 180, 8, 'F');
            }

            pdf.setFont(undefined, 'bold');
            pdf.text(this.cleanTextForPDF(stat.label), 20, yPos);

            pdf.setFont(undefined, 'normal');
            pdf.setTextColor(40, 167, 69);
            pdf.text(this.cleanTextForPDF(stat.value), 120, yPos);
            pdf.setTextColor(0, 0, 0);

            yPos += 10;
        });

        return yPos + 5;
    }

    async addWeightChart(pdf, startY = 120) {
        // Section header for chart
        pdf.setFillColor(236, 240, 241);
        pdf.rect(15, startY - 5, 180, 8, 'F');

        pdf.setTextColor(52, 73, 94);
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.text('Weight Progress Chart', 20, startY);

        startY += 10;

        const chartCanvas = document.getElementById('weightChart');
        if (!chartCanvas) {
            pdf.setTextColor(231, 76, 60);
            pdf.setFontSize(10);
            pdf.text('Weight chart element not found', 20, startY + 10);
            pdf.setTextColor(0, 0, 0);
            return startY + 30;
        }

        // Store original display states to restore later
        const originalStates = {};

        try {
            // Make weight section visible temporarily for chart capture
            const weightSection = document.getElementById('weight-section');
            const weightTab = document.getElementById('weight-tab');

            if (weightSection && !weightSection.classList.contains('active')) {
                console.log('Making weight section visible for chart capture...');

                // Store original states
                originalStates.weightSectionDisplay = weightSection.style.display;
                originalStates.weightSectionClass = weightSection.className;

                // Make weight section visible
                weightSection.style.display = 'block';
                weightSection.classList.add('active');

                // Wait for layout
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Ensure weight tracker is initialized and chart is created
            if (this.weightTracker && !this.weightTracker.chart) {
                console.log('Weight chart not initialized, creating chart...');
                await this.weightTracker.init();
                if (this.weightTracker.weightData && this.weightTracker.weightData.length > 0) {
                    this.weightTracker.createWeightChart();
                    // Wait for chart to be created
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            // Check if Chart.js instance exists on the canvas
            const chartInstance = Chart.getChart(chartCanvas);
            if (!chartInstance) {
                console.warn('No Chart.js instance found on weight chart canvas');
                pdf.setTextColor(231, 76, 60);
                pdf.setFontSize(10);
                pdf.text('Weight chart not initialized - no data available', 20, startY + 10);
                pdf.setTextColor(0, 0, 0);
                return startY + 30;
            }

            // Ensure chart container is visible
            const chartContainer = chartCanvas.closest('.chart-container');
            const cardBody = chartCanvas.closest('.card-body');

            if (chartContainer) {
                originalStates.chartContainerDisplay = chartContainer.style.display;
                originalStates.chartContainerVisibility = chartContainer.style.visibility;
                chartContainer.style.display = 'block';
                chartContainer.style.visibility = 'visible';
                chartContainer.style.height = '400px'; // Set explicit height
            }

            if (cardBody) {
                originalStates.cardBodyDisplay = cardBody.style.display;
                cardBody.style.display = 'block';
            }

            // Set canvas size explicitly
            originalStates.canvasDisplay = chartCanvas.style.display;
            chartCanvas.style.display = 'block';

            // Wait for layout to update
            await new Promise(resolve => setTimeout(resolve, 500));

            // Check canvas dimensions after making visible
            const rect = chartCanvas.getBoundingClientRect();
            console.log('Chart canvas dimensions:', rect.width, 'x', rect.height);

            if (rect.width === 0 || rect.height === 0) {
                pdf.setTextColor(231, 76, 60);
                pdf.setFontSize(10);
                pdf.text('Weight chart has no dimensions after making visible', 20, startY + 10);
                pdf.setTextColor(0, 0, 0);
                return startY + 30;
            }

            // Force chart update and wait for render
            if (chartInstance) {
                chartInstance.resize();
                chartInstance.update('none'); // Update without animation
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            console.log('Capturing weight chart with html2canvas...');
            const canvas = await html2canvas(chartCanvas, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true,
                allowTaint: false,
                logging: false,
                width: rect.width,
                height: rect.height
            });

            if (canvas.width === 0 || canvas.height === 0) {
                throw new Error('Generated canvas has no dimensions');
            }

            const imgData = canvas.toDataURL('image/png', 0.9);
            if (!imgData || imgData === 'data:,' || imgData.length < 100) {
                throw new Error('Invalid image data generated');
            }

            const imgWidth = 170;
            const imgHeight = 100; // Optimized height for perfect proportion

            pdf.addImage(imgData, 'PNG', 20, startY + 10, imgWidth, imgHeight);

            console.log('Weight chart successfully added to PDF');
            return startY + imgHeight + 25;

        } catch (error) {
            console.error('Error adding weight chart to PDF:', error);
            pdf.setTextColor(231, 76, 60);
            pdf.setFontSize(10);
            pdf.text('Weight chart could not be generated', 20, startY + 10);
            pdf.setFontSize(8);
            pdf.text(`Error: ${error.message}`, 20, startY + 20);
            pdf.setTextColor(0, 0, 0);
            return startY + 35;
        } finally {
            // Restore original display states
            const weightSection = document.getElementById('weight-section');
            if (weightSection && originalStates.weightSectionClass) {
                weightSection.className = originalStates.weightSectionClass;
                if (originalStates.weightSectionDisplay) {
                    weightSection.style.display = originalStates.weightSectionDisplay;
                }
            }

            const chartContainer = chartCanvas.closest('.chart-container');
            if (chartContainer) {
                if (originalStates.chartContainerDisplay !== undefined) {
                    chartContainer.style.display = originalStates.chartContainerDisplay;
                }
                if (originalStates.chartContainerVisibility !== undefined) {
                    chartContainer.style.visibility = originalStates.chartContainerVisibility;
                }
            }

            const cardBody = chartCanvas.closest('.card-body');
            if (cardBody && originalStates.cardBodyDisplay !== undefined) {
                cardBody.style.display = originalStates.cardBodyDisplay;
            }

            if (originalStates.canvasDisplay !== undefined) {
                chartCanvas.style.display = originalStates.canvasDisplay;
            }
        }
    }

    async addWeightTable(pdf, startY = 55) {
        const table = document.getElementById('weightEntriesTable');
        let yPos = startY;

        if (table) {
            // Section header with background
            pdf.setFillColor(236, 240, 241);
            pdf.rect(15, startY - 5, 180, 8, 'F');

            pdf.setTextColor(52, 73, 94);
            pdf.setFontSize(14);
            pdf.setFont(undefined, 'bold');
            pdf.text(this.cleanTextForPDF('Recent Weight Entries'), 20, startY);

            const rows = table.querySelectorAll('tbody tr');
            yPos = startY + 15;

            // Table header without border - just background color
            pdf.setFillColor(40, 167, 69); // Site's green color
            pdf.rect(15, yPos - 5, 180, 8, 'F');

            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(10);
            pdf.setFont(undefined, 'bold');
            pdf.text('Date', 20, yPos);
            pdf.text('Weight', 80, yPos);
            pdf.text('Change', 140, yPos);

            yPos += 10;
            pdf.setTextColor(0, 0, 0);
            pdf.setFont(undefined, 'normal');

            rows.forEach((row, rowIndex) => {
                if (rowIndex >= 15) return; // Show more entries on dedicated page
                if (yPos > 270) {
                    pdf.addPage();
                    this.addPDFHeader(pdf, 'Weight Tracking Report');
                    yPos = 60;
                }

                // Alternating row colors without borders
                if (rowIndex % 2 === 0) {
                    pdf.setFillColor(249, 249, 249);
                    pdf.rect(15, yPos - 3, 180, 8, 'F');
                }

                const cells = row.querySelectorAll('td');
                if (cells.length >= 3) {
                    const date = this.cleanTextForPDF(cells[0]?.textContent?.trim()) || '';
                    let weight = this.cleanTextForPDF(cells[1]?.textContent?.trim()) || '';
                    const change = this.cleanTextForPDF(cells[2]?.textContent?.trim()) || '';

                    // Clean up weight value to ensure proper alignment
                    // Extract just the number and add kg unit consistently
                    const weightMatch = weight.match(/(\d+\.?\d*)/);
                    if (weightMatch) {
                        weight = `${weightMatch[1]} kg`;
                    }

                    pdf.setFontSize(9);
                    pdf.text(date, 20, yPos);
                    pdf.text(weight, 80, yPos); // Consistent position for weight with unit

                    // Color code the change
                    const changeNum = parseFloat(change.replace(/[^\d\.\-\+]/g, ''));
                    if (changeNum > 0) {
                        pdf.setTextColor(231, 76, 60); // Red for increase
                    } else if (changeNum < 0) {
                        pdf.setTextColor(46, 204, 113); // Green for decrease
                    } else {
                        pdf.setTextColor(0, 0, 0); // Black for no change
                    }
                    pdf.text(change, 140, yPos);
                    pdf.setTextColor(0, 0, 0); // Reset color

                    yPos += 8;
                }
            });
        } else {
            // If no table found, add a message
            pdf.setTextColor(128, 128, 128);
            pdf.setFontSize(10);
            pdf.text('No weight data available', 20, startY + 10);
            pdf.setTextColor(0, 0, 0);
            yPos = startY + 20;
        }

        return yPos + 10;
    }

    async addMeasurementsStats(pdf, startY = 55) {
        // Ensure measurements manager is initialized and has data
        if (this.measurementsManager && !this.measurementsManager.initialized) {
            console.log('Initializing measurements manager for PDF generation');
            await this.measurementsManager.init();
        }

        // Ensure measurements section is visible to get correct DOM values
        const measurementsSection = document.getElementById('measurements-section');
        const originalDisplay = measurementsSection?.style.display;
        const originalClass = measurementsSection?.className;

        if (measurementsSection && !measurementsSection.classList.contains('active')) {
            console.log('Making measurements section visible for stats...');
            measurementsSection.style.display = 'block';
            measurementsSection.classList.add('active');

            // Wait for any async updates to complete
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        try {
            // Force measurements manager to load current type data and update stats
            if (this.measurementsManager && this.measurementsManager.initialized) {
                const currentType = document.getElementById('measurementTypeSelect')?.value || 'Waist';
                console.log('Forcing measurements data load for type:', currentType);

                // Load the measurement type data which should update the DOM elements
                await this.measurementsManager.loadMeasurementTypeData(currentType);

                // Wait longer for DOM updates
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Read DOM elements after forcing update
            let currentMeasurement = this.cleanTextForPDF(document.getElementById('currentMeasurement')?.textContent) || 'N/A';
            let latestChange = this.cleanTextForPDF(document.getElementById('latestMeasurementChange')?.textContent) || 'N/A';
            let overallChange = this.cleanTextForPDF(document.getElementById('measurementChange')?.textContent) || 'N/A';
            let avgMeasurement = this.cleanTextForPDF(document.getElementById('avgMeasurement')?.textContent) || 'N/A';
            let progress = this.cleanTextForPDF(document.getElementById('measurementProgress')?.textContent) || 'N/A';

            console.log('Measurements stats from DOM after forced update:', {
                currentMeasurement,
                latestChange,
                overallChange,
                avgMeasurement,
                progress
            });

            // If still showing N/A or -, try to get raw textContent for debugging
            if (latestChange === 'N/A' || latestChange === '-') {
                const rawLatestChange = document.getElementById('latestMeasurementChange')?.textContent;
                const rawAvgMeasurement = document.getElementById('avgMeasurement')?.textContent;
                console.log('Raw DOM values:', { rawLatestChange, rawAvgMeasurement });
            }

            // Section header with background
            pdf.setFillColor(236, 240, 241);
            pdf.rect(15, startY - 5, 180, 8, 'F');

            pdf.setTextColor(52, 73, 94);
            pdf.setFontSize(14);
            pdf.setFont(undefined, 'bold');
            pdf.text('Measurement Statistics', 20, startY);

            // Reset text color and add stats with better formatting
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(11);
            pdf.setFont(undefined, 'normal');

            const stats = [
                { label: 'Latest Value:', value: this.cleanTextForPDF(currentMeasurement) },
                { label: 'Latest Change:', value: this.cleanTextForPDF(latestChange) },
                { label: 'Overall Change:', value: this.cleanTextForPDF(overallChange) },
                { label: 'Average Change:', value: this.cleanTextForPDF(avgMeasurement) },
                { label: 'Progress:', value: this.cleanTextForPDF(progress) }
            ];

            let yPos = startY + 12;
            stats.forEach((stat, index) => {
                // Alternating row colors for better readability
                if (index % 2 === 0) {
                    pdf.setFillColor(249, 249, 249);
                    pdf.rect(15, yPos - 3, 180, 8, 'F');
                }

                pdf.setFont(undefined, 'bold');
                pdf.text(this.cleanTextForPDF(stat.label), 20, yPos);

                pdf.setFont(undefined, 'normal');
                pdf.setTextColor(40, 167, 69); // Site's green color
                pdf.text(this.cleanTextForPDF(stat.value), 120, yPos);
                pdf.setTextColor(0, 0, 0);

                yPos += 10;
            });

            return yPos + 5;

        } finally {
            // Restore original measurements section state
            if (measurementsSection && originalClass) {
                measurementsSection.className = originalClass;
                if (originalDisplay) {
                    measurementsSection.style.display = originalDisplay;
                }
            }
        }
    }

    async addMeasurementsChart(pdf, startY = 120) {
        // Section header for chart
        pdf.setFillColor(236, 240, 241);
        pdf.rect(15, startY - 5, 180, 8, 'F');

        pdf.setTextColor(52, 73, 94);
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.text('Measurements Progress Chart', 20, startY);

        startY += 10;

        const chartCanvas = document.getElementById('measurementChart');
        if (!chartCanvas) {
            pdf.setTextColor(231, 76, 60);
            pdf.setFontSize(10);
            pdf.text('Measurements chart element not found', 20, startY + 10);
            pdf.setTextColor(0, 0, 0);
            return startY + 30;
        }

        // Store original display states to restore later
        const originalStates = {};

        try {
            // Make measurements section visible temporarily for chart capture
            const measurementsSection = document.getElementById('measurements-section');

            if (measurementsSection && !measurementsSection.classList.contains('active')) {
                console.log('Making measurements section visible for chart capture...');

                // Store original states
                originalStates.measurementsSectionDisplay = measurementsSection.style.display;
                originalStates.measurementsSectionClass = measurementsSection.className;

                // Make measurements section visible
                measurementsSection.style.display = 'block';
                measurementsSection.classList.add('active');

                // Wait for layout
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Ensure chart container is visible
            const chartContainer = chartCanvas.closest('.chart-container');
            const cardBody = chartCanvas.closest('.card-body');

            if (chartContainer) {
                originalStates.chartContainerDisplay = chartContainer.style.display;
                originalStates.chartContainerVisibility = chartContainer.style.visibility;
                chartContainer.style.display = 'block';
                chartContainer.style.visibility = 'visible';
                chartContainer.style.height = '400px';
            }

            if (cardBody) {
                originalStates.cardBodyDisplay = cardBody.style.display;
                cardBody.style.display = 'block';
            }

            // Set canvas size explicitly
            originalStates.canvasDisplay = chartCanvas.style.display;
            chartCanvas.style.display = 'block';

            // Wait for layout to update
            await new Promise(resolve => setTimeout(resolve, 500));

            // Check canvas dimensions after making visible
            const rect = chartCanvas.getBoundingClientRect();
            console.log('Measurements chart canvas dimensions:', rect.width, 'x', rect.height);

            if (rect.width === 0 || rect.height === 0) {
                pdf.setTextColor(231, 76, 60);
                pdf.setFontSize(10);
                pdf.text('Measurements chart has no dimensions after making visible', 20, startY + 10);
                pdf.setTextColor(0, 0, 0);
                return startY + 30;
            }

            // Check if Chart.js instance exists and update it
            const chartInstance = Chart.getChart(chartCanvas);
            if (chartInstance) {
                chartInstance.resize();
                chartInstance.update('none');
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            console.log('Capturing measurements chart with html2canvas...');
            const canvas = await html2canvas(chartCanvas, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true,
                allowTaint: false,
                logging: false,
                width: rect.width,
                height: rect.height
            });

            if (canvas.width === 0 || canvas.height === 0) {
                throw new Error('Generated canvas has no dimensions');
            }

            const imgData = canvas.toDataURL('image/png', 0.9);
            if (!imgData || imgData === 'data:,' || imgData.length < 100) {
                throw new Error('Invalid image data generated');
            }

            const imgWidth = 170;
            const imgHeight = 100; // Optimized height for perfect proportion

            pdf.addImage(imgData, 'PNG', 20, startY + 10, imgWidth, imgHeight);

            console.log('Measurements chart successfully added to PDF');
            return startY + imgHeight + 25;

        } catch (error) {
            console.error('Error adding measurements chart to PDF:', error);
            pdf.setTextColor(231, 76, 60);
            pdf.setFontSize(10);
            pdf.text('Measurements chart could not be generated', 20, startY + 10);
            pdf.setFontSize(8);
            pdf.text(`Error: ${error.message}`, 20, startY + 20);
            pdf.setTextColor(0, 0, 0);
            return startY + 35;
        } finally {
            // Restore original display states
            const measurementsSection = document.getElementById('measurements-section');
            if (measurementsSection && originalStates.measurementsSectionClass) {
                measurementsSection.className = originalStates.measurementsSectionClass;
                if (originalStates.measurementsSectionDisplay) {
                    measurementsSection.style.display = originalStates.measurementsSectionDisplay;
                }
            }

            const chartContainer = chartCanvas.closest('.chart-container');
            if (chartContainer) {
                if (originalStates.chartContainerDisplay !== undefined) {
                    chartContainer.style.display = originalStates.chartContainerDisplay;
                }
                if (originalStates.chartContainerVisibility !== undefined) {
                    chartContainer.style.visibility = originalStates.chartContainerVisibility;
                }
            }

            const cardBody = chartCanvas.closest('.card-body');
            if (cardBody && originalStates.cardBodyDisplay !== undefined) {
                cardBody.style.display = originalStates.cardBodyDisplay;
            }

            if (originalStates.canvasDisplay !== undefined) {
                chartCanvas.style.display = originalStates.canvasDisplay;
            }
        }
    }

    async addMeasurementsTable(pdf, startY = 55) {
        const table = document.getElementById('measurementEntriesTable');
        let yPos = startY;

        // Section header with background
        pdf.setFillColor(236, 240, 241);
        pdf.rect(15, startY - 5, 180, 8, 'F');

        pdf.setTextColor(52, 73, 94);
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.text(this.cleanTextForPDF('Recent Measurement Entries'), 20, startY);

        yPos = startY + 15;

        // Table header
        pdf.setFillColor(40, 167, 69); // Site's green color
        pdf.rect(15, yPos - 5, 180, 8, 'F');

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'bold');
        pdf.text('Date', 20, yPos);
        pdf.text('Type', 65, yPos);
        pdf.text('Value', 130, yPos);
        pdf.text('Unit', 170, yPos);

        yPos += 10;
        pdf.setTextColor(0, 0, 0);
        pdf.setFont(undefined, 'normal');

        let measurementData = [];

        if (table && table.querySelectorAll('tbody tr').length > 0) {
            // Use DOM table if available and populated
            const rows = table.querySelectorAll('tbody tr');
            rows.forEach((row, rowIndex) => {
                if (rowIndex >= 15) return; // Limit entries
                const cells = row.querySelectorAll('td');
                if (cells.length >= 4) {
                    measurementData.push({
                        date: this.cleanTextForPDF(cells[0]?.textContent?.trim()) || '',
                        type: this.cleanTextForPDF(cells[1]?.textContent?.trim()) || '',
                        value: this.cleanTextForPDF(cells[2]?.textContent?.trim()) || '',
                        unit: this.cleanTextForPDF(cells[3]?.textContent?.trim()) || ''
                    });
                }
            });
        } else if (this.measurementsManager && this.measurementsManager.getAllRecentMeasurements) {
            // Fallback: get data directly from measurements manager
            console.log('Table not populated, getting data directly from measurements manager...');
            const recentMeasurements = await this.measurementsManager.getAllRecentMeasurements(15);
            measurementData = recentMeasurements.map(measurement => ({
                date: new Date(measurement.date).toLocaleDateString(),
                type: measurement.type || 'N/A',
                value: measurement.value?.toString() || 'N/A',
                unit: measurement.unit || 'N/A'
            }));
        }

        if (measurementData.length > 0) {
            measurementData.forEach((measurement, rowIndex) => {
                if (yPos > 270) {
                    pdf.addPage();
                    this.addPDFHeader(pdf, 'Measurements Report');
                    yPos = 60;
                }

                // Alternating row colors without borders
                if (rowIndex % 2 === 0) {
                    pdf.setFillColor(249, 249, 249);
                    pdf.rect(15, yPos - 3, 180, 8, 'F');
                }

                let { date, type, value, unit } = measurement;

                // Truncate type if too long to fit in column (max ~60 units width)
                if (type.length > 18) {
                    type = type.substring(0, 18) + '...';
                }

                // Clean up value to ensure proper formatting
                const valueMatch = value.match(/(\d+\.?\d*)/);
                if (valueMatch) {
                    value = valueMatch[1];
                }

                pdf.setFontSize(9);
                pdf.text(date, 20, yPos);
                pdf.text(type, 65, yPos);
                pdf.text(value, 130, yPos);
                pdf.text(unit, 170, yPos);
                yPos += 8;
            });
        } else {
            // If no table found, add a message
            pdf.setTextColor(128, 128, 128);
            pdf.setFontSize(10);
            pdf.text('No measurement data available', 20, startY + 10);
            pdf.setTextColor(0, 0, 0);
            yPos = startY + 20;
        }

        return yPos + 10;
    }
}

// Export for use in other modules
window.PDFReportGenerator = PDFReportGenerator;