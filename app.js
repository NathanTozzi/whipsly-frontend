// Mock car data
const mockCars = [
    {
        id: 1,
        make: 'Tesla',
        model: 'Model 3',
        year: 2023,
        price: 42990,
        mileage: 12500,
        location: 'San Francisco, CA',
        dealer: 'Tesla San Francisco',
        image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=300&fit=crop',
        priceHistory: [45990, 44990, 43990, 42990],
        daysOnMarket: 12,
        mpg: '120 MPGe',
        transmission: 'Automatic',
        drivetrain: 'RWD',
        features: ['Autopilot', 'Premium Interior', 'Supercharging'],
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
        dealer: 'Honda of LA',
        image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=300&fit=crop',
        priceHistory: [29900, 29400, 28900, 28400],
        daysOnMarket: 8,
        mpg: '32/42 MPG',
        transmission: 'CVT',
        drivetrain: 'FWD',
        features: ['Honda Sensing', 'Apple CarPlay', 'LED Headlights'],
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
        dealer: 'BMW of Austin',
        image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop',
        priceHistory: [55900, 54900, 53900, 52900],
        daysOnMarket: 22,
        mpg: '23/29 MPG',
        transmission: '8-Speed Auto',
        drivetrain: 'AWD',
        features: ['iDrive 7', 'Premium Package', 'Harman Kardon'],
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
        dealer: 'Ford Dallas',
        image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400&h=300&fit=crop',
        priceHistory: [49900, 49200, 48700, 48200],
        daysOnMarket: 15,
        mpg: '20/24 MPG',
        transmission: '10-Speed Auto',
        drivetrain: '4WD',
        features: ['SYNC 4', 'Pro Power Onboard', 'Bed Liner'],
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
        dealer: 'Toyota Seattle',
        image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop',
        priceHistory: [35900, 35200, 34800, 34500],
        daysOnMarket: 5,
        mpg: '51/53 MPG',
        transmission: 'CVT',
        drivetrain: 'FWD',
        features: ['Toyota Safety Sense 2.0', 'JBL Audio', 'Wireless Charging'],
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
        dealer: 'Mercedes Miami',
        image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=300&fit=crop',
        priceHistory: [49800, 48800, 47800, 46800],
        daysOnMarket: 28,
        mpg: '23/34 MPG',
        transmission: '9-Speed Auto',
        drivetrain: 'RWD',
        features: ['MBUX', 'Premium Package', 'AMG Line'],
        rating: 4.4
    }
];

// State management
let currentCars = [...mockCars];
let favorites = new Set();
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
const resultsTitle = document.getElementById('resultsTitle');
const noResults = document.getElementById('noResults');
const favoritesCount = document.getElementById('favoritesCount');
const sortSelect = document.getElementById('sortSelect');

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
        filtered = filtered.filter(car