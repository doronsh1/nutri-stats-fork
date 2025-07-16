document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const addFoodForm = document.getElementById('addFoodForm');
    const editFoodForm = document.getElementById('editFoodForm');
    const foodsTableBody = document.getElementById('foodsTableBody');
    const editFoodModal = new bootstrap.Modal(document.getElementById('editFoodModal'));
    const searchFood = document.getElementById('searchFood');

    let foods = [];
    let filteredFoods = [];
    let unitSystem = 'metric'; // Default to metric

    // Load user settings
    async function loadUserSettings() {
        try {
            const response = await fetch('/api/settings');
            if (response.ok) {
                const settings = await response.json();
                unitSystem = settings.unitSystem || 'metric';
                updateUnitLabels();
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    // Update unit labels based on unit system
    function updateUnitLabels() {
        const unit = unitSystem === 'metric' ? 'g' : 'lb';
        document.querySelectorAll('.unit-label').forEach(label => {
            label.textContent = unit;
        });
    }

    // Load foods from server
    async function loadFoods() {
        try {
            const response = await fetch('/api/foods');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            // Ensure we're getting the foods array from the response
            foods = Array.isArray(data) ? data : (data.foods || []);
            if (!Array.isArray(foods)) {
                console.error('Invalid foods data structure:', foods);
                foods = [];
            }
            
            // Apply current search filter if exists
            const searchTerm = document.getElementById('searchFood').value.toLowerCase();
            filteredFoods = searchTerm ? 
                foods.filter(food => food.item.toLowerCase().includes(searchTerm)) : 
                [...foods];
            
            console.log(`Loaded ${foods.length} food items, displaying ${filteredFoods.length} after filtering`);
            displayFoods();
        } catch (error) {
            console.error('Error loading foods:', error);
            foods = [];
            filteredFoods = [];
            foodsTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-danger">
                        Error loading foods database. Please try refreshing the page.
                    </td>
                </tr>
            `;
        }
    }

    // Display foods in table
    function displayFoods() {
        foodsTableBody.innerHTML = '';
        if (!Array.isArray(filteredFoods)) {
            console.error('filteredFoods is not an array:', filteredFoods);
            filteredFoods = [];
            return;
        }
        
        if (filteredFoods.length === 0) {
            const searchTerm = document.getElementById('searchFood').value;
            foodsTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        ${searchTerm ? `No food items found matching "${searchTerm}"` : 'No food items found.'}
                    </td>
                </tr>
            `;
            return;
        }
        
        filteredFoods.forEach((food, index) => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-index', index);
            tr.innerHTML = `
                <td>
                    <span class="food-value">${food.item || ''}</span>
                    <input type="text" class="form-control food-edit d-none" value="${food.item || ''}" style="text-align: left; direction: ltr;">
                </td>
                <td>
                    <span class="food-value">${food.amount || ''}</span>
                    <input type="number" class="form-control food-edit d-none" value="${food.amount || ''}" step="1">
                </td>
                <td>
                    <span class="food-value">${food.calories || ''}</span>
                    <input type="number" class="form-control food-edit d-none" value="${food.calories || ''}" step="0.1">
                </td>
                <td>
                    <span class="food-value">${food.carbs || ''}</span>
                    <input type="number" class="form-control food-edit d-none" value="${food.carbs || ''}" step="0.1">
                </td>
                <td>
                    <span class="food-value">${food.protein || ''}</span>
                    <input type="number" class="form-control food-edit d-none" value="${food.protein || ''}" step="0.1">
                </td>
                <td>
                    <span class="food-value">${food.proteinGeneral || ''}</span>
                    <input type="number" class="form-control food-edit d-none" value="${food.proteinGeneral || ''}" step="0.1">
                </td>
                <td>
                    <span class="food-value">${food.fat || ''}</span>
                    <input type="number" class="form-control food-edit d-none" value="${food.fat || ''}" step="0.1">
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
            foodsTableBody.appendChild(tr);

            // Add event listeners for this row
            const editBtn = tr.querySelector('.edit-btn');
            const saveBtn = tr.querySelector('.save-btn');
            const cancelBtn = tr.querySelector('.cancel-btn');
            const deleteBtn = tr.querySelector('.delete-btn');

            editBtn.addEventListener('click', () => handleEditInline(tr));
            saveBtn.addEventListener('click', () => handleSaveInline(tr));
            cancelBtn.addEventListener('click', () => handleCancelInline(tr));
            deleteBtn.addEventListener('click', handleDelete);
        });
    }

    // Handle search
    function handleSearch(event) {
        const searchTerm = event.target.value.toLowerCase();
        if (!Array.isArray(foods)) {
            console.error('foods is not an array:', foods);
            return;
        }
        filteredFoods = searchTerm ? 
            foods.filter(food => food.item.toLowerCase().includes(searchTerm)) : 
            [...foods];
        displayFoods();
    }

    // Add food
    async function handleAddFood(event) {
        event.preventDefault();
        const newFood = {
            item: document.getElementById('item').value,
            amount: parseFloat(document.getElementById('amount').value),
            calories: parseFloat(document.getElementById('calories').value) || null,
            carbs: parseFloat(document.getElementById('carbs').value) || null,
            protein: parseFloat(document.getElementById('protein').value) || null,
            proteinGeneral: parseFloat(document.getElementById('proteinGeneral').value) || null,
            fat: parseFloat(document.getElementById('fat').value) || null
        };

        try {
            const response = await fetch('/api/foods', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newFood)
            });

            if (response.ok) {
                addFoodForm.reset();
                await loadFoods();
            } else {
                throw new Error('Failed to add food');
            }
        } catch (error) {
            console.error('Error adding food:', error);
            alert('Error adding new food. Please try again.');
        }
    }

    // Edit food
    function handleEdit(event) {
        const index = parseInt(event.target.dataset.index);
        const food = filteredFoods[index];
        const originalIndex = foods.findIndex(f => f.item === food.item);

        document.getElementById('editIndex').value = originalIndex;
        document.getElementById('editItem').value = food.item;
        document.getElementById('editAmount').value = food.amount;
        document.getElementById('editCalories').value = food.calories || '';
        document.getElementById('editCarbs').value = food.carbs || '';
        document.getElementById('editProtein').value = food.protein || '';
        document.getElementById('editProteinGeneral').value = food.proteinGeneral || '';
        document.getElementById('editFat').value = food.fat || '';

        editFoodModal.show();
    }

    // Save edited food
    async function handleSaveEdit() {
        const index = parseInt(document.getElementById('editIndex').value);
        const updatedFood = {
            item: document.getElementById('editItem').value,
            amount: parseFloat(document.getElementById('editAmount').value),
            calories: parseFloat(document.getElementById('editCalories').value) || null,
            carbs: parseFloat(document.getElementById('editCarbs').value) || null,
            protein: parseFloat(document.getElementById('editProtein').value) || null,
            proteinGeneral: parseFloat(document.getElementById('editProteinGeneral').value) || null,
            fat: parseFloat(document.getElementById('editFat').value) || null
        };

        try {
            const response = await fetch(`/api/foods/${index}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedFood)
            });

            if (response.ok) {
                editFoodModal.hide();
                await loadFoods(); // This will now maintain the search filter
            } else {
                throw new Error('Failed to update food');
            }
        } catch (error) {
            console.error('Error updating food:', error);
            alert('Error updating food. Please try again.');
        }
    }

    // Delete food
    async function handleDelete(event) {
        const row = event.target.closest('tr');
        if (!row) return;

        if (!confirm('Are you sure you want to delete this food?')) return;

        try {
            const index = parseInt(row.getAttribute('data-index'));
            const food = filteredFoods[index];
            const originalIndex = foods.findIndex(f => 
                f.item === food.item && 
                f.amount === food.amount && 
                f.calories === food.calories
            );

            if (originalIndex === -1) {
                throw new Error('Could not find food item to delete');
            }

            const response = await fetch(`/api/foods/${originalIndex}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await loadFoods(); // This will maintain the search filter
            } else {
                throw new Error('Failed to delete food');
            }
        } catch (error) {
            console.error('Error deleting food:', error);
            alert('Error deleting food. Please try again.');
        }
    }

    // Handle inline editing
    function handleEditInline(row) {
        // Hide all other edit forms if any are open
        document.querySelectorAll('tr.editing').forEach(editingRow => {
            if (editingRow !== row) {
                handleCancelInline(editingRow);
            }
        });

        // Show edit form
        row.classList.add('editing');
        row.querySelectorAll('.food-value').forEach(span => span.classList.add('d-none'));
        row.querySelectorAll('.food-edit').forEach(input => input.classList.remove('d-none'));
        row.querySelector('.edit-btn').classList.add('d-none');
        row.querySelector('.save-btn').classList.remove('d-none');
        row.querySelector('.cancel-btn').classList.remove('d-none');
    }

    // Handle saving inline edit
    async function handleSaveInline(row) {
        const index = parseInt(row.getAttribute('data-index'));
        const originalIndex = foods.findIndex(f => f.item === filteredFoods[index].item);
        
        const inputs = row.querySelectorAll('.food-edit');
        const updatedFood = {
            item: inputs[0].value,
            amount: parseFloat(inputs[1].value) || 0,
            calories: parseFloat(inputs[2].value) || null,
            carbs: parseFloat(inputs[3].value) || null,
            protein: parseFloat(inputs[4].value) || null,
            proteinGeneral: parseFloat(inputs[5].value) || null,
            fat: parseFloat(inputs[6].value) || null
        };

        try {
            const response = await fetch(`/api/foods/${originalIndex}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedFood)
            });

            if (response.ok) {
                await loadFoods(); // This will maintain the search filter
            } else {
                throw new Error('Failed to update food');
            }
        } catch (error) {
            console.error('Error updating food:', error);
            alert('Error updating food. Please try again.');
            handleCancelInline(row);
        }
    }

    // Handle canceling inline edit
    function handleCancelInline(row) {
        row.classList.remove('editing');
        row.querySelectorAll('.food-value').forEach(span => span.classList.remove('d-none'));
        row.querySelectorAll('.food-edit').forEach(input => input.classList.add('d-none'));
        row.querySelector('.edit-btn').classList.remove('d-none');
        row.querySelector('.save-btn').classList.add('d-none');
        row.querySelector('.cancel-btn').classList.add('d-none');
    }

    // Event listeners
    addFoodForm.addEventListener('submit', handleAddFood);
    document.getElementById('saveEdit').addEventListener('click', handleSaveEdit);
    searchFood.addEventListener('input', handleSearch);

    // Initial load
    loadUserSettings().then(() => loadFoods());
}); 