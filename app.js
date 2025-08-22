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

// Add the car generation functions here (copy from the realistic-cars.js file)
// [INSERT THE ENTIRE REALISTIC CAR GENERATOR CODE HERE]

// Placeholder for generateRealisticCars function - you'll need to add your car generator code here
function generateRealisticCars(count) {
    // This should contain your realistic car generation logic
    // For now, returning an empty array - you'll need to add your generator code
    console.log('Please add your generateRealisticCars function here');
    return [];
}