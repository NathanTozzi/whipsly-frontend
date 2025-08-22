// Load realistic car data generator
// Include the realistic car generator functions (copy from previous artifact)

// Generate realistic car database on page load
let mockCars = [];

// Initialize realistic car data
function initializeCarData() {
    console.log('🚗 Generating realistic car inventory...');
    mockCars = generateRealisticCars(150); // Generate 150 realistic cars
    console.log(`✅ Generated ${mockCars.length} vehicles with realistic market data`);
    
    // Sort by popularity and recency (newest and most popular first)
    mockCars.sort((a, b) => {
        // Prioritize newer cars and popular models
        const aScore = a.year * 0.1 + (a.rating * 20);
        const bScore = b.year * 0.1 + (b.rating * 20);
        return bScore - aScore;
    });
}

// Enhanced market insights based on real data
function calculateMarketInsights() {
    if (mockCars.length === 0) return;
    
    const totalCars = mockCars.length;
    const avgPrice = mockCars.reduce((sum, car) => sum + car.price, 0) / totalCars;
    const avgDaysOnMarket = mockCars.reduce((sum, car) => sum + car.daysOnMarket, 0) / totalCars;
    
    // Calculate price drops (cars with negative price history)
    const carsWithPriceDrops = mockCars.filter(car => {
        const priceHistory = car.priceHistory;
        return priceHistory[priceHistory.length - 1] < priceHistory[0];
    });
    const priceDropPercentage = (carsWithPriceDrops.length / totalCars) * 100;
    
    // Update the insights on the page
    updateInsightDisplay('avg-price', `$${Math.round(avgPrice).toLocaleString()}`);
    updateInsightDisplay('total-listings', totalCars.toLocaleString());
    updateInsightDisplay('avg-days', `${Math.round(avgDaysOnMarket)} days`);
    updateInsightDisplay('price-drops', `${Math.round(priceDropPercentage)}%`);
}

function updateInsightDisplay(type, value) {
    // This will update the insight cards with real calculated data
    const selectors = {
        'avg-price': '.insight-value:nth-child(1)',
        'total-listings': '.insight-value:nth-child(2)', 
        'avg-days': '.insight-value:nth-child(3)',
        'price-drops': '.insight-value:nth-child(4)'
    };
    
    // Update insight values if elements exist
    document.querySelectorAll('.insight-value').forEach((el, index) => {
        switch(index) {
            case 0: el.textContent = `$${Math.round(mockCars.reduce((sum, car) => sum + car.price, 0) / mockCars.length).toLocaleString()}`; break;
            case 1: el.textContent = mockCars.length.toLocaleString(); break;
            case 2: el.textContent = `${Math.round(mockCars.reduce((sum, car) => sum + car.daysOnMarket, 0) / mockCars.length)} days`; break;
            case 3: 
                const dropsCount = mockCars.filter(car => car.priceHistory[car.priceHistory.length - 1] < car.priceHistory[0]).length;
                el.textContent = `${Math.round((dropsCount / mockCars.length) * 100)}%`;
                break;
        }
    });
}

// State management
let currentCars = [];
let favorites = new Set();
let currentView = 'grid';
let map = null;
let mapMarkers = [];
let filters = {
    search: '',
    minPrice: '',
    maxPrice: '',
    maxMileage: '',
    make: '',
    year: ''
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

// Filter inputs
const minPriceInput = document.getElementById('minPrice');
const maxPriceInput = document.getElementById('maxPrice');
const maxMileageInput = document.getElementById('maxMileage');
const makeFilterInput = document.getElementById('makeFilter');
const yearFilterInput = document.getElementById('yearFilter');

// Enhanced car image URLs (using Unsplash with car-specific searches)
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

// Enhanced image selection
function getCarImage(make, model) {
    const carKey = `${make} ${model}`;
    
    // Check if we have a specific image for this car
    if (carImageUrls[carKey]) {
        return carImageUrls[carKey];
    }
    
    // Fallback to generic car images based on make
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

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize realistic car data first
    initializeCarData();
    
    // Set initial current cars
    currentCars = [...mockCars];
    
    // Render cars and update insights
    renderCars();
    updateResultsTitle();
    calculateMarketInsights();
    
    // Search functionality
    searchInput.addEventListener('input', handleSearch);
    
    // Filter toggle
    filterToggle.addEventListener('click', toggleFilters);
    
    // Filter inputs
    minPriceInput.addEventListener('input', handleFilters);
    maxPriceInput.addEventListener('input', handleFilters);
    maxMileageInput.addEventListener('input', handleFilters);
    makeFilterInput.addEventListener('input', handleFilters);
    yearFilterInput.addEventListener('input', handleFilters);
    
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
    
    // Initialize map
    setTimeout(initializeMap, 100);
    
    // Initialize car card click handlers
    initializeCarCardClicks();
});

// Function to handle car card clicks (both button and entire card)
function initializeCarCardClicks() {
    // Handle clicks on the entire car card
    document.addEventListener('click', function(e) {
        const carCard = e.target.closest('.car-card');
        
        // Only proceed if we clicked on a car card
        if (!carCard) return;
        
        // Don't trigger card click if we clicked on the favorite button
        if (e.target.closest('.favorite-btn')) {
            e.stopPropagation();
            return;
        }
        
        // Don't trigger if we clicked on the View Details button directly
        if (e.target.closest('.view-details-btn')) {
            e.stopPropagation();
            return;
        }
        
        // Extract car ID from the card (we'll add this as a data attribute)
        const viewDetailsBtn = carCard.querySelector('.view-details-btn');
        if (viewDetailsBtn && viewDetailsBtn.onclick) {
            // Extract car ID from the onclick attribute
            const onclickStr = viewDetailsBtn.getAttribute('onclick');
            const carIdMatch = onclickStr.match(/viewCarDetails\((\d+)\)/);
            if (carIdMatch) {
                const carId = parseInt(carIdMatch[1]);
                viewCarDetails(carId);
            }
        }
    });
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

// Filter functionality
function handleFilters() {
    filters.minPrice = minPriceInput.value;
    filters.maxPrice = maxPriceInput.value;
    filters.maxMileage = maxMileageInput.value;
    filters.make = makeFilterInput.value;
    filters.year = yearFilterInput.value;
    applyFilters();
}

// Apply all filters
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
    if (filters.minPrice) {
        filtered = filtered.filter(car => car.price >= parseInt(filters.minPrice));
    }
    
    if (filters.maxPrice) {
        filtered = filtered.filter(car => car.price <= parseInt(filters.maxPrice));
    }
    
    // Mileage filter
    if (filters.maxMileage) {
        filtered = filtered.filter(car => car.mileage <= parseInt(filters.maxMileage));
    }
    
    // Make filter
    if (filters.make) {
        filtered = filtered.filter(car => 
            car.make.toLowerCase().includes(filters.make.toLowerCase())
        );
    }
    
    // Year filter
    if (filters.year) {
        filtered = filtered.filter(car => car.year >= parseInt(filters.year));
    }
    
    currentCars = filtered;
    renderCars();
    updateResultsTitle();
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
        <div class="car-card" data-car-id="${car.id}">
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
                        <i data-lucide="trending-up" style="transform: ${priceChange.isPositive ? 'rotate(180deg)' : 'none'}"></i>
                        ${priceChange.percent}% ${priceChange.isPositive ? 'up' : 'down'}
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
    
    // Update button states
    gridViewBtn.classList.toggle('active', view === 'grid');
    mapViewBtn.classList.toggle('active', view === 'map');
    
    if (view === 'grid') {
        carsGrid.style.display = 'grid';
        mapContainer.style.display = 'none';
    } else {
        carsGrid.style.display = 'none';
        mapContainer.style.display = 'block';
        
        // Initialize map if not already done
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
        console.log('Leaflet not loaded yet, retrying...');
        setTimeout(initializeMap, 500);
        return;
    }
    
    try {
        // Initialize Leaflet map centered on US
        map = L.map('carMap', {
            zoomControl: true,
            scrollWheelZoom: true
        }).setView([39.8283, -98.5795], 4);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(map);

        // Update markers initially
        updateMapMarkers();
    } catch (error) {
        console.error('Error initializing map:', error);
    }
}

// Update map markers
function updateMapMarkers() {
    if (!map) return;
    
    try {
        // Clear existing markers
        mapMarkers.forEach(marker => map.removeLayer(marker));
        mapMarkers = [];
        
        // Add markers for current cars
        currentCars.forEach(car => {
            const popupContent = `
                <div class="car-popup">
                    <div class="car-popup-content">
                        <img src="${getCarImage(car.make, car.model)}" alt="${car.year} ${car.make} ${car.model}" class="car-popup-image">
                        <div class="car-popup-info">
                            <div class="car-popup-title">${car.year} ${car.make} ${car.model}</div>
                            <div class="car-popup-price">$${car.price.toLocaleString()}</div>
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
        
        // Fit map to show all markers if there are any
        if (mapMarkers.length > 0) {
            const group = new L.featureGroup(mapMarkers);
            map.fitBounds(group.getBounds().pad(0.1));
        }
    } catch (error) {
        console.error('Error updating map markers:', error);
    }
}

// Show car modal
function showCarModal(car) {
    const priceChange = calculatePriceChange(car);
    const modalTitle = document.getElementById('modalCarTitle');
    const modalContent = document.getElementById('modalCarContent');
    
    modalTitle.textContent = `${car.year} ${car.make} ${car.model}`;
    
    modalContent.innerHTML = `
        <img src="${getCarImage(car.make, car.model)}" alt="${car.year} ${car.make} ${car.model}" class="modal-car-image">
        
        <div class="modal-car-info">
            <div class="modal-price-section">
                <div class="modal-price">$${car.price.toLocaleString()}</div>
                <div class="modal-dealer">
                    <div class="modal-dealer-name">${car.dealer}</div>
                    <div class="modal-dealer-location">${car.location}</div>
                </div>
            </div>
            
            <div class="modal-section">
                <h4>Vehicle Specifications</h4>
                <div class="modal-specs">
                    <div class="modal-spec">
                        <i data-lucide="gauge" class="modal-spec-icon"></i>
                        <span class="modal-spec-text">${car.mileage.toLocaleString()} miles</span>
                    </div>
                    <div class="modal-spec">
                        <i data-lucide="fuel" class="modal-spec-icon"></i>
                        <span class="modal-spec-text">${car.mpg}</span>
                    </div>
                    <div class="modal-spec">
                        <i data-lucide="settings" class="modal-spec-icon"></i>
                        <span class="modal-spec-text">${car.transmission}</span>
                    </div>
                    <div class="modal-spec">
                        <i data-lucide="zap" class="modal-spec-icon"></i>
                        <span class="modal-spec-text">${car.drivetrain}</span>
                    </div>
                    <div class="modal-spec">
                        <i data-lucide="calendar" class="modal-spec-icon"></i>
                        <span class="modal-spec-text">${car.daysOnMarket} days on market</span>
                    </div>
                    <div class="modal-spec">
                        <i data-lucide="star" class="modal-spec-icon"></i>
                        <span class="modal-spec-text">${car.rating}/5 rating</span>
                    </div>
                    <div class="modal-spec">
                        <i data-lucide="credit-card" class="modal-spec-icon"></i>
                        <span class="modal-spec-text">VIN: ${car.vin}</span>
                    </div>
                    <div class="modal-spec">
                        <i data-lucide="palette" class="modal-spec-icon"></i>
                        <span class="modal-spec-text">${car.exteriorColor} / ${car.interiorColor}</span>
                    </div>
                </div>
            </div>
            
            <div class="modal-section">
                <h4>Price History</h4>
                <div class="price-change ${priceChange.isPositive ? 'positive' : 'negative'}">
                    <i data-lucide="trending-up" style="transform: ${priceChange.isPositive ? 'rotate(180deg)' : 'none'}"></i>
                    ${priceChange.percent}% ${priceChange.isPositive ? 'increase' : 'decrease'} from original listing
                </div>
            </div>
            
            <div class="modal-section">
                <h4>Features & Options</h4>
                <div class="modal-features">
                    ${car.features.map(feature => `<span class="modal-feature">${feature}</span>`).join('')}
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="modal-btn modal-btn-primary" onclick="contactDealer(${car.id})">
                    Contact Dealer
                </button>
                <button class="modal-btn modal-btn-secondary" onclick="toggleFavorite(${car.id}); renderCars();">
                    ${favorites.has(car.id) ? 'Remove from' : 'Add to'} Favorites
                </button>
            </div>
        </div>
    `;
    
    carModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Reinitialize Lucide icons for modal content
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Close modal
function closeModal() {
    carModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Handle escape key and outside clicks for modal
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Contact dealer function
function contactDealer(carId) {
    const car = mockCars.find(c => c.id === carId);
    alert(`Contact ${car.dealer} about the ${car.year} ${car.make} ${car.model}\n\nPhone: (555) 123-4567\nAddress: ${car.location}\n\nIn a real application, this would open a contact form or provide dealer contact information.`);
}

// View car details
function viewCarDetails(carId) {
    const car = mockCars.find(c => c.id === carId);
    if (!car) return;
    
    showCarModal(car);
}

// Update render cars function to handle both views
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
            
            // Re-initialize car card click handlers after rendering
            setTimeout(() => {
                initializeCarCardClicks();
            }, 100);
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

// Initialize favorites count
updateFavoritesCount();

// REALISTIC CAR DATA GENERATOR
// Base car models with realistic pricing ranges and popularity
const carModels = {
    'Toyota': {
        'Camry': { basePrice: 25000, popularity: 85, depreciation: 0.12 },
        'Corolla': { basePrice: 22000, popularity: 90, depreciation: 0.15 },
        'RAV4': { basePrice: 28000, popularity: 88, depreciation: 0.10 },
        'Prius': { basePrice: 27000, popularity: 70, depreciation: 0.18 },
        'Highlander': { basePrice: 35000, popularity: 75, depreciation: 0.14 },
        'Tacoma': { basePrice: 32000, popularity: 80, depreciation: 0.08 }
    },
    'Honda': {
        'Civic': { basePrice: 23000, popularity: 85, depreciation: 0.13 },
        'Accord': { basePrice: 26000, popularity: 80, depreciation: 0.12 },
        'CR-V': { basePrice: 28000, popularity: 88, depreciation: 0.11 },
        'Pilot': { basePrice: 38000, popularity: 70, depreciation: 0.15 },
        'Odyssey': { basePrice: 35000, popularity: 60, depreciation: 0.20 },
        'Ridgeline': { basePrice: 38000, popularity: 45, depreciation: 0.16 }
    },
    'Ford': {
        'F-150': { basePrice: 33000, popularity: 95, depreciation: 0.09 },
        'Escape': { basePrice: 26000, popularity: 75, depreciation: 0.16 },
        'Explorer': { basePrice: 35000, popularity: 70, depreciation: 0.17 },
        'Mustang': { basePrice: 31000, popularity: 65, depreciation: 0.14 },
        'Edge': { basePrice: 33000, popularity: 60, depreciation: 0.18 },
        'Ranger': { basePrice: 27000, popularity: 70, depreciation: 0.12 }
    },
    'Chevrolet': {
        'Silverado': { basePrice: 34000, popularity: 90, depreciation: 0.10 },
        'Equinox': { basePrice: 26000, popularity: 75, depreciation: 0.17 },
        'Malibu': { basePrice: 24000, popularity: 65, depreciation: 0.19 },
        'Tahoe': { basePrice: 52000, popularity: 60, depreciation: 0.16 },
        'Camaro': { basePrice: 32000, popularity: 55, depreciation: 0.16 },
        'Traverse': { basePrice: 34000, popularity: 70, depreciation: 0.17 }
    },
    'BMW': {
        'X3': { basePrice: 45000, popularity: 40, depreciation: 0.22 },
        '3 Series': { basePrice: 42000, popularity: 45, depreciation: 0.20 },
        'X5': { basePrice: 60000, popularity: 35, depreciation: 0.25 },
        '5 Series': { basePrice: 55000, popularity: 30, depreciation: 0.23 },
        'X1': { basePrice: 38000, popularity: 50, depreciation: 0.21 },
        'X7': { basePrice: 75000, popularity: 20, depreciation: 0.28 }
    },
    'Mercedes-Benz': {
        'C-Class': { basePrice: 43000, popularity: 40, depreciation: 0.24 },
        'GLE': { basePrice: 58000, popularity: 35, depreciation: 0.26 },
        'A-Class': { basePrice: 34000, popularity: 45, depreciation: 0.22 },
        'E-Class': { basePrice: 56000, popularity: 30, depreciation: 0.25 },
        'GLC': { basePrice: 45000, popularity: 50, depreciation: 0.23 },
        'S-Class': { basePrice: 95000, popularity: 15, depreciation: 0.30 }
    },
    'Tesla': {
        'Model 3': { basePrice: 40000, popularity: 75, depreciation: 0.15 },
        'Model Y': { basePrice: 52000, popularity: 80, depreciation: 0.12 },
        'Model S': { basePrice: 95000, popularity: 25, depreciation: 0.20 },
        'Model X': { basePrice: 100000, popularity: 20, depreciation: 0.22 }
    },
    'Audi': {
        'Q5': { basePrice: 45000, popularity: 40, depreciation: 0.23 },
        'A4': { basePrice: 40000, popularity: 35, depreciation: 0.21 },
        'Q7': { basePrice: 58000, popularity: 30, depreciation: 0.26 },
        'A6': { basePrice: 56000, popularity: 25, depreciation: 0.24 },
        'Q3': { basePrice: 36000, popularity: 45, depreciation: 0.20 }
    }
};

// Real dealer locations across major US cities
const dealerLocations = {
    'Los Angeles, CA': { lat: 34.0522, lng: -118.2437, marketMultiplier: 1.15 },
    'San Francisco, CA': { lat: 37.7749, lng: -122.4194, marketMultiplier: 1.20 },
    'San Diego, CA': { lat: 32.7157, lng: -117.1611, marketMultiplier: 1.12 },
    'New York, NY': { lat: 40.7128, lng: -74.0060, marketMultiplier: 1.18 },
    'Chicago, IL': { lat: 41.8781, lng: -87.6298, marketMultiplier: 1.05 },
    'Houston, TX': { lat: 29.7604, lng: -95.3698, marketMultiplier: 0.98 },
    'Dallas, TX': { lat: 32.7767, lng: -96.7970, marketMultiplier: 1.02 },
    'Austin, TX': { lat: 30.2672, lng: -97.7431, marketMultiplier: 1.08 },
    'Miami, FL': { lat: 25.7617, lng: -80.1918, marketMultiplier: 1.10 },
    'Tampa, FL': { lat: 27.9506, lng: -82.4572, marketMultiplier: 1.03 },
    'Atlanta, GA': { lat: 33.7490, lng: -84.3880, marketMultiplier: 1.00 },
    'Phoenix, AZ': { lat: 33.4484, lng: -112.0740, marketMultiplier: 1.06 },
    'Denver, CO': { lat: 39.7392, lng: -104.9903, marketMultiplier: 1.09 },
    'Seattle, WA': { lat: 47.6062, lng: -122.3321, marketMultiplier: 1.16 },
    'Portland, OR': { lat: 45.5152, lng: -122.6784, marketMultiplier: 1.11 },
    'Las Vegas, NV': { lat: 36.1699, lng: -115.1398, marketMultiplier: 1.07 },
    'Boston, MA': { lat: 42.3601, lng: -71.0589, marketMultiplier: 1.14 },
    'Philadelphia, PA': { lat: 39.9526, lng: -75.1652, marketMultiplier: 1.06 },
    'Nashville, TN': { lat: 36.1627, lng: -86.7816, marketMultiplier: 0.96 },
    'Charlotte, NC': { lat: 35.2271, lng: -80.8431, marketMultiplier: 0.99 }
};

// Popular car features by category
const carFeatures = {
    safety: ['Adaptive Cruise Control', 'Lane Departure Warning', 'Blind Spot Monitoring', 'Automatic Emergency Braking', 'Rear Cross Traffic Alert'],
    technology: ['Apple CarPlay', 'Android Auto', 'Wireless Charging', 'Premium Audio', 'Navigation System', 'WiFi Hotspot'],
    comfort: ['Heated Seats', 'Cooled Seats', 'Panoramic Sunroof', 'Leather Interior', 'Power Liftgate', 'Remote Start'],
    performance: ['Turbo Engine', 'All-Wheel Drive', 'Sport Mode', 'Performance Tires', 'Sport Suspension', 'Paddle Shifters'],
    luxury: ['Premium Package', 'Driver Assistance Package', 'Cold Weather Package', 'Towing Package', 'Off-Road Package']
};

// Helper functions for car generation
function generateVIN() {
    const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
    let vin = '';
    for (let i = 0; i < 17; i++) {
        vin += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return vin;
}

function calculateRealisticMileage(year) {
    const currentYear = 2024;
    const age = currentYear - year;
    const avgMilesPerYear = 10000 + Math.random() * 5000;
    const baseMileage = age * avgMilesPerYear;
    const variation = baseMileage * (Math.random() * 0.4 - 0.2);
    return Math.max(100, Math.round(baseMileage + variation));
}

function calculateRealisticPrice(basePrice, year, mileage, location, depreciation) {
    const currentYear = 2024;
    const age = currentYear - year;
    
    let price = basePrice * Math.pow(1 - depreciation, age);
    
    const avgMileage = age * 12000;
    const mileageDiff = mileage - avgMileage;
    const mileageAdjustment = mileageDiff * -0.05;
    price += mileageAdjustment;
    
    const locationData = dealerLocations[location];
    if (locationData) {
        price *= locationData.marketMultiplier;
    }
    
    price *= (0.95 + Math.random() * 0.1);
    return Math.round(price / 500) * 500;
}

function generateRealisticDaysOnMarket(popularity) {
    const baseDays = Math.max(1, 45 - (popularity * 0.4));
    const variation = baseDays * (Math.random() * 1.5);
    return Math.round(baseDays + variation);
}

function getRandomCarFeatures(make, price) {
    const allFeatures = [...carFeatures.safety, ...carFeatures.technology, ...carFeatures.comfort];
    
    if (price > 50000) {
        allFeatures.push(...carFeatures.performance, ...carFeatures.luxury);
    }
    
    if (make === 'Tesla') {
        return ['Autopilot', 'Over-the-Air Updates', 'Supercharging', 'Glass Roof', 'Premium Interior'];
    }
    
    const numFeatures = 3 + Math.floor(Math.random() * 4);
    const selectedFeatures = [];
    
    for (let i = 0; i < numFeatures; i++) {
        const randomFeature = allFeatures[Math.floor(Math.random() * allFeatures.length)];
        if (!selectedFeatures.includes(randomFeature)) {
            selectedFeatures.push(randomFeature);
        }
    }
    
    return selectedFeatures;
}

function generateRealisticMPG(make, model, year) {
    const isHybrid = model.includes('Prius') || Math.random() < 0.15;
    const isTruck = model.includes('F-150') || model.includes('Silverado') || model.includes('Tacoma') || model.includes('Ranger');
    const isSUV = model.includes('RAV4') || model.includes('CR-V') || model.includes('X3') || model.includes('Q5');
    const isLuxury = ['BMW', 'Mercedes-Benz', 'Audi'].includes(make);
    const isTesla = make === 'Tesla';
    
    let cityMPG, highwayMPG;
    
    if (isTesla) {
        cityMPG = 110 + Math.random() * 20;
        return `${Math.round(cityMPG)} MPGe`;
    } else if (isHybrid) {
        cityMPG = 45 + Math.random() * 15;
        highwayMPG = 40 + Math.random() * 15;
    } else if (isTruck) {
        cityMPG = 18 + Math.random() * 5;
        highwayMPG = 22 + Math.random() * 8;
    } else if (isSUV) {
        cityMPG = 22 + Math.random() * 8;
        highwayMPG = 28 + Math.random() * 10;
    } else if (isLuxury) {
        cityMPG = 20 + Math.random() * 8;
        highwayMPG = 28 + Math.random() * 12;
    } else {
        cityMPG = 28 + Math.random() * 8;
        highwayMPG = 35 + Math.random() * 10;
    }
    
    const efficiencyBonus = (year - 2015) * 0.5;
    cityMPG += efficiencyBonus;
    highwayMPG += efficiencyBonus;
    
    return `${Math.round(cityMPG)}/${Math.round(highwayMPG)} MPG`;
}

function generateRealisticTransmission(make, model, year) {
    const isManual = Math.random() < 0.05;
    const isCVT = ['Toyota', 'Honda', 'Subaru'].includes(make) && Math.random() < 0.4;
    const isElectric = make === 'Tesla';
    
    if (isElectric) return 'Direct Drive';
    if (isManual) return '6-Speed Manual';
    if (isCVT) return 'CVT';
    
    const speeds = year > 2018 ? ['8-Speed', '9-Speed', '10-Speed'] : ['6-Speed', '7-Speed', '8-Speed'];
    return `${speeds[Math.floor(Math.random() * speeds.length)]} Automatic`;
}

function generateRealisticDrivetrain(make, model) {
    const isAWD = model.includes('X') || model.includes('Q') || model.includes('4') || 
                 ['RAV4', 'CR-V', 'Highlander', 'Pilot', 'Explorer', 'Tahoe'].includes(model);
    const isTruck = ['F-150', 'Silverado', 'Tacoma', 'Ranger'].includes(model);
    
    if (isTruck && Math.random() < 0.6) return '4WD';
    if (isAWD && Math.random() < 0.7) return 'AWD';
    if (['BMW', 'Audi', 'Mercedes-Benz'].includes(make) && Math.random() < 0.3) return 'RWD';
    
    return 'FWD';
}

function generateRealisticDealerName(make, location) {
    const city = location.split(',')[0];
    return `${make} of ${city}`;
}

function generateRealisticPriceHistory(currentPrice) {
    const history = [];
    let price = currentPrice;
    
    for (let i = 3; i >= 0; i--) {
        const change = Math.random() < 0.7 ? 
            Math.random() * 1000 + 500 : 
            -(Math.random() * 800);
        
        price += change;
        history.unshift(Math.round(price / 100) * 100);
    }
    
    return history;
}

function generateRealisticRating(make, popularity) {
    const baseRating = 3.5 + (popularity / 100) * 1.3;
    const variation = (Math.random() - 0.5) * 0.4;
    return Math.round((baseRating + variation) * 10) / 10;
}

function getCarBodyStyle(model) {
    const suvModels = ['RAV4', 'CR-V', 'X3', 'X5', 'Q5', 'Q7', 'GLE', 'GLC', 'Explorer', 'Highlander', 'Pilot', 'Tahoe', 'Traverse'];
    const truckModels = ['F-150', 'Silverado', 'Tacoma', 'Ranger', 'Ridgeline'];
    const sedanModels = ['Camry', 'Accord', 'Civic', 'Corolla', 'Malibu', '3 Series', '5 Series', 'C-Class', 'E-Class', 'S-Class', 'A4', 'A6'];
    
    if (truckModels.includes(model)) return 'Pickup Truck';
    if (suvModels.includes(model)) return 'SUV';
    if (sedanModels.includes(model)) return 'Sedan';
    if (model.includes('Mustang') || model.includes('Camaro')) return 'Coupe';
    
    return 'Sedan';
}

function getRandomExteriorColor() {
    const colors = ['White', 'Black', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Brown', 'Gold', 'Orange'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function getRandomInteriorColor() {
    const colors = ['Black', 'Gray', 'Beige', 'Brown', 'Tan'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Main realistic car generator function
function generateRealisticCars(count = 200) {
    const cars = [];
    let carId = 1;
    
    const allCombinations = [];
    Object.keys(carModels).forEach(make => {
        Object.keys(carModels[make]).forEach(model => {
            const data = carModels[make][model];
            allCombinations.push({ make, model, ...data });
        });
    });
    
    for (let i = 0; i < count; i++) {
        let selectedCar;
        const random = Math.random() * 100;
        let cumulative = 0;
        
        for (const combo of allCombinations) {
            cumulative += combo.popularity / 10;
            if (random <= cumulative || combo === allCombinations[allCombinations.length - 1]) {
                selectedCar = combo;
                break;
            }
        }
        
        const yearWeights = [
            { year: 2024, weight: 15 },
            { year: 2023, weight: 25 },
            { year: 2022, weight: 20 },
            { year: 2021, weight: 15 },
            { year: 2020, weight: 10 },
            { year: 2019, weight: 8 },
            { year: 2018, weight: 4 },
            { year: 2017, weight: 3 }
        ];
        
        const randomYear = Math.random() * 100;
        let cumulativeWeight = 0;
        let year = 2024;
        
        for (const { year: y, weight } of yearWeights) {
            cumulativeWeight += weight;
            if (randomYear <= cumulativeWeight) {
                year = y;
                break;
            }
        }
        
        const mileage = calculateRealisticMileage(year);
        const locations = Object.keys(dealerLocations);
        const location = locations[Math.floor(Math.random() * locations.length)];
        const price = calculateRealisticPrice(selectedCar.basePrice, year, mileage, location, selectedCar.depreciation);
        const daysOnMarket = generateRealisticDaysOnMarket(selectedCar.popularity);
        
        const car = {
            id: carId++,
            make: selectedCar.make,
            model: selectedCar.model,
            year: year,
            price: price,
            mileage: mileage,
            location: location,
            coordinates: [dealerLocations[location].lat, dealerLocations[location].lng],
            dealer: generateRealisticDealerName(selectedCar.make, location),
            image: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000000)}?w=400&h=300&fit=crop&auto=format&q=80`,
            priceHistory: generateRealisticPriceHistory(price),
            daysOnMarket: daysOnMarket,
            mpg: generateRealisticMPG(selectedCar.make, selectedCar.model, year),
            transmission: generateRealisticTransmission(selectedCar.make, selectedCar.model, year),
            drivetrain: generateRealisticDrivetrain(selectedCar.make, selectedCar.model),
            features: getRandomCarFeatures(selectedCar.make, price),
            rating: generateRealisticRating(selectedCar.make, selectedCar.popularity),
            vin: generateVIN(),
            condition: 'Used',
            bodyStyle: getCarBodyStyle(selectedCar.model),
            fuelType: selectedCar.make === 'Tesla' ? 'Electric' : 'Gasoline',
            exteriorColor: getRandomExteriorColor(),
            interiorColor: getRandomInteriorColor()
        };
        
        cars.push(car);
    }
    
    return cars;
}