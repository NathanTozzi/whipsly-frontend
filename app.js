// Mock car data with coordinates
const mockCars = [
    {
        id: 1,
        make: 'Tesla',
        model: 'Model 3',
        year: 2023,
        price: 42990,
        mileage: 12500,
        location: 'San Francisco, CA',
        coordinates: [37.7749, -122.4194],
        dealer: 'Tesla San Francisco',
        image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=300&fit=crop',
        priceHistory: [45990, 44990, 43990, 42990],
        daysOnMarket: 12,
        mpg: '120 MPGe',
        transmission: 'Automatic',
        drivetrain: 'RWD',
        features: ['Autopilot', 'Premium Interior', 'Supercharging', 'Glass Roof', 'Heated Seats'],
        rating: 4.8
    },
    {
        id: 2,
        make: 'Honda',
        model: 'Civic',
        year: 2024,
        price: 28400,
        mileage: 5200,
        location: 'Los Angeles, CA',
        coordinates: [34.0522, -118.2437],
        dealer: 'Honda of LA',
        image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=300&fit=crop',
        priceHistory: [29900, 29400, 28900, 28400],
        daysOnMarket: 8,
        mpg: '32/42 MPG',
        transmission: 'CVT',
        drivetrain: 'FWD',
        features: ['Honda Sensing', 'Apple CarPlay', 'LED Headlights', 'Lane Assist', 'Backup Camera'],
        rating: 4.6
    },
    {
        id: 3,
        make: 'BMW',
        model: 'X3',
        year: 2023,
        price: 52900,
        mileage: 18700,
        location: 'Austin, TX',
        coordinates: [30.2672, -97.7431],
        dealer: 'BMW of Austin',
        image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop',
        priceHistory: [55900, 54900, 53900, 52900],
        daysOnMarket: 22,
        mpg: '23/29 MPG',
        transmission: '8-Speed Auto',
        drivetrain: 'AWD',
        features: ['iDrive 7', 'Premium Package', 'Harman Kardon', 'Panoramic Roof', 'Sport Package'],
        rating: 4.5
    },
    {
        id: 4,
        make: 'Ford',
        model: 'F-150',
        year: 2024,
        price: 48200,
        mileage: 8900,
        location: 'Dallas, TX',
        coordinates: [32.7767, -96.7970],
        dealer: 'Ford Dallas',
        image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400&h=300&fit=crop',
        priceHistory: [49900, 49200, 48700, 48200],
        daysOnMarket: 15,
        mpg: '20/24 MPG',
        transmission: '10-Speed Auto',
        drivetrain: '4WD',
        features: ['SYNC 4', 'Pro Power Onboard', 'Bed Liner', 'Tow Package', 'Off-Road Package'],
        rating: 4.7
    },
    {
        id: 5,
        make: 'Toyota',
        model: 'Camry Hybrid',
        year: 2024,
        price: 34500,
        mileage: 3200,
        location: 'Seattle, WA',
        coordinates: [47.6062, -122.3321],
        dealer: 'Toyota Seattle',
        image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop',
        priceHistory: [35900, 35200, 34800, 34500],
        daysOnMarket: 5,
        mpg: '51/53 MPG',
        transmission: 'CVT',
        drivetrain: 'FWD',
        features: ['Toyota Safety Sense 2.0', 'JBL Audio', 'Wireless Charging', 'Adaptive Cruise', 'Lane Centering'],
        rating: 4.6
    },
    {
        id: 6,
        make: 'Mercedes',
        model: 'C-Class',
        year: 2023,
        price: 46800,
        mileage: 15600,
        location: 'Miami, FL',
        coordinates: [25.7617, -80.1918],
        dealer: 'Mercedes Miami',
        image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=300&fit=crop',
        priceHistory: [49800, 48800, 47800, 46800],
        daysOnMarket: 28,
        mpg: '23/34 MPG',
        transmission: '9-Speed Auto',
        drivetrain: 'RWD',
        features: ['MBUX', 'Premium Package', 'AMG Line', 'Burmester Audio', 'Driver Assistance'],
        rating: 4.4
    }
];

// State management
let currentCars = [...mockCars];
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

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    renderCars();
    updateResultsTitle();
    
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
});

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
        <div class="car-card">
            <div class="car-image-container">
                <img src="${car.image}" alt="${car.year} ${car.make} ${car.model}" class="car-image">
                <button class="favorite-btn ${isFavorited ? 'favorited' : ''}" onclick="toggleFavorite(${car.id})">
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
                
                <button class="view-details-btn" onclick="viewCarDetails(${car.id})">
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
                        <img src="${car.image}" alt="${car.year} ${car.make} ${car.model}" class="car-popup-image">
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
        <img src="${car.image}" alt="${car.year} ${car.make} ${car.model}" class="modal-car-image">
        
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
    alert(`Contact ${car.dealer} about the ${car.year} ${car.make} ${car.model}\n\nIn a real application, this would open a contact form or provide dealer contact information.`);
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