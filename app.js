// State management
let mockCars = [];
let currentCars = [];
let favorites = new Set();
let currentView = 'grid';
let map = null;
let mapMarkers = [];

// Enhanced filters object
let filters = {
    search: '',
    minPrice: '',
    maxPrice: '',
    monthlyPayment: '',
    makes: [],
    bodyType: '',
    fuelType: '',
    mileageRange: '',
    yearRange: '',
    transmission: '',
    drivetrain: '',
    features: [],
    condition: '',
    colors: [],
    radius: '',
    daysOnMarket: '',
    priceReduced: ''
};

// DOM elements
const searchInput = document.getElementById('searchInput');
const filterToggle = document.getElementById('filterToggle');
const filtersSection = document.getElementById('filtersSection');
const carsGrid = document.getElementById('carsGrid');
const mapContainer = document.getElementById('mapContainer');
const resultsTitle = document.getElementById('resultsTitle');
const noResults = document.getElementById('noResults');
const favoritesCount = document.getElementById('favoritesCount');
const sortSelect = document.getElementById('sortSelect');
const gridViewBtn = document.getElementById('gridViewBtn');
const mapViewBtn = document.getElementById('mapViewBtn');
const carModal = document.getElementById('carModal');
const modalClose = document.getElementById('modalClose');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');
const activeFilterCount = document.getElementById('activeFilterCount');

// Enhanced car image URLs
const carImageUrls = {
    'Toyota Camry': 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop',
    'Toyota Corolla': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=300&fit=crop',
    'Toyota RAV4': 'https://images.unsplash.com/photo-1611651071253-7a4de5cb2b46?w=400&h=300&fit=crop',
    'Honda Civic': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=300&fit=crop',
    'Honda Accord': 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop',
    'Ford F-150': 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400&h=300&fit=crop',
    'Tesla Model 3': 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=300&fit=crop',
    'Tesla Model Y': 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=400&h=300&fit=crop',
    'BMW X3': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop',
    'Mercedes-Benz C-Class': 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=300&fit=crop'
};

function getCarImage(make, model) {
    const carKey = `${make} ${model}`;
    
    if (carImageUrls[carKey]) {
        return carImageUrls[carKey];
    }
    
    const makeImages = {
        'Toyota': 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop',
        'Honda': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=300&fit=crop',
        'Ford': 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400&h=300&fit=crop',
        'Tesla': 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=300&fit=crop',
        'BMW': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop',
        'Mercedes-Benz': 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=300&fit=crop',
        'Chevrolet': 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400&h=300&fit=crop',
        'Audi': 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=400&h=300&fit=crop'
    };
    
    return makeImages[make] || 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=400&h=300&fit=crop';
}

// Initialize data and event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Check if generateRealisticCars is available (from realistic-cars.js)
    if (typeof generateRealisticCars === 'function') {
        // Initialize realistic car data
        mockCars = generateRealisticCars(150);
    } else {
        console.warn('generateRealisticCars function not found. Using fallback data.');
        // Fallback: generate basic car data if the external file isn't loaded
        mockCars = generateFallbackCars(150);
    }
    
    currentCars = [...mockCars];
    
    // Render initial cars
    renderCars();
    updateResultsTitle();
    updateMarketInsights();
    
    // Initialize event listeners
    initializeEventListeners();
    initializeMultiSelects();
    initializeRangeSliders();
    
    // Initialize map
    setTimeout(initializeMap, 100);
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

// Fallback car generation if realistic-cars.js isn't loaded
function generateFallbackCars(count = 150) {
    const makes = ['Toyota', 'Honda', 'Ford', 'Tesla', 'BMW', 'Mercedes-Benz', 'Chevrolet', 'Audi'];
    const models = {
        'Toyota': ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Prius'],
        'Honda': ['Civic', 'Accord', 'CR-V', 'Pilot', 'Fit'],
        'Ford': ['F-150', 'Explorer', 'Escape', 'Mustang', 'Focus'],
        'Tesla': ['Model 3', 'Model Y', 'Model S', 'Model X'],
        'BMW': ['X3', '3 Series', '5 Series', 'X5', 'i3'],
        'Mercedes-Benz': ['C-Class', 'E-Class', 'GLE', 'A-Class', 'S-Class'],
        'Chevrolet': ['Silverado', 'Equinox', 'Malibu', 'Tahoe', 'Camaro'],
        'Audi': ['A4', 'Q5', 'A6', 'Q7', 'A3']
    };
    
    const bodyTypes = ['Sedan', 'SUV', 'Truck', 'Coupe', 'Hatchback', 'Wagon'];
    const fuelTypes = ['Gasoline', 'Hybrid', 'Electric', 'Diesel'];
    const transmissions = ['Automatic', 'Manual', 'CVT'];
    const drivetrains = ['FWD', 'RWD', 'AWD', '4WD'];
    const colors = ['Black', 'White', 'Silver', 'Gray', 'Red', 'Blue'];
    const features = ['Sunroof', 'Leather Seats', 'Navigation', 'Backup Camera', 'Bluetooth', 'Heated Seats', 'Remote Start', 'Apple CarPlay'];
    const conditions = ['New', 'Used', 'Certified'];
    
    const locations = [
        'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ',
        'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA', 'Dallas, TX', 'San Jose, CA'
    ];
    
    const dealers = [
        'AutoMax Motors', 'Premier Auto Group', 'Elite Car Sales', 'Metro Motors',
        'City Auto Center', 'Valley Cars', 'Highway Auto', 'Prestige Motors'
    ];

    const cars = [];
    
    for (let i = 0; i < count; i++) {
        const make = makes[Math.floor(Math.random() * makes.length)];
        const model = models[make][Math.floor(Math.random() * models[make].length)];
        const year = 2018 + Math.floor(Math.random() * 8);
        const mileage = Math.floor(Math.random() * 80000) + 1000;
        const basePrice = 15000 + Math.floor(Math.random() * 60000);
        
        // Create price history
        const priceHistory = [];
        let currentPrice = basePrice;
        for (let j = 0; j < 5; j++) {
            priceHistory.push(currentPrice);
            currentPrice += (Math.random() - 0.6) * 2000;
        }
        
        const car = {
            id: i + 1,
            make,
            model,
            year,
            price: Math.max(10000, Math.round(currentPrice)),
            mileage,
            mpg: `${20 + Math.floor(Math.random() * 20)}/${28 + Math.floor(Math.random() * 25)} mpg`,
            location: locations[Math.floor(Math.random() * locations.length)],
            dealer: dealers[Math.floor(Math.random() * dealers.length)],
            rating: (3.5 + Math.random() * 1.5).toFixed(1),
            daysOnMarket: Math.floor(Math.random() * 90) + 1,
            bodyType: bodyTypes[Math.floor(Math.random() * bodyTypes.length)],
            fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
            transmission: transmissions[Math.floor(Math.random() * transmissions.length)],
            drivetrain: drivetrains[Math.floor(Math.random() * drivetrains.length)],
            exteriorColor: colors[Math.floor(Math.random() * colors.length)],
            interiorColor: colors[Math.floor(Math.random() * colors.length)],
            condition: conditions[Math.floor(Math.random() * conditions.length)],
            features: features.sort(() => 0.5 - Math.random()).slice(0, 3 + Math.floor(Math.random() * 5)),
            priceHistory,
            vin: 'VIN' + Math.random().toString(36).substr(2, 14).toUpperCase(),
            coordinates: [
                40.7128 + (Math.random() - 0.5) * 10,
                -74.0060 + (Math.random() - 0.5) * 20
            ]
        };
        
        cars.push(car);
    }
    
    return cars;
}

function initializeEventListeners() {
    // Search functionality
    searchInput.addEventListener('input', handleSearch);
    
    // Filter toggle
    filterToggle.addEventListener('click', toggleFilters);
    
    // Clear filters
    clearFiltersBtn.addEventListener('click', clearAllFilters);
    
    // Sort functionality
    sortSelect.addEventListener('change', handleSort);
    
    // View toggle
    gridViewBtn.addEventListener('click', () => switchView('grid'));
    mapViewBtn.addEventListener('click', () => switchView('map'));
    
    // Modal functionality
    modalClose.addEventListener('click', closeModal);
    carModal.addEventListener('click', (e) => {
        if (e.target === carModal) closeModal();
    });
    
    // Simple filter inputs
    const simpleFilters = [
        'minPrice', 'maxPrice', 'bodyTypeFilter', 'fuelTypeFilter',
        'transmissionFilter', 'drivetrainFilter', 'conditionFilter',
        'daysOnMarketFilter', 'priceReducedFilter'
    ];
    
    simpleFilters.forEach(filterId => {
        const element = document.getElementById(filterId);
        if (element) {
            element.addEventListener('change', applyFilters);
        }
    });
}

function initializeMultiSelects() {
    // Initialize make multi-select
    initializeMultiSelect('make', 'makeDisplay', 'makeOptions', 'makeSelectedTags');
    
    // Initialize features multi-select
    initializeMultiSelect('features', 'featuresDisplay', 'featuresOptions', 'featuresSelectedTags');
    
    // Initialize color multi-select
    initializeMultiSelect('color', 'colorDisplay', 'colorOptions', 'colorSelectedTags');
}

function initializeMultiSelect(filterType, displayId, optionsId, tagsId) {
    const display = document.getElementById(displayId);
    const options = document.getElementById(optionsId);
    const tagsContainer = document.getElementById(tagsId);
    
    if (!display || !options || !tagsContainer) return;
    
    // Toggle options visibility
    display.addEventListener('click', () => {
        const isVisible = options.style.display === 'block';
        options.style.display = isVisible ? 'none' : 'block';
    });
    
    // Handle option selection
    options.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
            updateMultiSelectDisplay(filterType, displayId, optionsId, tagsId);
            applyFilters();
        }
    });
    
    // Close options when clicking outside
    document.addEventListener('click', (e) => {
        if (!display.contains(e.target) && !options.contains(e.target)) {
            options.style.display = 'none';
        }
    });
}

function updateMultiSelectDisplay(filterType, displayId, optionsId, tagsId) {
    const display = document.getElementById(displayId);
    const options = document.getElementById(optionsId);
    const tagsContainer = document.getElementById(tagsId);
    
    const selectedOptions = Array.from(options.querySelectorAll('input[type="checkbox"]:checked'));
    const selectedValues = selectedOptions.map(option => option.value);
    
    // Update filter state
    if (filterType === 'make') {
        filters.makes = selectedValues;
    } else if (filterType === 'features') {
        filters.features = selectedValues;
    } else if (filterType === 'color') {
        filters.colors = selectedValues;
    }
    
    // Update display text
    const displayText = selectedValues.length > 0 
        ? `${selectedValues.length} selected` 
        : `Select ${filterType === 'make' ? 'Makes' : filterType === 'features' ? 'Features' : 'Colors'}`;
    display.querySelector('span').textContent = displayText;
    
    // Update tags
    tagsContainer.innerHTML = '';
    selectedValues.forEach(value => {
        const tag = document.createElement('span');
        tag.className = 'selected-tag';
        tag.innerHTML = `
            ${value}
            <button class="remove-tag" onclick="removeTag('${filterType}', '${value}', '${displayId}', '${optionsId}', '${tagsId}')">×</button>
        `;
        tagsContainer.appendChild(tag);
    });
}

function removeTag(filterType, value, displayId, optionsId, tagsId) {
    const options = document.getElementById(optionsId);
    const checkbox = options.querySelector(`input[value="${value}"]`);
    if (checkbox) {
        checkbox.checked = false;
        updateMultiSelectDisplay(filterType, displayId, optionsId, tagsId);
        applyFilters();
    }
}

function initializeRangeSliders() {
    // Monthly payment slider
    const monthlyPaymentRange = document.getElementById('monthlyPaymentRange');
    const monthlyPaymentValue = document.getElementById('monthlyPaymentValue');
    
    if (monthlyPaymentRange && monthlyPaymentValue) {
        monthlyPaymentRange.addEventListener('input', (e) => {
            const value = e.target.value;
            monthlyPaymentValue.textContent = `$${parseInt(value).toLocaleString()}`;
            filters.monthlyPayment = value;
            applyFilters();
        });
    }
    
    // Mileage slider
    const mileageRange = document.getElementById('mileageRange');
    const mileageValue = document.getElementById('mileageValue');
    
    if (mileageRange && mileageValue) {
        mileageRange.addEventListener('input', (e) => {
            const value = e.target.value;
            mileageValue.textContent = `${parseInt(value).toLocaleString()} mi`;
            filters.mileageRange = value;
            applyFilters();
        });
    }
    
    // Year slider
    const yearRange = document.getElementById('yearRange');
    const yearValue = document.getElementById('yearValue');
    
    if (yearRange && yearValue) {
        yearRange.addEventListener('input', (e) => {
            const value = e.target.value;
            yearValue.textContent = value;
            filters.yearRange = value;
            applyFilters();
        });
    }
    
    // Radius slider
    const radiusRange = document.getElementById('radiusRange');
    const radiusValue = document.getElementById('radiusValue');
    
    if (radiusRange && radiusValue) {
        radiusRange.addEventListener('input', (e) => {
            const value = e.target.value;
            radiusValue.textContent = `${value} mi`;
            filters.radius = value;
            applyFilters();
        });
    }
}

// Search functionality
function handleSearch(e) {
    filters.search = e.target.value;
    applyFilters();
}

// Filter toggle
function toggleFilters() {
    const isVisible = filtersSection.style.display !== 'none';
    filtersSection.style.display = isVisible ? 'none' : 'block';
}

// Clear all filters
function clearAllFilters() {
    // Reset filter object
    filters = {
        search: '',
        minPrice: '',
        maxPrice: '',
        monthlyPayment: '',
        makes: [],
        bodyType: '',
        fuelType: '',
        mileageRange: '',
        yearRange: '',
        transmission: '',
        drivetrain: '',
        features: [],
        condition: '',
        colors: [],
        radius: '',
        daysOnMarket: '',
        priceReduced: ''
    };
    
    // Reset form inputs
    document.getElementById('searchInput').value = '';
    document.getElementById('minPrice').value = '';
    document.getElementById('maxPrice').value = '';
    document.getElementById('bodyTypeFilter').value = '';
    document.getElementById('fuelTypeFilter').value = '';
    document.getElementById('transmissionFilter').value = '';
    document.getElementById('drivetrainFilter').value = '';
    document.getElementById('conditionFilter').value = '';
    document.getElementById('daysOnMarketFilter').value = '';
    document.getElementById('priceReducedFilter').value = '';
    
    // Reset multi-selects
    document.querySelectorAll('.multi-select-options input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Reset displays
    document.getElementById('makeDisplay').querySelector('span').textContent = 'Select Makes';
    document.getElementById('featuresDisplay').querySelector('span').textContent = 'Select Features';
    document.getElementById('colorDisplay').querySelector('span').textContent = 'Select Colors';
    
    // Clear tags
    document.getElementById('makeSelectedTags').innerHTML = '';
    document.getElementById('featuresSelectedTags').innerHTML = '';
    document.getElementById('colorSelectedTags').innerHTML = '';
    
    // Reset range sliders
    document.getElementById('monthlyPaymentRange').value = 1000;
    document.getElementById('monthlyPaymentValue').textContent = '$1,000';
    document.getElementById('mileageRange').value = 100000;
    document.getElementById('mileageValue').textContent = '100,000 mi';
    document.getElementById('yearRange').value = 2020;
    document.getElementById('yearValue').textContent = '2020';
    document.getElementById('radiusRange').value = 50;
    document.getElementById('radiusValue').textContent = '50 mi';
    
    applyFilters();
}

// Enhanced apply filters function
function applyFilters() {
    let filtered = [...mockCars];
    
    // Search filter
    if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filtered = filtered.filter(car => 
            `${car.make} ${car.model} ${car.year}`.toLowerCase().includes(searchTerm)
        );
    }
    
    // Price filters
    if (document.getElementById('minPrice').value) {
        filters.minPrice = document.getElementById('minPrice').value;
        filtered = filtered.filter(car => car.price >= parseInt(filters.minPrice));
    }
    
    if (document.getElementById('maxPrice').value) {
        filters.maxPrice = document.getElementById('maxPrice').value;
        filtered = filtered.filter(car => car.price <= parseInt(filters.maxPrice));
    }
    
    // Make filter
    if (filters.makes.length > 0) {
        filtered = filtered.filter(car => filters.makes.includes(car.make));
    }
    
    // Body type filter
    const bodyType = document.getElementById('bodyTypeFilter').value;
    if (bodyType) {
        filtered = filtered.filter(car => car.bodyType === bodyType);
    }
    
    // Fuel type filter
    const fuelType = document.getElementById('fuelTypeFilter').value;
    if (fuelType) {
        filtered = filtered.filter(car => car.fuelType === fuelType);
    }
    
    // Mileage filter
    if (filters.mileageRange) {
        filtered = filtered.filter(car => car.mileage <= parseInt(filters.mileageRange));
    }
    
    // Year filter
    if (filters.yearRange) {
        filtered = filtered.filter(car => car.year >= parseInt(filters.yearRange));
    }
    
    // Transmission filter
    const transmission = document.getElementById('transmissionFilter').value;
    if (transmission) {
        filtered = filtered.filter(car => car.transmission === transmission);
    }
    
    // Drivetrain filter
    const drivetrain = document.getElementById('drivetrainFilter').value;
    if (drivetrain) {
        filtered = filtered.filter(car => car.drivetrain === drivetrain);
    }
    
    // Features filter
    if (filters.features.length > 0) {
        filtered = filtered.filter(car => 
            filters.features.every(feature => car.features.includes(feature))
        );
    }
    
    // Condition filter
    const condition = document.getElementById('conditionFilter').value;
    if (condition) {
        filtered = filtered.filter(car => car.condition === condition);
    }
    
    // Color filter
    if (filters.colors.length > 0) {
        filtered = filtered.filter(car => filters.colors.includes(car.exteriorColor));
    }
    
    // Days on market filter
    const daysOnMarket = document.getElementById('daysOnMarketFilter').value;
    if (daysOnMarket) {
        filtered = filtered.filter(car => car.daysOnMarket <= parseInt(daysOnMarket));
    }
    
    // Price reduced filter
    const priceReduced = document.getElementById('priceReducedFilter').value;
    if (priceReduced === 'true') {
        filtered = filtered.filter(car => {
            const priceHistory = car.priceHistory;
            return priceHistory[priceHistory.length - 1] < priceHistory[0];
        });
    }
    
    currentCars = filtered;
    renderCars();
    updateResultsTitle();
    updateActiveFilterCount();
}

function updateActiveFilterCount() {
    let count = 0;
    
    if (filters.search) count++;
    if (document.getElementById('minPrice').value) count++;
    if (document.getElementById('maxPrice').value) count++;
    if (filters.makes.length > 0) count++;
    if (document.getElementById('bodyTypeFilter').value) count++;
    if (document.getElementById('fuelTypeFilter').value) count++;
    if (filters.mileageRange) count++;
    if (filters.yearRange) count++;
    if (document.getElementById('transmissionFilter').value) count++;
    if (document.getElementById('drivetrainFilter').value) count++;
    if (filters.features.length > 0) count++;
    if (document.getElementById('conditionFilter').value) count++;
    if (filters.colors.length > 0) count++;
    if (document.getElementById('daysOnMarketFilter').value) count++;
    if (document.getElementById('priceReducedFilter').value) count++;
    
    if (count > 0) {
        activeFilterCount.style.display = 'inline';
        activeFilterCount.textContent = `${count} filter${count !== 1 ? 's' : ''} active`;
    } else {
        activeFilterCount.style.display = 'none';
    }
}

// Sort functionality
function handleSort(e) {
    const sortBy = e.target.value;
    
    switch (sortBy) {
        case 'price-low':
            currentCars.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            currentCars.sort((a, b) => b.price - a.price);
            break;
        case 'mileage':
            currentCars.sort((a, b) => a.mileage - b.mileage);
            break;
        case 'year':
            currentCars.sort((a, b) => b.year - a.year);
            break;
        case 'days-market':
            currentCars.sort((a, b) => a.daysOnMarket - b.daysOnMarket);
            break;
        case 'rating':
            currentCars.sort((a, b) => b.rating - a.rating);
            break;
    }
    
    renderCars();
}

// Toggle favorite
function toggleFavorite(carId) {
    if (favorites.has(carId)) {
        favorites.delete(carId);
    } else {
        favorites.add(carId);
    }
    
    updateFavoritesCount();
    renderCars();
}

// Update favorites count
function updateFavoritesCount() {
    favoritesCount.textContent = favorites.size;
}

// Calculate price change
function calculatePriceChange(car) {
    const priceHistory = car.priceHistory;
    const currentPrice = priceHistory[priceHistory.length - 1];
    const originalPrice = priceHistory[0];
    const change = currentPrice - originalPrice;
    const changePercent = ((change / originalPrice) * 100).toFixed(1);
    
    return {
        amount: change,
        percent: changePercent,
        isPositive: change >= 0
    };
}

// Create car card HTML
function createCarCard(car) {
    const priceChange = calculatePriceChange(car);
    const isFavorited = favorites.has(car.id);
    const isNewListing = car.daysOnMarket <= 7;
    
    return `
        <div class="car-card" onclick="viewCarDetails(${car.id})">
            <div class="car-image-container">
                <img src="${getCarImage(car.make, car.model)}" alt="${car.year} ${car.make} ${car.model}" class="car-image">
                <button class="favorite-btn ${isFavorited ? 'favorited' : ''}" onclick="event.stopPropagation(); toggleFavorite(${car.id})">
                    <i data-lucide="heart" ${isFavorited ? 'class="favorited"' : ''}></i>
                </button>
                ${isNewListing ? '<div class="new-listing-badge">New Listing</div>' : ''}
            </div>
            
            <div class="car-content">
                <div class="car-header">
                    <h3 class="car-title">${car.year} ${car.make} ${car.model}</h3>
                    <div class="car-rating">
                        <i data-lucide="star" class="rating-star"></i>
                        <span class="rating-text">${car.rating}</span>
                    </div>
                </div>
                
                <div class="car-price-section">
                    <div class="car-price">$${car.price.toLocaleString()}</div>
                    <div class="price-change ${priceChange.isPositive ? 'positive' : 'negative'}">
                        <i data-lucide="trending-${priceChange.isPositive ? 'up' : 'down'}"></i>
                        ${Math.abs(priceChange.percent)}%
                    </div>
                </div>
                
                <div class="car-details">
                    <div class="car-detail">
                        <i data-lucide="gauge"></i>
                        <span>${car.mileage.toLocaleString()} mi</span>
                    </div>
                    <div class="car-detail">
                        <i data-lucide="fuel"></i>
                        <span>${car.mpg}</span>
                    </div>
                    <div class="car-detail">
                        <i data-lucide="map-pin"></i>
                        <span>${car.location}</span>
                    </div>
                    <div class="car-detail">
                        <i data-lucide="calendar"></i>
                        <span>${car.daysOnMarket} days</span>
                    </div>
                </div>
                
                <div class="car-features">
                    ${car.features.slice(0, 3).map(feature => 
                        `<span class="feature-tag">${feature}</span>`
                    ).join('')}
                </div>
                
                <button class="view-details-btn" onclick="event.stopPropagation(); viewCarDetails(${car.id})">
                    View Details
                </button>
            </div>
        </div>
    `;
}

// View switching
function switchView(view) {
    currentView = view;
    
    gridViewBtn.classList.toggle('active', view === 'grid');
    mapViewBtn.classList.toggle('active', view === 'map');
    
    if (view === 'grid') {
        carsGrid.style.display = 'grid';
        mapContainer.style.display = 'none';
    } else {
        carsGrid.style.display = 'none';
        mapContainer.style.display = 'block';
        
        if (map) {
            setTimeout(() => {
                map.invalidateSize();
                updateMapMarkers();
            }, 100);
        }
    }
}

// Initialize map
function initializeMap() {
    if (typeof L === 'undefined') {
        setTimeout(initializeMap, 500);
        return;
    }
    
    try {
        map = L.map('carMap', {
            zoomControl: true,
            scrollWheelZoom: true
        }).setView([39.8283, -98.5795], 4);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(map);

        updateMapMarkers();
    } catch (error) {
        console.error('Error initializing map:', error);
    }
}

// Update map markers
function updateMapMarkers() {
    if (!map) return;
    
    try {
        mapMarkers.forEach(marker => map.removeLayer(marker));
        mapMarkers = [];
        
        currentCars.forEach(car => {
            const popupContent = `
                <div class="car-popup">
                    <div class="car-popup-content">
                        <img src="${getCarImage(car.make, car.model)}" alt="${car.year} ${car.make} ${car.model}" class="car-popup-image">
                        <div class="car-popup-info">
                            <div class="car-popup-title">${car.year} ${car.make} ${car.model}</div>
                            <div class="car-popup-price">${car.price.toLocaleString()}</div>
                            <div class="car-popup-details">
                                <span>${car.mileage.toLocaleString()} mi</span>
                                <span>${car.mpg}</span>
                            </div>
                            <button class="car-popup-btn" onclick="viewCarDetails(${car.id})">
                                View Details
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            const marker = L.marker(car.coordinates)
                .addTo(map)
                .bindPopup(popupContent, {
                    maxWidth: 280,
                    className: 'car-popup'
                });
            
            mapMarkers.push(marker);
        });
        
        if (mapMarkers.length > 0) {
            const group = new L.featureGroup(mapMarkers);
            map.fitBounds(group.getBounds().pad(0.1));
        }
    } catch (error) {
        console.error('Error updating map markers:', error);
    }
}

// View car details
function viewCarDetails(carId) {
    const car = mockCars.find(c => c.id === carId);
    if (!car) return;
    
    showCarModal(car);
}

// Show car modal
function showCarModal(car) {
    const priceChange = calculatePriceChange(car);
    const modalTitle = document.getElementById('modalCarTitle');
    const modalContent = document.getElementById('modalCarContent');
    
    modalTitle.textContent = `${car.year} ${car.make} ${car.model}`;
    
    modalContent.innerHTML = `
        <img src="${getCarImage(car.make, car.model)}" alt="${car.year} ${car.make} ${car.model}" style="width: 100%; height: 300px; object-fit: cover; border-radius: 0.75rem; margin-bottom: 1.5rem;">
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
            <div style="grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; padding: 1.5rem; background: #f9fafb; border-radius: 0.75rem;">
                <div style="font-size: 2.5rem; font-weight: 700; color: #059669;">${car.price.toLocaleString()}</div>
                <div style="text-align: right;">
                    <div style="font-size: 1.125rem; font-weight: 600; color: #1f2937;">${car.dealer}</div>
                    <div style="color: #6b7280;">${car.location}</div>
                </div>
            </div>
            
            <div>
                <h4 style="font-size: 1.125rem; font-weight: 600; color: #1f2937; margin-bottom: 0.75rem;">Vehicle Specifications</h4>
                <div style="display: grid; gap: 0.75rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; background: white; border: 1px solid #e5e7eb; border-radius: 0.5rem;">
                        <i data-lucide="gauge" style="color: #2563eb; width: 1rem; height: 1rem;"></i>
                        <span style="font-size: 0.875rem; color: #374151;">${car.mileage.toLocaleString()} miles</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; background: white; border: 1px solid #e5e7eb; border-radius: 0.5rem;">
                        <i data-lucide="fuel" style="color: #2563eb; width: 1rem; height: 1rem;"></i>
                        <span style="font-size: 0.875rem; color: #374151;">${car.mpg}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; background: white; border: 1px solid #e5e7eb; border-radius: 0.5rem;">
                        <i data-lucide="settings" style="color: #2563eb; width: 1rem; height: 1rem;"></i>
                        <span style="font-size: 0.875rem; color: #374151;">${car.transmission}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; background: white; border: 1px solid #e5e7eb; border-radius: 0.5rem;">
                        <i data-lucide="zap" style="color: #2563eb; width: 1rem; height: 1rem;"></i>
                        <span style="font-size: 0.875rem; color: #374151;">${car.drivetrain}</span>
                    </div>
                </div>
            </div>
            
            <div>
                <h4 style="font-size: 1.125rem; font-weight: 600; color: #1f2937; margin-bottom: 0.75rem;">Features & Options</h4>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                    ${car.features.map(feature => `<span style="background: #dbeafe; color: #1d4ed8; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500;">${feature}</span>`).join('')}
                </div>
            </div>
            
            <div style="grid-column: 1 / -1; display: flex; gap: 1rem; margin-top: 2rem;">
                <button style="flex: 1; padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer; transition: all 0.2s; background: #2563eb; color: white;" onclick="contactDealer(${car.id})">
                    Contact Dealer
                </button>
                <button style="flex: 1; padding: 0.75rem 1.5rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-weight: 600; cursor: pointer; transition: all 0.2s; background: #f3f4f6; color: #374151;" onclick="toggleFavorite(${car.id}); renderCars();">
                    ${favorites.has(car.id) ? 'Remove from' : 'Add to'} Favorites
                </button>
            </div>
        </div>
    `;
    
    carModal.style.display = 'flex';
    
    // Reinitialize Lucide icons for modal content
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Close modal
function closeModal() {
    carModal.style.display = 'none';
}

// Contact dealer function
function contactDealer(carId) {
    const car = mockCars.find(c => c.id === carId);
    alert(`Contact ${car.dealer} about the ${car.year} ${car.make} ${car.model}\n\nPhone: (555) 123-4567\nAddress: ${car.location}\n\nIn a real application, this would open a contact form or provide dealer contact information.`);
}

// Render cars
function renderCars() {
    if (currentView === 'grid') {
        if (currentCars.length === 0) {
            carsGrid.style.display = 'none';
            noResults.style.display = 'block';
        } else {
            carsGrid.style.display = 'grid';
            noResults.style.display = 'none';
            
            carsGrid.innerHTML = currentCars.map(car => createCarCard(car)).join('');
            
            // Reinitialize Lucide icons for new content
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    } else {
        // Update map markers when in map view
        updateMapMarkers();
    }
}

// Update results title
function updateResultsTitle() {
    const count = currentCars.length;
    const searchText = filters.search ? ` for "${filters.search}"` : '';
    resultsTitle.textContent = `${count} Car${count !== 1 ? 's' : ''} Found${searchText}`;
}

// Update market insights
function updateMarketInsights() {
    if (mockCars.length === 0) return;
    
    const totalCars = mockCars.length;
    const avgPrice = mockCars.reduce((sum, car) => sum + car.price, 0) / totalCars;
    const avgDaysOnMarket = mockCars.reduce((sum, car) => sum + car.daysOnMarket, 0) / totalCars;
    
    // Calculate price drops
    const carsWithPriceDrops = mockCars.filter(car => {
        const priceHistory = car.priceHistory;
        return priceHistory[priceHistory.length - 1] < priceHistory[0];
    });
    const priceDropPercentage = (carsWithPriceDrops.length / totalCars) * 100;
    
    // Update insight values
    document.querySelectorAll('.insight-value').forEach((el, index) => {
        switch(index) {
            case 0: 
                el.textContent = `${Math.round(avgPrice).toLocaleString()}`;
                break;
            case 1: 
                el.textContent = totalCars.toLocaleString();
                break;
            case 2: 
                el.textContent = `${Math.round(avgDaysOnMarket)} days`;
                break;
            case 3: 
                el.textContent = `${Math.round(priceDropPercentage)}%`;
                break;
        }
    });
}

// Initialize favorites count
updateFavoritesCount();

// Make functions globally available
window.toggleFavorite = toggleFavorite;
window.viewCarDetails = viewCarDetails;
window.contactDealer = contactDealer;
window.removeTag = removeTag;