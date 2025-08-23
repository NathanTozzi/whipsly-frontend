// State management
let mockCars = [];
let currentCars = [];
let favorites = new Set();
let currentView = 'grid';
let map = null;
let mapMarkers = [];

// Search enhancement state
let searchHistory = [];
let searchTimeout = null;
let currentSuggestionIndex = -1;
let activeQuickFilters = new Set();
let recentlyViewedCars = [];
let compareList = new Set();
let isLoading = false;
let loadingTimeout = null;

// Popular searches and autocomplete data
const popularSearches = [
    "Toyota Camry", "Honda Civic", "Tesla Model 3", "BMW X3", "Mercedes C-Class",
    "Ford F-150", "Chevrolet Silverado", "Audi A4", "Luxury cars", "Electric cars"
];

const carMakes = [
    "Toyota", "Honda", "Ford", "Tesla", "BMW", "Mercedes-Benz", "Chevrolet", "Audi",
    "Nissan", "Hyundai", "Kia", "Mazda", "Subaru", "Volkswagen", "Lexus", "Infiniti"
];

// carModels is imported from data/realistic-cars.js

// Load favorites from localStorage
function loadFavorites() {
    const savedFavorites = localStorage.getItem('whipsly-favorites');
    if (savedFavorites) {
        try {
            const favoritesArray = JSON.parse(savedFavorites);
            favorites = new Set(favoritesArray);
        } catch (error) {
            console.error('Error loading favorites:', error);
            favorites = new Set();
        }
    }
}

// Save favorites to localStorage
function saveFavorites() {
    try {
        const favoritesArray = Array.from(favorites);
        localStorage.setItem('whipsly-favorites', JSON.stringify(favoritesArray));
    } catch (error) {
        console.error('Error saving favorites:', error);
    }
}

// Load search history from localStorage
function loadSearchHistory() {
    const savedHistory = localStorage.getItem('whipsly-search-history');
    if (savedHistory) {
        try {
            searchHistory = JSON.parse(savedHistory);
        } catch (error) {
            console.error('Error loading search history:', error);
            searchHistory = [];
        }
    }
}

// Save search history to localStorage
function saveSearchHistory() {
    try {
        localStorage.setItem('whipsly-search-history', JSON.stringify(searchHistory));
    } catch (error) {
        console.error('Error saving search history:', error);
    }
}

// Add search term to history
function addToSearchHistory(term) {
    if (!term || term.length < 2) return;
    
    // Remove existing entry if it exists
    searchHistory = searchHistory.filter(item => item.toLowerCase() !== term.toLowerCase());
    
    // Add to beginning of array
    searchHistory.unshift(term);
    
    // Keep only last 10 searches
    if (searchHistory.length > 10) {
        searchHistory = searchHistory.slice(0, 10);
    }
    
    saveSearchHistory();
}

// Load recently viewed cars from localStorage
function loadRecentlyViewedCars() {
    const savedViewed = localStorage.getItem('whipsly-recently-viewed');
    if (savedViewed) {
        try {
            recentlyViewedCars = JSON.parse(savedViewed);
        } catch (error) {
            console.error('Error loading recently viewed cars:', error);
            recentlyViewedCars = [];
        }
    }
}

// Save recently viewed cars to localStorage
function saveRecentlyViewedCars() {
    try {
        localStorage.setItem('whipsly-recently-viewed', JSON.stringify(recentlyViewedCars));
    } catch (error) {
        console.error('Error saving recently viewed cars:', error);
    }
}

// Add car to recently viewed
function addToRecentlyViewed(car) {
    if (!car) return;
    
    // Remove existing entry if it exists
    recentlyViewedCars = recentlyViewedCars.filter(viewedCar => viewedCar.id !== car.id);
    
    // Add to beginning of array
    recentlyViewedCars.unshift(car);
    
    // Keep only last 10 cars
    if (recentlyViewedCars.length > 10) {
        recentlyViewedCars = recentlyViewedCars.slice(0, 10);
    }
    
    saveRecentlyViewedCars();
    updateRecentlyViewedDisplay();
}

// Remove car from recently viewed
function removeFromRecentlyViewed(carId) {
    recentlyViewedCars = recentlyViewedCars.filter(car => car.id !== carId);
    saveRecentlyViewedCars();
    updateRecentlyViewedDisplay();
}

// Clear all recently viewed cars
function clearAllRecentlyViewed() {
    recentlyViewedCars = [];
    saveRecentlyViewedCars();
    updateRecentlyViewedDisplay();
}

// Update recently viewed display
function updateRecentlyViewedDisplay() {
    const recentlyViewedSection = document.getElementById('recentlyViewedSection');
    const recentlyViewedContainer = document.getElementById('recentlyViewedCars');
    
    if (recentlyViewedCars.length === 0) {
        recentlyViewedSection.style.display = 'none';
        return;
    }
    
    recentlyViewedSection.style.display = 'block';
    
    const recentlyViewedHTML = recentlyViewedCars.map(car => `
        <div class="recently-viewed-card" onclick="viewCarDetails(${car.id})">
            <img src="${getCarImage(car.make, car.model)}" alt="${car.year} ${car.make} ${car.model}" class="car-image">
            <button class="recently-viewed-remove" onclick="event.stopPropagation(); removeFromRecentlyViewed(${car.id})">×</button>
            <div class="car-content">
                <div class="car-title">${car.year} ${car.make} ${car.model}</div>
                <div class="car-price">$${car.price.toLocaleString()}</div>
                <div class="car-details">
                    <span>${car.mileage.toLocaleString()} mi</span>
                    <span>${car.mpg}</span>
                </div>
            </div>
        </div>
    `).join('');
    
    recentlyViewedContainer.innerHTML = recentlyViewedHTML;
}

// Initialize recently viewed
function initializeRecentlyViewed() {
    loadRecentlyViewedCars();
    updateRecentlyViewedDisplay();
    
    // Add event listener to clear button
    const clearButton = document.getElementById('clearRecentlyViewed');
    if (clearButton) {
        clearButton.addEventListener('click', clearAllRecentlyViewed);
    }
}

// Initialize compare functionality
function initializeCompare() {
    const compareBtn = document.getElementById('compareBtn');
    const clearCompareBtn = document.getElementById('clearCompareBtn');
    
    if (compareBtn) {
        compareBtn.addEventListener('click', showCompareModal);
    }
    
    if (clearCompareBtn) {
        clearCompareBtn.addEventListener('click', clearAllCompare);
    }
    
    updateCompareBar();
}

// Create skeleton loading card
function createSkeletonCard() {
    return `
        <div class="skeleton-card">
            <div class="skeleton-image"></div>
            <div class="skeleton-content">
                <div class="skeleton-header">
                    <div class="skeleton-title"></div>
                    <div class="skeleton-rating"></div>
                </div>
                <div class="skeleton-price-section">
                    <div class="skeleton-price"></div>
                    <div class="skeleton-change"></div>
                </div>
                <div class="skeleton-details">
                    <div class="skeleton-detail"></div>
                    <div class="skeleton-detail"></div>
                    <div class="skeleton-detail"></div>
                    <div class="skeleton-detail"></div>
                </div>
                <div class="skeleton-features">
                    <div class="skeleton-feature"></div>
                    <div class="skeleton-feature"></div>
                    <div class="skeleton-feature"></div>
                </div>
                <div class="skeleton-actions">
                    <div class="skeleton-action"></div>
                    <div class="skeleton-action"></div>
                    <div class="skeleton-action"></div>
                </div>
                <div class="skeleton-button"></div>
            </div>
        </div>
    `;
}

// Show skeleton loading cards
function showSkeletonLoading(count = 12) {
    const carsGrid = document.getElementById('carsGrid');
    const noResults = document.getElementById('noResults');
    
    // Hide no results
    noResults.style.display = 'none';
    
    // Show loading cards
    carsGrid.style.display = 'grid';
    carsGrid.innerHTML = Array(count).fill(createSkeletonCard()).join('');
}

// Show search loading spinner
function showSearchLoading() {
    const searchLoading = document.getElementById('searchLoading');
    if (searchLoading) {
        searchLoading.style.display = 'block';
    }
}

// Hide search loading spinner
function hideSearchLoading() {
    const searchLoading = document.getElementById('searchLoading');
    if (searchLoading) {
        searchLoading.style.display = 'none';
    }
}

// Start loading state
function startLoading() {
    if (isLoading) return;
    
    isLoading = true;
    showSearchLoading();
    
    // Show skeleton cards after a brief delay for better UX
    loadingTimeout = setTimeout(() => {
        if (isLoading) {
            showSkeletonLoading();
        }
    }, 200);
}

// End loading state
function endLoading() {
    isLoading = false;
    hideSearchLoading();
    
    if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        loadingTimeout = null;
    }
}

// Toggle car in compare list
function toggleCompare(carId) {
    if (compareList.has(carId)) {
        compareList.delete(carId);
    } else {
        // Limit to 3 cars for comparison
        if (compareList.size >= 3) {
            alert('You can compare up to 3 cars at a time. Please remove a car to add another.');
            return;
        }
        compareList.add(carId);
    }
    
    updateCompareBar();
    renderCars(); // Re-render to update checkboxes
}

// Update compare bar visibility and count
function updateCompareBar() {
    const compareBar = document.getElementById('compareBar');
    const compareCount = document.getElementById('compareCount');
    const compareBtn = document.getElementById('compareBtn');
    
    if (compareList.size > 0) {
        compareBar.style.display = 'block';
        compareCount.textContent = compareList.size;
        compareBtn.disabled = compareList.size < 2;
    } else {
        compareBar.style.display = 'none';
    }
}

// Clear all cars from compare list
function clearAllCompare() {
    compareList.clear();
    updateCompareBar();
    renderCars();
}

// Show compare modal
function showCompareModal() {
    if (compareList.size < 2) return;
    
    const carsToCompare = mockCars.filter(car => compareList.has(car.id));
    const modalTitle = document.getElementById('modalCarTitle');
    const modalContent = document.getElementById('modalCarContent');
    
    modalTitle.textContent = `Compare ${carsToCompare.length} Cars`;
    
    // Create comparison table
    const comparisonHTML = `
        <div class="comparison-container">
            <div class="comparison-header">
                ${carsToCompare.map(car => `
                    <div class="comparison-car-header">
                        <img src="${getCarImage(car.make, car.model)}" alt="${car.year} ${car.make} ${car.model}" class="comparison-car-image">
                        <h4 class="comparison-car-title">${car.year} ${car.make} ${car.model}</h4>
                        <div class="comparison-car-price">$${car.price.toLocaleString()}</div>
                    </div>
                `).join('')}
            </div>
            
            <div class="comparison-table">
                <div class="comparison-row">
                    <div class="comparison-label">Mileage</div>
                    ${carsToCompare.map(car => `<div class="comparison-value">${car.mileage.toLocaleString()} mi</div>`).join('')}
                </div>
                <div class="comparison-row">
                    <div class="comparison-label">MPG</div>
                    ${carsToCompare.map(car => `<div class="comparison-value">${car.mpg}</div>`).join('')}
                </div>
                <div class="comparison-row">
                    <div class="comparison-label">Condition</div>
                    ${carsToCompare.map(car => `<div class="comparison-value">${car.condition}</div>`).join('')}
                </div>
                <div class="comparison-row">
                    <div class="comparison-label">Fuel Type</div>
                    ${carsToCompare.map(car => `<div class="comparison-value">${car.fuelType}</div>`).join('')}
                </div>
                <div class="comparison-row">
                    <div class="comparison-label">Transmission</div>
                    ${carsToCompare.map(car => `<div class="comparison-value">${car.transmission}</div>`).join('')}
                </div>
                <div class="comparison-row">
                    <div class="comparison-label">Drivetrain</div>
                    ${carsToCompare.map(car => `<div class="comparison-value">${car.drivetrain}</div>`).join('')}
                </div>
                <div class="comparison-row">
                    <div class="comparison-label">Location</div>
                    ${carsToCompare.map(car => `<div class="comparison-value">${car.location}</div>`).join('')}
                </div>
                <div class="comparison-row">
                    <div class="comparison-label">Days on Market</div>
                    ${carsToCompare.map(car => `<div class="comparison-value">${car.daysOnMarket} days</div>`).join('')}
                </div>
            </div>
            
            <div class="comparison-actions">
                ${carsToCompare.map(car => `
                    <button class="comparison-action-btn" onclick="viewCarDetails(${car.id}); closeModal();">
                        View ${car.make} ${car.model}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
    
    modalContent.innerHTML = comparisonHTML;
    carModal.style.display = 'flex';
}

// Quick action functions
function emailDealer(carId) {
    const car = mockCars.find(c => c.id === carId);
    if (!car) return;
    
    // Create mailto link
    const subject = encodeURIComponent(`Interested in ${car.year} ${car.make} ${car.model}`);
    const body = encodeURIComponent(`Hi,

I'm interested in learning more about the ${car.year} ${car.make} ${car.model} listed at $${car.price.toLocaleString()}.

Please provide more information about this vehicle.

Thank you!`);
    
    window.location.href = `mailto:dealer@example.com?subject=${subject}&body=${body}`;
}

function getDirections(carId) {
    const car = mockCars.find(c => c.id === carId);
    if (!car) return;
    
    // Open Google Maps with directions to dealer
    const destination = encodeURIComponent(`${car.dealer}, ${car.location}`);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
}

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
    // Load favorites and search history first
    loadFavorites();
    loadSearchHistory();
    
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
    
    // Show initial loading
    showSkeletonLoading();
    
    // Simulate initial data loading
    setTimeout(() => {
        // Render initial cars
        renderCars();
        updateResultsTitle();
        updateMarketInsights();
        updateFavoritesCount();
    }, 800 + Math.random() * 400);
    
    // Initialize event listeners
    initializeEventListeners();
    initializeMultiSelects();
    initializeRangeSliders();
    initializeRecentlyViewed();
    
    // Initialize recommendations
    setTimeout(updateRecommendations, 200);
    
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
    // Search functionality with enhanced features
    searchInput.addEventListener('input', handleSearch);
    searchInput.addEventListener('focus', () => {
        if (searchInput.value.length > 0) {
            showSearchDropdown();
            updateSearchSuggestions(searchInput.value);
        } else {
            showSearchDropdown();
        }
    });
    searchInput.addEventListener('blur', hideSearchDropdown);
    
    // Keyboard navigation for search dropdown
    searchInput.addEventListener('keydown', handleSearchKeydown);
    
    // Click outside to close dropdown
    document.addEventListener('click', (e) => {
        const searchContainer = document.querySelector('.search-container');
        if (!searchContainer.contains(e.target)) {
            hideSearchDropdown();
        }
    });
    
    // Filter toggle
    filterToggle.addEventListener('click', toggleFilters);
    
    // Mobile filter toggle
    const mobileFilterToggle = document.getElementById('mobileFilterToggle');
    const mobileFilterOverlay = document.getElementById('mobileFilterOverlay');
    const mobileFilterClose = document.getElementById('mobileFilterClose');
    const clearAllMobile = document.getElementById('clearAllMobile');
    const applyFiltersMobile = document.getElementById('applyFiltersMobile');
    
    if (mobileFilterToggle) {
        mobileFilterToggle.addEventListener('click', showMobileFilters);
    }
    
    if (mobileFilterClose) {
        mobileFilterClose.addEventListener('click', hideMobileFilters);
    }
    
    if (mobileFilterOverlay) {
        mobileFilterOverlay.addEventListener('click', (e) => {
            if (e.target === mobileFilterOverlay) {
                hideMobileFilters();
            }
        });
    }
    
    if (clearAllMobile) {
        clearAllMobile.addEventListener('click', () => {
            clearAllFilters();
            hideMobileFilters();
        });
    }
    
    if (applyFiltersMobile) {
        applyFiltersMobile.addEventListener('click', () => {
            applyFiltersWithLoading();
            hideMobileFilters();
        });
    }
    
    // Clear filters
    clearFiltersBtn.addEventListener('click', clearAllFilters);
    
    // Sort functionality
    sortSelect.addEventListener('change', handleSort);
    
    // View toggle
    gridViewBtn.addEventListener('click', () => switchView('grid'));
    mapViewBtn.addEventListener('click', () => switchView('map'));
    
    // Favorites button
    const favoritesBtn = document.getElementById('favoritesBtn');
    if (favoritesBtn) {
        favoritesBtn.addEventListener('click', showFavoritesModal);
    }
    
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
            element.addEventListener('change', applyFiltersWithLoading);
        }
    });
    
    // Quick filter chips
    initializeQuickFilters();
    
    // Compare functionality
    initializeCompare();
}

// Initialize quick filter chips
function initializeQuickFilters() {
    const filterChips = document.querySelectorAll('.filter-chip');
    const clearQuickFilters = document.getElementById('clearQuickFilters');
    
    filterChips.forEach(chip => {
        chip.addEventListener('click', handleQuickFilter);
    });
    
    if (clearQuickFilters) {
        clearQuickFilters.addEventListener('click', clearAllQuickFilters);
    }
}

// Handle quick filter click
function handleQuickFilter(e) {
    const chip = e.currentTarget;
    const filterType = chip.dataset.filter;
    const filterValue = chip.dataset.value;
    const operator = chip.dataset.operator || 'equals';
    
    const filterKey = `${filterType}-${filterValue}-${operator}`;
    
    if (chip.classList.contains('active')) {
        // Remove filter
        chip.classList.remove('active');
        activeQuickFilters.delete(filterKey);
        removeQuickFilter(filterType, filterValue, operator);
    } else {
        // Add filter
        chip.classList.add('active');
        activeQuickFilters.add(filterKey);
        applyQuickFilter(filterType, filterValue, operator);
    }
    
    updateActiveChipsDisplay();
    updateQuickFiltersClearButton();
    applyFiltersWithLoading();
}

// Apply quick filter
function applyQuickFilter(filterType, filterValue, operator) {
    switch (filterType) {
        case 'price':
            if (operator === 'max') {
                document.getElementById('maxPrice').value = filterValue;
            } else if (operator === 'min') {
                document.getElementById('minPrice').value = filterValue;
            }
            break;
        case 'mileage':
            if (operator === 'max') {
                document.getElementById('mileageRange').value = filterValue;
                document.getElementById('mileageValue').textContent = `${parseInt(filterValue).toLocaleString()} mi`;
                filters.mileageRange = filterValue;
            }
            break;
        case 'fuel':
            if (filterValue.includes(',')) {
                // Handle multiple fuel types (electric,hybrid)
                const fuelTypes = filterValue.split(',');
                // This would be implemented with multi-select logic
                console.log('Multiple fuel types:', fuelTypes);
            } else {
                document.getElementById('fuelTypeFilter').value = filterValue;
            }
            break;
        case 'condition':
            document.getElementById('conditionFilter').value = filterValue;
            break;
        case 'year':
            if (operator === 'min') {
                document.getElementById('yearRange').value = filterValue;
                document.getElementById('yearValue').textContent = filterValue;
                filters.yearRange = filterValue;
            }
            break;
        case 'luxury':
            // Custom filter for luxury cars
            filters.luxury = filterValue === 'true';
            break;
        case 'age':
            // Filter by days on market
            if (operator === 'max') {
                document.getElementById('daysOnMarketFilter').value = filterValue;
            }
            break;
    }
}

// Remove quick filter
function removeQuickFilter(filterType, filterValue, operator) {
    switch (filterType) {
        case 'price':
            if (operator === 'max') {
                document.getElementById('maxPrice').value = '';
            } else if (operator === 'min') {
                document.getElementById('minPrice').value = '';
            }
            break;
        case 'mileage':
            if (operator === 'max') {
                document.getElementById('mileageRange').value = 100000;
                document.getElementById('mileageValue').textContent = '100,000 mi';
                filters.mileageRange = '';
            }
            break;
        case 'fuel':
            document.getElementById('fuelTypeFilter').value = '';
            break;
        case 'condition':
            document.getElementById('conditionFilter').value = '';
            break;
        case 'year':
            if (operator === 'min') {
                document.getElementById('yearRange').value = 2020;
                document.getElementById('yearValue').textContent = '2020';
                filters.yearRange = '';
            }
            break;
        case 'luxury':
            delete filters.luxury;
            break;
        case 'age':
            document.getElementById('daysOnMarketFilter').value = '';
            break;
    }
}

// Update active chips display
function updateActiveChipsDisplay() {
    const activeChipsSection = document.getElementById('activeChips');
    const activeChipsList = document.getElementById('activeChipsList');
    
    if (activeQuickFilters.size > 0) {
        activeChipsSection.style.display = 'block';
        
        const chipElements = Array.from(document.querySelectorAll('.filter-chip.active')).map(chip => {
            const filterType = chip.dataset.filter;
            const chipText = chip.querySelector('.chip-text').textContent;
            const filterKey = `${filterType}-${chip.dataset.value}-${chip.dataset.operator || 'equals'}`;
            
            return `
                <div class="active-chip">
                    <span>${chipText}</span>
                    <button class="remove-chip" onclick="removeActiveChip('${filterKey}')">×</button>
                </div>
            `;
        }).join('');
        
        activeChipsList.innerHTML = chipElements;
    } else {
        activeChipsSection.style.display = 'none';
    }
}

// Remove active chip
function removeActiveChip(filterKey) {
    // Find the corresponding chip button
    const chip = Array.from(document.querySelectorAll('.filter-chip')).find(c => {
        const key = `${c.dataset.filter}-${c.dataset.value}-${c.dataset.operator || 'equals'}`;
        return key === filterKey;
    });
    
    if (chip) {
        chip.click(); // Trigger the existing click handler
    }
}

// Update clear button visibility
function updateQuickFiltersClearButton() {
    const clearButton = document.getElementById('clearQuickFilters');
    if (clearButton) {
        clearButton.style.display = activeQuickFilters.size > 0 ? 'block' : 'none';
    }
}

// Clear all quick filters
function clearAllQuickFilters() {
    const activeChips = document.querySelectorAll('.filter-chip.active');
    activeChips.forEach(chip => {
        chip.classList.remove('active');
    });
    
    activeQuickFilters.clear();
    updateActiveChipsDisplay();
    updateQuickFiltersClearButton();
    
    // Reset filter values
    filters.luxury = undefined;
    document.getElementById('maxPrice').value = '';
    document.getElementById('minPrice').value = '';
    document.getElementById('mileageRange').value = 100000;
    document.getElementById('mileageValue').textContent = '100,000 mi';
    filters.mileageRange = '';
    document.getElementById('fuelTypeFilter').value = '';
    document.getElementById('conditionFilter').value = '';
    document.getElementById('yearRange').value = 2020;
    document.getElementById('yearValue').textContent = '2020';
    filters.yearRange = '';
    document.getElementById('daysOnMarketFilter').value = '';
    
    applyFiltersWithLoading();
}

// Handle keyboard navigation in search dropdown
function handleSearchKeydown(e) {
    const dropdown = document.getElementById('searchDropdown');
    if (dropdown.style.display === 'none') return;
    
    const suggestions = dropdown.querySelectorAll('.suggestion-item');
    
    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            currentSuggestionIndex = Math.min(currentSuggestionIndex + 1, suggestions.length - 1);
            updateSuggestionHighlight(suggestions);
            break;
        case 'ArrowUp':
            e.preventDefault();
            currentSuggestionIndex = Math.max(currentSuggestionIndex - 1, -1);
            updateSuggestionHighlight(suggestions);
            break;
        case 'Enter':
            e.preventDefault();
            if (currentSuggestionIndex >= 0 && suggestions[currentSuggestionIndex]) {
                suggestions[currentSuggestionIndex].click();
            } else if (searchInput.value.trim()) {
                selectSuggestion(searchInput.value.trim());
            }
            break;
        case 'Escape':
            hideSearchDropdown();
            searchInput.blur();
            break;
    }
}

// Update suggestion highlighting
function updateSuggestionHighlight(suggestions) {
    suggestions.forEach((suggestion, index) => {
        suggestion.classList.toggle('highlighted', index === currentSuggestionIndex);
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
            applyFiltersWithLoading();
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
        applyFiltersWithLoading();
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
            applyFiltersWithLoading();
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
            applyFiltersWithLoading();
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
            applyFiltersWithLoading();
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
            applyFiltersWithLoading();
        });
    }
}

// Search functionality
function handleSearch(e) {
    const searchTerm = e.target.value;
    filters.search = searchTerm;
    
    // Clear existing timeout
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    // Show dropdown and update suggestions
    if (searchTerm.length > 0) {
        showSearchDropdown();
        updateSearchSuggestions(searchTerm);
    } else {
        hideSearchDropdown();
    }
    
    // Start loading if we have a search term
    if (searchTerm.length > 0) {
        startLoading();
    }
    
    // Debounced search
    searchTimeout = setTimeout(() => {
        applyFiltersWithLoading();
        if (searchTerm.length >= 2) {
            addToSearchHistory(searchTerm);
        }
    }, 300);
}

// Show search dropdown
function showSearchDropdown() {
    const dropdown = document.getElementById('searchDropdown');
    dropdown.style.display = 'block';
    populateInitialSuggestions();
}

// Hide search dropdown
function hideSearchDropdown() {
    setTimeout(() => {
        const dropdown = document.getElementById('searchDropdown');
        dropdown.style.display = 'none';
        currentSuggestionIndex = -1;
    }, 150);
}

// Populate initial suggestions (popular + recent)
function populateInitialSuggestions() {
    const popularContainer = document.getElementById('popularSuggestions');
    const recentContainer = document.getElementById('recentSuggestions');
    
    // Popular searches
    popularContainer.innerHTML = popularSearches.slice(0, 5).map(search => 
        `<button class="suggestion-item popular-search" onclick="selectSuggestion('${search}')">
            <span class="suggestion-icon">🔥</span>
            <span class="suggestion-text">${search}</span>
        </button>`
    ).join('');
    
    // Recent searches
    if (searchHistory.length > 0) {
        recentContainer.innerHTML = searchHistory.slice(0, 5).map(search => 
            `<button class="suggestion-item recent-search" onclick="selectSuggestion('${search}')">
                <span class="suggestion-icon">🕐</span>
                <span class="suggestion-text">${search}</span>
            </button>`
        ).join('');
    } else {
        recentContainer.innerHTML = '<div style="padding: 0.5rem 1rem; color: #9ca3af; font-size: 0.875rem;">No recent searches</div>';
    }
}

// Update search suggestions based on input
function updateSearchSuggestions(searchTerm) {
    const term = searchTerm.toLowerCase();
    const autocompleteContainer = document.getElementById('autocompleteSuggestions');
    const autocompleteList = document.getElementById('autocompleteList');
    const didYouMeanContainer = document.getElementById('didYouMean');
    const spellingSuggestions = document.getElementById('spellingSuggestions');
    
    // Generate autocomplete suggestions
    const suggestions = generateAutocompleteSuggestions(term);
    
    if (suggestions.length > 0) {
        autocompleteContainer.style.display = 'block';
        autocompleteList.innerHTML = suggestions.map(suggestion => 
            `<button class="suggestion-item" onclick="selectSuggestion('${suggestion.text}')">
                <span class="suggestion-icon">${suggestion.icon}</span>
                <span class="suggestion-text">${highlightMatch(suggestion.text, term)}</span>
                <span class="suggestion-type">${suggestion.type}</span>
            </button>`
        ).join('');
    } else {
        autocompleteContainer.style.display = 'none';
    }
    
    // Generate spell corrections
    const spellSuggestions = generateSpellingSuggestions(term);
    
    if (spellSuggestions.length > 0) {
        didYouMeanContainer.style.display = 'block';
        spellingSuggestions.innerHTML = spellSuggestions.map(suggestion => 
            `<button class="suggestion-item spelling-suggestion" onclick="selectSuggestion('${suggestion}')">
                <span class="suggestion-icon">✨</span>
                <span class="suggestion-text">${suggestion}</span>
            </button>`
        ).join('');
    } else {
        didYouMeanContainer.style.display = 'none';
    }
}

// Generate autocomplete suggestions
function generateAutocompleteSuggestions(term) {
    const suggestions = [];
    
    // Search car makes
    carMakes.forEach(make => {
        if (make.toLowerCase().includes(term)) {
            suggestions.push({
                text: make,
                type: 'Make',
                icon: '🚗'
            });
        }
    });
    
    // Search car models
    Object.entries(carModels).forEach(([make, models]) => {
        Object.keys(models).forEach(model => {
            if (model.toLowerCase().includes(term) || make.toLowerCase().includes(term)) {
                suggestions.push({
                    text: `${make} ${model}`,
                    type: 'Model',
                    icon: '🔧'
                });
            }
        });
    });
    
    // Search years
    if (/^\d{4}$/.test(term) || /^20\d{0,2}$/.test(term)) {
        for (let year = 2020; year <= 2025; year++) {
            if (year.toString().startsWith(term)) {
                suggestions.push({
                    text: year.toString(),
                    type: 'Year',
                    icon: '📅'
                });
            }
        }
    }
    
    // Popular searches that match
    popularSearches.forEach(search => {
        if (search.toLowerCase().includes(term) && !suggestions.find(s => s.text === search)) {
            suggestions.push({
                text: search,
                type: 'Popular',
                icon: '⭐'
            });
        }
    });
    
    return suggestions.slice(0, 8);
}

// Generate spelling suggestions
function generateSpellingSuggestions(term) {
    const suggestions = [];
    const allModels = Object.values(carModels).map(models => Object.keys(models)).flat();
    const allTerms = [...carMakes, ...allModels, ...popularSearches];
    
    allTerms.forEach(item => {
        if (calculateLevenshteinDistance(term.toLowerCase(), item.toLowerCase()) <= 2 && 
            term.length > 2 && 
            item.toLowerCase() !== term.toLowerCase()) {
            suggestions.push(item);
        }
    });
    
    return suggestions.slice(0, 3);
}

// Calculate Levenshtein distance for spell checking
function calculateLevenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    
    return matrix[str2.length][str1.length];
}

// Highlight matching text in suggestions
function highlightMatch(text, term) {
    const regex = new RegExp(`(${term})`, 'gi');
    return text.replace(regex, '<strong>$1</strong>');
}

// Select a suggestion
function selectSuggestion(suggestion) {
    const searchInput = document.getElementById('searchInput');
    searchInput.value = suggestion;
    filters.search = suggestion;
    hideSearchDropdown();
    addToSearchHistory(suggestion);
    applyFilters();
}

// Filter toggle
function toggleFilters() {
    const isVisible = filtersSection.style.display !== 'none';
    filtersSection.style.display = isVisible ? 'none' : 'block';
}

// Mobile filter functions
function showMobileFilters() {
    const mobileFilterOverlay = document.getElementById('mobileFilterOverlay');
    const mobileFilterContent = document.getElementById('mobileFilterContent');
    
    // Generate mobile filter content
    generateMobileFilterContent();
    
    // Show the overlay
    mobileFilterOverlay.style.display = 'flex';
    
    // Trigger animation
    setTimeout(() => {
        mobileFilterOverlay.classList.add('active');
    }, 10);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

function hideMobileFilters() {
    const mobileFilterOverlay = document.getElementById('mobileFilterOverlay');
    
    // Hide with animation
    mobileFilterOverlay.classList.remove('active');
    
    // Remove from DOM after animation
    setTimeout(() => {
        mobileFilterOverlay.style.display = 'none';
        // Restore body scroll
        document.body.style.overflow = '';
    }, 300);
}

function generateMobileFilterContent() {
    const mobileFilterContent = document.getElementById('mobileFilterContent');
    
    mobileFilterContent.innerHTML = `
        <!-- Price & Financial -->
        <div class="mobile-filter-category">
            <h4 class="mobile-filter-category-title">
                <i data-lucide="dollar-sign"></i>
                Price & Financing
            </h4>
            <div class="mobile-filter-group">
                <label>Min Price</label>
                <input type="number" placeholder="$0" id="minPriceMobile" value="${filters.minPrice || ''}">
            </div>
            <div class="mobile-filter-group">
                <label>Max Price</label>
                <input type="number" placeholder="$100,000" id="maxPriceMobile" value="${filters.maxPrice || ''}">
            </div>
            <div class="mobile-filter-group">
                <label>Monthly Payment: <span id="monthlyPaymentMobileValue">$${filters.monthlyPayment || 1000}</span></label>
                <div class="mobile-range-slider">
                    <input type="range" id="monthlyPaymentMobileRange" min="0" max="2000" value="${filters.monthlyPayment || 1000}">
                    <div class="mobile-range-values">
                        <span>$0</span>
                        <span>$2,000+</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Vehicle Details -->
        <div class="mobile-filter-category">
            <h4 class="mobile-filter-category-title">
                <i data-lucide="car"></i>
                Vehicle Details
            </h4>
            <div class="mobile-filter-group">
                <label>Make</label>
                <div class="mobile-multi-select" id="makeMobileSelect">
                    <div class="mobile-multi-select-display">
                        <span>${filters.makes.length ? filters.makes.join(', ') : 'Select Makes'}</span>
                        <i data-lucide="chevron-down"></i>
                    </div>
                    <div class="mobile-multi-select-options">
                        ${['Toyota', 'Honda', 'Ford', 'Tesla', 'BMW', 'Mercedes-Benz', 'Chevrolet', 'Audi'].map(make => `
                            <div class="mobile-multi-select-option">
                                <input type="checkbox" value="${make}" id="make-mobile-${make.toLowerCase()}" ${filters.makes.includes(make) ? 'checked' : ''}>
                                <label for="make-mobile-${make.toLowerCase()}">${make}</label>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="mobile-selected-tags" id="makeMobileTags"></div>
            </div>
            <div class="mobile-filter-group">
                <label>Body Type</label>
                <select id="bodyTypeMobile">
                    <option value="">All Types</option>
                    <option value="Sedan" ${filters.bodyType === 'Sedan' ? 'selected' : ''}>Sedan</option>
                    <option value="SUV" ${filters.bodyType === 'SUV' ? 'selected' : ''}>SUV</option>
                    <option value="Truck" ${filters.bodyType === 'Truck' ? 'selected' : ''}>Truck</option>
                    <option value="Coupe" ${filters.bodyType === 'Coupe' ? 'selected' : ''}>Coupe</option>
                    <option value="Convertible" ${filters.bodyType === 'Convertible' ? 'selected' : ''}>Convertible</option>
                    <option value="Hatchback" ${filters.bodyType === 'Hatchback' ? 'selected' : ''}>Hatchback</option>
                    <option value="Wagon" ${filters.bodyType === 'Wagon' ? 'selected' : ''}>Wagon</option>
                </select>
            </div>
            <div class="mobile-filter-group">
                <label>Fuel Type</label>
                <select id="fuelTypeMobile">
                    <option value="">All Fuel Types</option>
                    <option value="Gasoline" ${filters.fuelType === 'Gasoline' ? 'selected' : ''}>Gasoline</option>
                    <option value="Hybrid" ${filters.fuelType === 'Hybrid' ? 'selected' : ''}>Hybrid</option>
                    <option value="Electric" ${filters.fuelType === 'Electric' ? 'selected' : ''}>Electric</option>
                    <option value="Diesel" ${filters.fuelType === 'Diesel' ? 'selected' : ''}>Diesel</option>
                </select>
            </div>
        </div>

        <!-- Performance & Specs -->
        <div class="mobile-filter-category">
            <h4 class="mobile-filter-category-title">
                <i data-lucide="gauge"></i>
                Performance & Specs
            </h4>
            <div class="mobile-filter-group">
                <label>Mileage: <span id="mileageMobileValue">${filters.mileageRange || 100000}</span> miles max</label>
                <div class="mobile-range-slider">
                    <input type="range" id="mileageMobileRange" min="0" max="200000" value="${filters.mileageRange || 100000}">
                    <div class="mobile-range-values">
                        <span>0 mi</span>
                        <span>200,000+ mi</span>
                    </div>
                </div>
            </div>
            <div class="mobile-filter-group">
                <label>Year: <span id="yearMobileValue">${filters.yearRange || 2020}</span> & newer</label>
                <div class="mobile-range-slider">
                    <input type="range" id="yearMobileRange" min="2010" max="2025" value="${filters.yearRange || 2020}">
                    <div class="mobile-range-values">
                        <span>2010</span>
                        <span>2025</span>
                    </div>
                </div>
            </div>
            <div class="mobile-filter-group">
                <label>Transmission</label>
                <select id="transmissionMobile">
                    <option value="">All Transmissions</option>
                    <option value="Automatic" ${filters.transmission === 'Automatic' ? 'selected' : ''}>Automatic</option>
                    <option value="Manual" ${filters.transmission === 'Manual' ? 'selected' : ''}>Manual</option>
                    <option value="CVT" ${filters.transmission === 'CVT' ? 'selected' : ''}>CVT</option>
                </select>
            </div>
        </div>
    `;
    
    // Initialize mobile filter interactions
    initializeMobileFilterInteractions();
    
    // Reinitialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function initializeMobileFilterInteractions() {
    // Range sliders
    const monthlyPaymentRange = document.getElementById('monthlyPaymentMobileRange');
    const mileageRange = document.getElementById('mileageMobileRange');
    const yearRange = document.getElementById('yearMobileRange');
    
    if (monthlyPaymentRange) {
        monthlyPaymentRange.addEventListener('input', (e) => {
            document.getElementById('monthlyPaymentMobileValue').textContent = `$${e.target.value}`;
            filters.monthlyPayment = e.target.value;
        });
    }
    
    if (mileageRange) {
        mileageRange.addEventListener('input', (e) => {
            document.getElementById('mileageMobileValue').textContent = parseInt(e.target.value).toLocaleString();
            filters.mileageRange = e.target.value;
        });
    }
    
    if (yearRange) {
        yearRange.addEventListener('input', (e) => {
            document.getElementById('yearMobileValue').textContent = e.target.value;
            filters.yearRange = e.target.value;
        });
    }
    
    // Multi-select for makes
    const makeMobileSelect = document.getElementById('makeMobileSelect');
    if (makeMobileSelect) {
        const display = makeMobileSelect.querySelector('.mobile-multi-select-display');
        const options = makeMobileSelect.querySelector('.mobile-multi-select-options');
        const checkboxes = makeMobileSelect.querySelectorAll('input[type="checkbox"]');
        
        display.addEventListener('click', () => {
            makeMobileSelect.classList.toggle('open');
        });
        
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const selectedMakes = Array.from(checkboxes)
                    .filter(cb => cb.checked)
                    .map(cb => cb.value);
                
                filters.makes = selectedMakes;
                display.querySelector('span').textContent = selectedMakes.length ? selectedMakes.join(', ') : 'Select Makes';
                updateMobileTags('makeMobileTags', selectedMakes);
            });
        });
    }
    
    // Input fields
    const minPriceMobile = document.getElementById('minPriceMobile');
    const maxPriceMobile = document.getElementById('maxPriceMobile');
    const bodyTypeMobile = document.getElementById('bodyTypeMobile');
    const fuelTypeMobile = document.getElementById('fuelTypeMobile');
    const transmissionMobile = document.getElementById('transmissionMobile');
    
    if (minPriceMobile) {
        minPriceMobile.addEventListener('input', (e) => {
            filters.minPrice = e.target.value;
        });
    }
    
    if (maxPriceMobile) {
        maxPriceMobile.addEventListener('input', (e) => {
            filters.maxPrice = e.target.value;
        });
    }
    
    if (bodyTypeMobile) {
        bodyTypeMobile.addEventListener('change', (e) => {
            filters.bodyType = e.target.value;
        });
    }
    
    if (fuelTypeMobile) {
        fuelTypeMobile.addEventListener('change', (e) => {
            filters.fuelType = e.target.value;
        });
    }
    
    if (transmissionMobile) {
        transmissionMobile.addEventListener('change', (e) => {
            filters.transmission = e.target.value;
        });
    }
}

function updateMobileTags(containerId, values) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = values.map(value => `
        <div class="mobile-selected-tag">
            ${value}
            <button class="mobile-tag-remove" onclick="removeMobileTag('${containerId}', '${value}')">
                <i data-lucide="x"></i>
            </button>
        </div>
    `).join('');
    
    // Reinitialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function removeMobileTag(containerId, value) {
    if (containerId === 'makeMobileTags') {
        filters.makes = filters.makes.filter(make => make !== value);
        updateMobileTags(containerId, filters.makes);
        
        // Update checkbox state
        const checkbox = document.getElementById(`make-mobile-${value.toLowerCase()}`);
        if (checkbox) {
            checkbox.checked = false;
        }
        
        // Update display
        const display = document.querySelector('#makeMobileSelect .mobile-multi-select-display span');
        if (display) {
            display.textContent = filters.makes.length ? filters.makes.join(', ') : 'Select Makes';
        }
    }
}

// Touch Gesture Functions
function initializeTouchGestures() {
    const carCards = document.querySelectorAll('.car-card');
    
    carCards.forEach(card => {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;
        let isDragging = false;
        let initialCardPosition = 0;
        
        // Touch start
        card.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchStartTime = Date.now();
            isDragging = false;
            initialCardPosition = 0;
            
            // Add touch feedback
            card.classList.add('touch-active');
            
            // Create ripple effect
            createTouchRipple(e.touches[0], card);
        }, { passive: true });
        
        // Touch move
        card.addEventListener('touchmove', (e) => {
            if (!touchStartX || !touchStartY) return;
            
            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
            const deltaX = touchX - touchStartX;
            const deltaY = touchY - touchStartY;
            
            // Check if this is a horizontal swipe (more horizontal than vertical movement)
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
                isDragging = true;
                
                // Prevent default scrolling
                e.preventDefault();
                
                // Add swiping class
                card.classList.add('swiping');
                
                // Apply transform with some resistance
                const resistance = 0.6;
                const translateX = deltaX * resistance;
                card.style.transform = `translateX(${translateX}px)`;
                
                // Show appropriate swipe action
                if (deltaX < -30) {
                    card.classList.add('swipe-left');
                    card.classList.remove('swipe-right');
                } else if (deltaX > 30) {
                    card.classList.add('swipe-right');
                    card.classList.remove('swipe-left');
                } else {
                    card.classList.remove('swipe-left', 'swipe-right');
                }
            }
        }, { passive: false });
        
        // Touch end
        card.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchTime = Date.now() - touchStartTime;
            const deltaX = touchEndX - touchStartX;
            const velocity = Math.abs(deltaX) / touchTime;
            
            // Remove touch feedback
            card.classList.remove('touch-active');
            
            if (isDragging) {
                const threshold = 80;
                const quickSwipeThreshold = 0.3; // pixels per ms
                
                // Determine action based on swipe distance or velocity
                if ((Math.abs(deltaX) > threshold) || (velocity > quickSwipeThreshold && Math.abs(deltaX) > 30)) {
                    if (deltaX < 0) {
                        // Swipe left - hide card
                        executeSwipeAction(card, 'hide');
                    } else {
                        // Swipe right - toggle favorite
                        executeSwipeAction(card, 'favorite');
                    }
                } else {
                    // Return to original position
                    resetCardPosition(card);
                }
            } else {
                // Quick tap - check if it's a genuine click
                if (touchTime < 200 && Math.abs(deltaX) < 10) {
                    // This was a tap, let the original click handler work
                }
                resetCardPosition(card);
            }
            
            // Reset values
            touchStartX = 0;
            touchStartY = 0;
            isDragging = false;
        }, { passive: true });
        
        // Touch cancel
        card.addEventListener('touchcancel', () => {
            card.classList.remove('touch-active');
            resetCardPosition(card);
            touchStartX = 0;
            touchStartY = 0;
            isDragging = false;
        }, { passive: true });
    });
}

function createTouchRipple(touch, element) {
    const ripple = document.createElement('div');
    ripple.classList.add('touch-ripple');
    
    const rect = element.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.style.width = '10px';
    ripple.style.height = '10px';
    
    element.appendChild(ripple);
    
    // Remove ripple after animation
    setTimeout(() => {
        if (ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
        }
    }, 600);
}

function executeSwipeAction(card, action) {
    const carId = parseInt(card.getAttribute('data-car-id'));
    const isCurrentlyFavorited = card.getAttribute('data-is-favorited') === 'true';
    
    if (action === 'hide') {
        // Hide card with animation
        card.style.transform = 'translateX(-100%)';
        card.style.opacity = '0.5';
        
        setTimeout(() => {
            card.style.display = 'none';
            // You could also remove from currentCars array here if desired
        }, 300);
        
        // Show brief feedback
        showSwipeToast('Card hidden', 'info');
        
    } else if (action === 'favorite') {
        // Toggle favorite
        toggleFavorite(carId);
        
        // Update the card's data attribute
        const newFavoriteState = favorites.has(carId);
        card.setAttribute('data-is-favorited', newFavoriteState.toString());
        
        // Update swipe hint
        const swipeHint = card.querySelector('.swipe-hint');
        if (swipeHint) {
            swipeHint.textContent = `← Swipe left to hide • Swipe right to ${newFavoriteState ? 'unfavorite' : 'favorite'} →`;
        }
        
        // Update swipe action text
        const swipeActionRight = card.querySelector('.swipe-action-right div');
        if (swipeActionRight) {
            swipeActionRight.innerHTML = `<i data-lucide="heart"></i><br>${newFavoriteState ? 'Unfavorite' : 'Favorite'}`;
        }
        
        // Show brief feedback
        showSwipeToast(newFavoriteState ? 'Added to favorites' : 'Removed from favorites', 'success');
        
        // Re-initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    // Reset card position
    resetCardPosition(card);
}

function resetCardPosition(card) {
    card.style.transform = '';
    card.style.opacity = '';
    card.classList.remove('swiping', 'swipe-left', 'swipe-right');
}

function showSwipeToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `swipe-toast swipe-toast-${type}`;
    toast.textContent = message;
    
    // Style the toast
    Object.assign(toast.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: type === 'success' ? '#10B981' : '#6B7280',
        color: 'white',
        padding: '0.75rem 1rem',
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        fontWeight: '500',
        zIndex: '9999',
        transform: 'translateX(400px)',
        transition: 'transform 0.3s ease',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
    });
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 10);
    
    // Animate out and remove
    setTimeout(() => {
        toast.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 2000);
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
    
    // Luxury filter (custom quick filter)
    if (filters.luxury === true) {
        const luxuryMakes = ['BMW', 'Mercedes-Benz', 'Audi', 'Lexus', 'Infiniti', 'Cadillac', 'Tesla'];
        filtered = filtered.filter(car => luxuryMakes.includes(car.make));
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
    updateRecommendations();
}

// Apply filters with loading state
function applyFiltersWithLoading() {
    startLoading();
    
    // Simulate realistic loading time for better UX
    setTimeout(() => {
        applyFilters();
        endLoading();
    }, 500 + Math.random() * 300);
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
    
    startLoading();
    
    setTimeout(() => {
        switch (sortBy) {
            case 'recommended':
                currentCars = sortByRecommendation(currentCars);
                break;
            case 'best-value':
                currentCars = sortByBestValue(currentCars);
                break;
            case 'trending':
                currentCars = sortByTrending(currentCars);
                break;
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
        
        endLoading();
        renderCars();
    }, 300 + Math.random() * 200);
}

// Smart Sorting Functions
function sortByRecommendation(cars) {
    const userPreferences = getUserPreferences();
    
    return cars.sort((a, b) => {
        const scoreA = calculateRecommendationScore(a, userPreferences);
        const scoreB = calculateRecommendationScore(b, userPreferences);
        return scoreB - scoreA;
    });
}

function sortByBestValue(cars) {
    return cars.sort((a, b) => {
        const valueA = calculateValueScore(a);
        const valueB = calculateValueScore(b);
        return valueB - valueA;
    });
}

function sortByTrending(cars) {
    return cars.sort((a, b) => {
        const trendA = calculateTrendingScore(a);
        const trendB = calculateTrendingScore(b);
        return trendB - trendA;
    });
}

function calculateRecommendationScore(car, preferences) {
    let score = 0;
    
    // Base score from car rating
    score += car.rating * 20;
    
    // Brand preference (based on search history and favorites)
    if (preferences.preferredBrands.includes(car.make)) {
        score += 50;
    }
    
    // Price range preference
    if (car.price >= preferences.minPrice && car.price <= preferences.maxPrice) {
        score += 30;
    }
    
    // Fuel type preference (eco-friendly gets bonus)
    if (preferences.preferredFuelTypes.includes(car.fuelType)) {
        score += 25;
    }
    
    // Year preference (newer cars get bonus)
    if (car.year >= preferences.minYear) {
        score += 20;
    }
    
    // Mileage preference (lower mileage gets bonus)
    if (car.mileage <= preferences.maxMileage) {
        score += 15;
    }
    
    // Features match (bonus for having preferred features)
    const featuresMatch = car.features.filter(feature => 
        preferences.preferredFeatures.includes(feature)
    ).length;
    score += featuresMatch * 10;
    
    // Recently viewed similar cars (bonus for similar models)
    const recentlyViewedSimilar = recentlyViewedCars.filter(viewedCar => 
        viewedCar.make === car.make || viewedCar.bodyType === car.bodyType
    ).length;
    score += recentlyViewedSimilar * 5;
    
    // Favorited similar cars
    const favoritesSimilar = mockCars.filter(mockCar => 
        favorites.has(mockCar.id) && 
        (mockCar.make === car.make || mockCar.bodyType === car.bodyType)
    ).length;
    score += favoritesSimilar * 15;
    
    return score;
}

function calculateValueScore(car) {
    let score = 0;
    
    // Lower price gets higher value score (inverse relationship)
    const maxPrice = Math.max(...mockCars.map(c => c.price));
    score += (maxPrice - car.price) / 1000;
    
    // Lower mileage gets bonus
    const maxMileage = Math.max(...mockCars.map(c => c.mileage));
    score += (maxMileage - car.mileage) / 10000;
    
    // Newer year gets bonus
    score += (car.year - 2010) * 5;
    
    // Higher rating gets bonus
    score += car.rating * 10;
    
    // Price drops get significant bonus
    const priceHistory = car.priceHistory || [car.price, car.price];
    if (priceHistory[priceHistory.length - 1] < priceHistory[0]) {
        const reduction = priceHistory[0] - priceHistory[priceHistory.length - 1];
        score += reduction / 100;
    }
    
    // Fewer days on market can indicate good value
    score += Math.max(0, 90 - car.daysOnMarket) / 10;
    
    return score;
}

function calculateTrendingScore(car) {
    let score = 0;
    
    // Recently listed cars are more "trending"
    score += Math.max(0, 30 - car.daysOnMarket) * 2;
    
    // Popular makes are trending
    const popularMakes = ['Tesla', 'Toyota', 'Honda', 'BMW', 'Mercedes-Benz'];
    if (popularMakes.includes(car.make)) {
        score += 50;
    }
    
    // Electric/Hybrid is trending
    if (car.fuelType === 'Electric' || car.fuelType === 'Hybrid') {
        score += 40;
    }
    
    // Newer cars are trending
    if (car.year >= 2022) {
        score += 30;
    }
    
    // Higher rating indicates popularity
    score += car.rating * 15;
    
    // Recent price changes indicate market interest
    const priceHistory = car.priceHistory || [car.price];
    if (priceHistory.length > 1) {
        score += 20;
    }
    
    // Luxury brands have trending appeal
    const luxuryBrands = ['BMW', 'Mercedes-Benz', 'Audi', 'Lexus'];
    if (luxuryBrands.includes(car.make)) {
        score += 25;
    }
    
    return score;
}

function getUserPreferences() {
    // Analyze user behavior to determine preferences
    const preferences = {
        preferredBrands: [],
        preferredFuelTypes: [],
        preferredFeatures: [],
        minPrice: 0,
        maxPrice: 100000,
        minYear: 2015,
        maxMileage: 80000
    };
    
    // Analyze search history
    const brandCounts = {};
    searchHistory.forEach(search => {
        carMakes.forEach(make => {
            if (search.toLowerCase().includes(make.toLowerCase())) {
                brandCounts[make] = (brandCounts[make] || 0) + 1;
            }
        });
    });
    
    // Get top 3 searched brands
    preferences.preferredBrands = Object.entries(brandCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([brand]) => brand);
    
    // Analyze favorites
    const favoritedCars = mockCars.filter(car => favorites.has(car.id));
    if (favoritedCars.length > 0) {
        // Get preferred price range from favorites
        const favoritePrices = favoritedCars.map(car => car.price);
        preferences.minPrice = Math.max(0, Math.min(...favoritePrices) - 5000);
        preferences.maxPrice = Math.max(...favoritePrices) + 10000;
        
        // Get preferred fuel types
        const fuelTypeCount = {};
        favoritedCars.forEach(car => {
            fuelTypeCount[car.fuelType] = (fuelTypeCount[car.fuelType] || 0) + 1;
        });
        preferences.preferredFuelTypes = Object.keys(fuelTypeCount);
        
        // Get preferred features
        const featureCount = {};
        favoritedCars.forEach(car => {
            car.features.forEach(feature => {
                featureCount[feature] = (featureCount[feature] || 0) + 1;
            });
        });
        preferences.preferredFeatures = Object.entries(featureCount)
            .filter(([, count]) => count >= 2)
            .map(([feature]) => feature);
    }
    
    // Set eco-friendly preference if user searches for it
    const ecoSearches = searchHistory.filter(search => 
        search.toLowerCase().includes('electric') || 
        search.toLowerCase().includes('hybrid') ||
        search.toLowerCase().includes('eco')
    );
    if (ecoSearches.length > 0) {
        preferences.preferredFuelTypes.push('Electric', 'Hybrid');
    }
    
    return preferences;
}

// Recommendation System
function generateRecommendations() {
    const userPreferences = getUserPreferences();
    const allCars = [...mockCars];
    
    // Get cars not in current results or recently viewed
    const currentCarIds = new Set(currentCars.map(car => car.id));
    const recentlyViewedIds = new Set(recentlyViewedCars.map(car => car.id));
    
    const candidateCars = allCars.filter(car => 
        !currentCarIds.has(car.id) && !recentlyViewedIds.has(car.id)
    );
    
    // Score and sort candidates
    const scoredCars = candidateCars.map(car => ({
        ...car,
        recommendationScore: calculateRecommendationScore(car, userPreferences),
        recommendationReason: getRecommendationReason(car, userPreferences)
    }));
    
    // Return top 10 recommendations
    return scoredCars
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, 10);
}

function getRecommendationReason(car, preferences) {
    const reasons = [];
    
    if (preferences.preferredBrands.includes(car.make)) {
        reasons.push(`You've shown interest in ${car.make}`);
    }
    
    if (car.fuelType === 'Electric' || car.fuelType === 'Hybrid') {
        reasons.push('Eco-friendly choice');
    }
    
    if (car.year >= 2022) {
        reasons.push('Latest model year');
    }
    
    if (car.rating >= 4.5) {
        reasons.push('Highly rated');
    }
    
    const priceHistory = car.priceHistory || [car.price, car.price];
    if (priceHistory[priceHistory.length - 1] < priceHistory[0]) {
        reasons.push('Recent price drop');
    }
    
    if (car.daysOnMarket <= 7) {
        reasons.push('New listing');
    }
    
    const featuresMatch = car.features.filter(feature => 
        preferences.preferredFeatures.includes(feature)
    ).length;
    if (featuresMatch > 2) {
        reasons.push('Matches your preferred features');
    }
    
    return reasons.length > 0 ? reasons[0] : 'Great value option';
}

function updateRecommendations() {
    const recommendationsSection = document.getElementById('recommendationsSection');
    const recommendationsCars = document.getElementById('recommendationsCars');
    
    // Only show recommendations if user has some activity
    if (searchHistory.length === 0 && favorites.size === 0 && recentlyViewedCars.length === 0) {
        recommendationsSection.style.display = 'none';
        return;
    }
    
    const recommendations = generateRecommendations();
    
    if (recommendations.length === 0) {
        recommendationsSection.style.display = 'none';
        return;
    }
    
    recommendationsSection.style.display = 'block';
    recommendationsCars.innerHTML = recommendations.map(car => createRecommendationCard(car)).join('');
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function createRecommendationCard(car) {
    const isLuxury = ['BMW', 'Mercedes-Benz', 'Audi', 'Lexus'].includes(car.make);
    const matchPercentage = Math.min(100, Math.round(car.recommendationScore / 2));
    const isFavorited = favorites.has(car.id);
    
    return `
        <div class="recommendation-card ${isLuxury ? 'premium' : ''}" onclick="viewCarDetails(${car.id})">
            <img src="${getCarImage(car.make, car.model)}" alt="${car.year} ${car.make} ${car.model}" class="car-image">
            
            <div class="recommendation-badge ${isLuxury ? 'premium' : ''}">
                ${isLuxury ? 'Premium' : 'Recommended'}
            </div>
            
            <div class="recommendation-match">
                ${matchPercentage}% match
            </div>
            
            <div class="recommendation-content">
                <div class="recommendation-title">${car.year} ${car.make} ${car.model}</div>
                <div class="recommendation-price">$${car.price.toLocaleString()}</div>
                
                <div class="recommendation-details">
                    <span>${car.mileage.toLocaleString()} mi</span>
                    <span>${car.fuelType}</span>
                    <span>⭐ ${car.rating}</span>
                </div>
                
                <div class="recommendation-reason">
                    ${car.recommendationReason}
                </div>
                
                <div class="recommendation-actions">
                    <button class="recommendation-action favorite" onclick="event.stopPropagation(); toggleFavorite(${car.id})">
                        ${isFavorited ? 'Unfavorite' : 'Favorite'}
                    </button>
                    <button class="recommendation-action compare" onclick="event.stopPropagation(); toggleCompare(${car.id})">
                        Compare
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Toggle favorite
function toggleFavorite(carId) {
    if (favorites.has(carId)) {
        favorites.delete(carId);
    } else {
        favorites.add(carId);
    }
    
    saveFavorites();
    updateFavoritesCount();
    renderCars();
    updateRecommendations();
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
    const isPriceDrop = priceChange.amount < -1000;
    const isInCompareList = compareList.has(car.id);
    const isLuxury = ['BMW', 'Mercedes-Benz', 'Audi', 'Lexus', 'Infiniti'].includes(car.make);
    const isElectricHybrid = ['Electric', 'Hybrid'].includes(car.fuelType);
    
    return `
        <div class="car-card ${isInCompareList ? 'selected-for-compare' : ''}" 
             onclick="viewCarDetails(${car.id})" 
             data-car-id="${car.id}" 
             data-is-favorited="${isFavorited}">
            
            <!-- Swipe Actions -->
            <div class="swipe-action swipe-action-left">
                <div>
                    <i data-lucide="x"></i><br>
                    Hide
                </div>
            </div>
            <div class="swipe-action swipe-action-right">
                <div>
                    <i data-lucide="heart"></i><br>
                    ${isFavorited ? 'Unfavorite' : 'Favorite'}
                </div>
            </div>
            
            <div class="car-image-container">
                <img src="${getCarImage(car.make, car.model)}" alt="${car.year} ${car.make} ${car.model}" class="car-image">
                
                <!-- Compare Checkbox -->
                <div class="compare-checkbox" onclick="event.stopPropagation(); toggleCompare(${car.id})">
                    <input type="checkbox" ${isInCompareList ? 'checked' : ''} readonly>
                    <span class="compare-label">Compare</span>
                </div>
                
                <!-- Favorite Button -->
                <button class="favorite-btn ${isFavorited ? 'favorited' : ''}" onclick="event.stopPropagation(); toggleFavorite(${car.id})">
                    <i data-lucide="heart" ${isFavorited ? 'class="favorited"' : ''}></i>
                </button>
                
                <!-- Enhanced Badges -->
                <div class="car-badges">
                    ${isNewListing ? '<div class="badge badge-new">🆕 New Listing</div>' : ''}
                    ${isPriceDrop ? '<div class="badge badge-price-drop">💰 Price Drop</div>' : ''}
                    ${isLuxury ? '<div class="badge badge-luxury">⭐ Luxury</div>' : ''}
                    ${isElectricHybrid ? '<div class="badge badge-eco">🔋 ' + car.fuelType + '</div>' : ''}
                    ${car.condition === 'New' ? '<div class="badge badge-condition">✨ New</div>' : ''}
                </div>
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
                
                <!-- Quick Action Buttons -->
                <div class="quick-actions">
                    <button class="quick-action-btn" onclick="event.stopPropagation(); contactDealer(${car.id})">
                        <span class="action-icon">📞</span>
                        <span class="action-text">Call</span>
                    </button>
                    <button class="quick-action-btn" onclick="event.stopPropagation(); emailDealer(${car.id})">
                        <span class="action-icon">✉️</span>
                        <span class="action-text">Email</span>
                    </button>
                    <button class="quick-action-btn" onclick="event.stopPropagation(); getDirections(${car.id})">
                        <span class="action-icon">🗺️</span>
                        <span class="action-text">Directions</span>
                    </button>
                </div>
                
                <button class="view-details-btn" onclick="event.stopPropagation(); viewCarDetails(${car.id})">
                    View Details
                </button>
            </div>
            
            <!-- Swipe Hint -->
            <div class="swipe-hint">
                ← Swipe left to hide • Swipe right to ${isFavorited ? 'unfavorite' : 'favorite'} →
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
    
    // Add to recently viewed
    addToRecentlyViewed(car);
    
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

// Show favorites modal
function showFavoritesModal() {
    const favoritedCars = mockCars.filter(car => favorites.has(car.id));
    const modalTitle = document.getElementById('modalCarTitle');
    const modalContent = document.getElementById('modalCarContent');
    
    modalTitle.textContent = `My Favorites (${favoritedCars.length})`;
    
    if (favoritedCars.length === 0) {
        modalContent.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #6b7280;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">❤️</div>
                <h3 style="font-size: 1.25rem; font-weight: 600; color: #1f2937; margin-bottom: 0.5rem;">No favorites yet</h3>
                <p>Start favoriting cars to see them here!</p>
            </div>
        `;
    } else {
        const favoritesGrid = favoritedCars.map(car => {
            const priceChange = calculatePriceChange(car);
            const isNewListing = car.daysOnMarket <= 7;
            
            return `
                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 0.75rem; overflow: hidden; transition: all 0.2s; cursor: pointer;" onclick="viewCarDetails(${car.id}); closeModal();">
                    <div style="position: relative;">
                        <img src="${getCarImage(car.make, car.model)}" alt="${car.year} ${car.make} ${car.model}" style="width: 100%; height: 200px; object-fit: cover;">
                        <button style="position: absolute; top: 0.5rem; right: 0.5rem; background: transparent; border: none; cursor: pointer; padding: 0.25rem;" onclick="event.stopPropagation(); toggleFavorite(${car.id}); showFavoritesModal();">
                            <div style="width: 20px; height: 20px; background-image: url('data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'%23dc2626\' viewBox=\'0 0 24 24\' stroke=\'%23dc2626\' stroke-width=\'2\'%3e%3cpath d=\'m19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z\'/%3e%3c/svg%3e'); background-size: contain; background-repeat: no-repeat; filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));"></div>
                        </button>
                        ${isNewListing ? '<div style="position: absolute; top: 0.5rem; left: 0.5rem; background: #059669; color: white; padding: 0.25rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500;">New Listing</div>' : ''}
                    </div>
                    
                    <div style="padding: 1rem;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                            <h3 style="font-size: 1.125rem; font-weight: 700; color: #1f2937; margin: 0;">${car.year} ${car.make} ${car.model}</h3>
                            <div style="display: flex; align-items: center; gap: 0.25rem; color: #fbbf24;">
                                <span style="font-size: 0.875rem;">⭐</span>
                                <span style="font-size: 0.875rem; color: #6b7280;">${car.rating}</span>
                            </div>
                        </div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                            <div style="font-size: 1.5rem; font-weight: 700; color: #059669;">$${car.price.toLocaleString()}</div>
                            <div style="display: flex; align-items: center; gap: 0.25rem; font-size: 0.875rem; color: ${priceChange.isPositive ? '#dc2626' : '#059669'};">
                                <span>${priceChange.isPositive ? '↗' : '↘'}</span>
                                ${Math.abs(priceChange.percent)}%
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.75rem; font-size: 0.875rem; color: #6b7280;">
                            <div style="display: flex; align-items: center; gap: 0.25rem;">
                                <span>📊</span>
                                <span>${car.mileage.toLocaleString()} mi</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 0.25rem;">
                                <span>⛽</span>
                                <span>${car.mpg}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 0.25rem;">
                                <span>📍</span>
                                <span>${car.location}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 0.25rem;">
                                <span>📅</span>
                                <span>${car.daysOnMarket} days</span>
                            </div>
                        </div>
                        
                        <div style="display: flex; flex-wrap: wrap; gap: 0.25rem; margin-bottom: 1rem;">
                            ${car.features.slice(0, 3).map(feature => 
                                `<span style="background: #dbeafe; color: #1d4ed8; padding: 0.25rem 0.5rem; border-radius: 0.375rem; font-size: 0.75rem;">${feature}</span>`
                            ).join('')}
                        </div>
                        
                        <button style="width: 100%; background: #2563eb; color: white; font-weight: 600; padding: 0.75rem; border: none; border-radius: 0.5rem; cursor: pointer; transition: all 0.2s;" onclick="event.stopPropagation(); viewCarDetails(${car.id}); closeModal();">
                            View Details
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        modalContent.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
                ${favoritesGrid}
            </div>
        `;
    }
    
    carModal.style.display = 'flex';
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
            
            // Initialize touch gestures for car cards
            initializeTouchGestures();
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
window.showFavoritesModal = showFavoritesModal;
window.selectSuggestion = selectSuggestion;
window.removeActiveChip = removeActiveChip;
window.removeFromRecentlyViewed = removeFromRecentlyViewed;
window.toggleCompare = toggleCompare;
window.emailDealer = emailDealer;
window.getDirections = getDirections;
window.removeMobileTag = removeMobileTag;