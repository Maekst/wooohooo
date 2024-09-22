document.addEventListener('DOMContentLoaded', function () {
    const accessToken = 'patbI0YRIhnNrOHnw.12bb1ce47073abd3de704a1d0cee8f4253ec3af875b7f7fa7759f6ab4a24e65f'; // Replace with your Airtable Personal Access Token (PAT)
    const baseId = 'app6dlRaqhC21Gi0m'; // Replace with your Airtable Base ID
    const tableName = 'Parts'; // Table name in Airtable
    const resultsDiv = document.getElementById('results');

    let allWheels = [];
    let selectedMake = '';
    let selectedModel = '';
    let selectedSize = '';

    // Fetch all wheels from Airtable
    async function fetchAllWheels() {
        const url = `https://api.airtable.com/v0/${baseId}/${tableName}`;
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data.records;
    }

    // Display wheels on the page
    function displayWheels(wheels) {
        resultsDiv.innerHTML = '';
        if (wheels.length === 0) {
            resultsDiv.innerHTML = '<p>No wheels found matching the filters.</p>';
        } else {
            wheels.forEach(wheel => {
                const wheelElement = document.createElement('div');
                const imageUrl = wheel.fields['Wheel Image'] && wheel.fields['Wheel Image'][0].url;
                const wheelName = wheel.fields['Wheel Name'];
                const carMake = wheel.fields['Car Make'];
                const carModel = wheel.fields['Car Model'];
                const wheelSize = wheel.fields['Wheel Size'];
                const buyUrl = wheel.fields['Buy URL'];

                wheelElement.classList.add('wheel');
                wheelElement.innerHTML = `
                    <img src="${imageUrl}" alt="${wheelName}">
                    <h3>${wheelName}</h3>
                    <p><strong>Make:</strong> ${carMake}</p>
                    <p><strong>Model:</strong> ${carModel}</p>
                    <p><strong>Size:</strong> ${wheelSize}</p>
                    ${buyUrl ? `<a href="${buyUrl}" target="_blank" class="buy-button">Buy Now</a>` : ''}
                `;
                resultsDiv.appendChild(wheelElement);

                setTimeout(() => {
                    wheelElement.classList.add('visible');
                }, 10);
            });
        }
    }

    // Filter wheels based on selected filters
    function filterWheels() {
        return allWheels.filter(wheel => {
            const carMake = wheel.fields['Car Make'];
            const carModel = wheel.fields['Car Model'];
            const wheelSize = wheel.fields['Wheel Size'];

            return (!selectedMake || carMake === selectedMake) &&
                   (!selectedModel || carModel === selectedModel) &&
                   (!selectedSize || wheelSize === selectedSize);
        });
    }

    // Populate filter options dynamically
    function populateFilterOptions(field, parentValue) {
        const uniqueValues = [...new Set(allWheels.map(record => {
            if (field === 'Car Model') {
                return record.fields['Car Make'] === parentValue ? record.fields[field] : null;
            } else if (field === 'Wheel Size') {
                return record.fields['Car Model'] === parentValue ? record.fields[field] : null;
            }
            return record.fields[field];
        }).filter(v => v))];

        return uniqueValues.map(val => {
            const optionButton = document.createElement('button');
            optionButton.textContent = val;
            optionButton.className = 'option-button';
            optionButton.onclick = () => {
                if (field === 'Car Make') {
                    selectedMake = val;
                    selectedModel = '';
                    selectedSize = '';
                    document.getElementById('model-button').style.display = 'inline-block';
                    document.getElementById('size-button').style.display = 'none';
                    updateSelectedOptions();

                    const models = populateFilterOptions('Car Model', selectedMake);
                    updateOptions('model-options', models);
                    document.getElementById('make-button').classList.add('selected');
                    document.getElementById('model-button').classList.remove('selected');
                    document.getElementById('size-button').classList.remove('selected');
                } else if (field === 'Car Model') {
                    selectedModel = val;
                    selectedSize = '';
                    document.getElementById('size-button').style.display = 'inline-block';
                    updateSelectedOptions();

                    const sizes = populateFilterOptions('Wheel Size', selectedModel);
                    updateOptions('size-options', sizes);
                    document.getElementById('model-button').classList.add('selected');
                    document.getElementById('make-button').classList.remove('selected');
                    document.getElementById('size-button').classList.remove('selected');
                } else if (field === 'Wheel Size') {
                    selectedSize = val;
                    updateSelectedOptions();
                    document.getElementById('size-button').classList.add('selected');
                    document.getElementById('make-button').classList.remove('selected');
                    document.getElementById('model-button').classList.remove('selected');
                }

                const filteredWheels = filterWheels();
                displayWheels(filteredWheels);
                closeOptions();
            };
            return optionButton;
        });
    }

    // Update filter options in the DOM
    function updateOptions(optionDivId, options) {
        const optionsDiv = document.getElementById(optionDivId);
        optionsDiv.innerHTML = '';
        options.forEach(option => optionsDiv.appendChild(option));
        optionsDiv.style.display = 'block';
    }

    // Update filter button labels
    function updateSelectedOptions() {
        document.getElementById('make-button').textContent = selectedMake || 'Select Make';
        document.getElementById('model-button').textContent = selectedModel || 'Select Model';
        document.getElementById('size-button').textContent = selectedSize || 'Select Wheel Size';

        document.getElementById('model-button').style.display = selectedMake ? 'inline-block' : 'none';
        document.getElementById('size-button').style.display = selectedModel ? 'inline-block' : 'none';
    }

    // Close filter options
    function closeOptions() {
        document.querySelectorAll('.filter-options').forEach(option => {
            option.style.display = 'none';
            option.innerHTML = '';
        });
    }

    // Reset all filters
    function resetFilters() {
        selectedMake = '';
        selectedModel = '';
        selectedSize = '';
        updateSelectedOptions();
        displayWheels(allWheels);
        closeOptions();

        // Remove selected state from all buttons
        document.querySelectorAll('.filter-button').forEach(button => {
            button.classList.remove('selected');
        });
    }

    // Event listeners for filter buttons
    document.getElementById('reset-button').addEventListener('click', resetFilters);

    document.getElementById('make-button').addEventListener('click', function () {
        const options = populateFilterOptions('Car Make');
        updateOptions('make-options', options);
    });

    document.getElementById('model-button').addEventListener('click', function () {
        if (selectedMake) {
            const options = populateFilterOptions('Car Model', selectedMake);
            updateOptions('model-options', options);
        }
    });

    document.getElementById('size-button').addEventListener('click', function () {
        if (selectedModel) {
            const options = populateFilterOptions('Wheel Size', selectedModel);
            updateOptions('size-options', options);
        }
    });

    // Initialize the app
    async function initialize() {
        try {
            allWheels = await fetchAllWheels();
            displayWheels(allWheels);
        } catch (error) {
            console.error('Error fetching wheels:', error);
            resultsDiv.innerHTML = '<p>Failed to load wheels. Please check your connection or settings.</p>';
        }
    }

    initialize();
});