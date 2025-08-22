// Realistic Car Data Generator for Whipsly
// Creates market-accurate vehicles with real pricing, locations, and specs

// Base car models with realistic pricing ranges and popularity
const carModels = {
    'Toyota': {
        'Camry': { basePrice: 25000, popularity: 85, depreciation: 0.12, bodyStyle: 'Sedan' },
        'Corolla': { basePrice: 22000, popularity: 90, depreciation: 0.15, bodyStyle: 'Sedan' },
        'RAV4': { basePrice: 28000, popularity: 88, depreciation: 0.10, bodyStyle: 'SUV' },
        'Prius': { basePrice: 27000, popularity: 70, depreciation: 0.18, bodyStyle: 'Hatchback' },
        'Highlander': { basePrice: 35000, popularity: 75, depreciation: 0.14, bodyStyle: 'SUV' },
        'Tacoma': { basePrice: 32000, popularity: 80, depreciation: 0.08, bodyStyle: 'Truck' }
    },
    'Honda': {
        'Civic': { basePrice: 23000, popularity: 85, depreciation: 0.13, bodyStyle: 'Sedan' },
        'Accord': { basePrice: 26000, popularity: 80, depreciation: 0.12, bodyStyle: 'Sedan' },
        'CR-V': { basePrice: 28000, popularity: 88, depreciation: 0.11, bodyStyle: 'SUV' },
        'Pilot': { basePrice: 38000, popularity: 70, depreciation: 0.15, bodyStyle: 'SUV' },
        'Odyssey': { basePrice: 35000, popularity: 60, depreciation: 0.20, bodyStyle: 'Wagon' },
        'Ridgeline': { basePrice: 38000, popularity: 45, depreciation: 0.16, bodyStyle: 'Truck' }
    },
    'Ford': {
        'F-150': { basePrice: 33000, popularity: 95, depreciation: 0.09, bodyStyle: 'Truck' },
        'Escape': { basePrice: 26000, popularity: 75, depreciation: 0.16, bodyStyle: 'SUV' },
        'Explorer': { basePrice: 35000, popularity: 70, depreciation: 0.17, bodyStyle: 'SUV' },
        'Mustang': { basePrice: 31000, popularity: 65, depreciation: 0.14, bodyStyle: 'Coupe' },
        'Edge': { basePrice: 33000, popularity: 60, depreciation: 0.18, bodyStyle: 'SUV' },
        'Ranger': { basePrice: 27000, popularity: 70, depreciation: 0.12, bodyStyle: 'Truck' }
    },
    'Chevrolet': {
        'Silverado': { basePrice: 34000, popularity: 90, depreciation: 0.10, bodyStyle: 'Truck' },
        'Equinox': { basePrice: 26000, popularity: 75, depreciation: 0.17, bodyStyle: 'SUV' },
        'Malibu': { basePrice: 24000, popularity: 65, depreciation: 0.19, bodyStyle: 'Sedan' },
        'Tahoe': { basePrice: 52000, popularity: 60, depreciation: 0.16, bodyStyle: 'SUV' },
        'Camaro': { basePrice: 32000, popularity: 55, depreciation: 0.16, bodyStyle: 'Coupe' },
        'Traverse': { basePrice: 34000, popularity: 70, depreciation: 0.17, bodyStyle: 'SUV' }
    },
    'BMW': {
        'X3': { basePrice: 45000, popularity: 40, depreciation: 0.22, bodyStyle: 'SUV' },
        '3 Series': { basePrice: 42000, popularity: 45, depreciation: 0.20, bodyStyle: 'Sedan' },
        'X5': { basePrice: 60000, popularity: 35, depreciation: 0.25, bodyStyle: 'SUV' },
        '5 Series': { basePrice: 55000, popularity: 30, depreciation: 0.23, bodyStyle: 'Sedan' },
        'X1': { basePrice: 38000, popularity: 50, depreciation: 0.21, bodyStyle: 'SUV' },
        'X7': { basePrice: 75000, popularity: 20, depreciation: 0.28, bodyStyle: 'SUV' }
    },
    'Mercedes-Benz': {
        'C-Class': { basePrice: 43000, popularity: 40, depreciation: 0.24, bodyStyle: 'Sedan' },
        'GLE': { basePrice: 58000, popularity: 35, depreciation: 0.26, bodyStyle: 'SUV' },
        'A-Class': { basePrice: 34000, popularity: 45, depreciation: 0.22, bodyStyle: 'Sedan' },
        'E-Class': { basePrice: 56000, popularity: 30, depreciation: 0.25, bodyStyle: 'Sedan' },
        'GLC': { basePrice: 45000, popularity: 50, depreciation: 0.23, bodyStyle: 'SUV' },
        'S-Class': { basePrice: 95000, popularity: 15, depreciation: 0.30, bodyStyle: 'Sedan' }
    },
    'Tesla': {
        'Model 3': { basePrice: 40000, popularity: 75, depreciation: 0.15, bodyStyle: 'Sedan' },
        'Model Y': { basePrice: 52000, popularity: 80, depreciation: 0.12, bodyStyle: 'SUV' },
        'Model S': { basePrice: 95000, popularity: 25, depreciation: 0.20, bodyStyle: 'Sedan' },
        'Model X': { basePrice: 100000, popularity: 20, depreciation: 0.22, bodyStyle: 'SUV' }
    },
    'Audi': {
        'Q5': { basePrice: 45000, popularity: 40, depreciation: 0.23, bodyStyle: 'SUV' },
        'A4': { basePrice: 40000, popularity: 35, depreciation: 0.21, bodyStyle: 'Sedan' },
        'Q7': { basePrice: 58000, popularity: 30, depreciation: 0.26, bodyStyle: 'SUV' },
        'A6': { basePrice: 56000, popularity: 25, depreciation: 0.24, bodyStyle: 'Sedan' },
        'Q3': { basePrice: 36000, popularity: 45, depreciation: 0.20, bodyStyle: 'SUV' }
    }
};

// Real dealer locations across major US cities
const dealers = {
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

// Popular car features by category - Updated to match filter options
const features = {
    safety: ['Adaptive Cruise Control', 'Lane Departure Warning', 'Blind Spot Monitoring', 'Automatic Emergency Braking', 'Rear Cross Traffic Alert'],
    technology: ['Apple CarPlay', 'Android Auto', 'Bluetooth', 'Navigation', 'Wireless Charging', 'Premium Audio', 'WiFi Hotspot'],
    comfort: ['Heated Seats', 'Leather Seats', 'Sunroof', 'Remote Start', 'Power Liftgate', 'Backup Camera'],
    performance: ['Turbo Engine', 'All-Wheel Drive', 'Sport Mode', 'Performance Tires', 'Sport Suspension', 'Paddle Shifters'],
    luxury: ['Premium Package', 'Driver Assistance Package', 'Cold Weather Package', 'Towing Package', 'Off-Road Package']
};

// Generate realistic VIN
function generateVIN() {
    const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
    let vin = '';
    for (let i = 0; i < 17; i++) {
        vin += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return vin;
}

// Calculate realistic mileage based on age
function calculateMileage(year) {
    const currentYear = 2024;
    const age = currentYear - year;
    const avgMilesPerYear = 10000 + Math.random() * 5000; // 10k-15k per year
    const baseMileage = age * avgMilesPerYear;
    const variation = baseMileage * (Math.random() * 0.4 - 0.2); // ±20% variation
    return Math.max(100, Math.round(baseMileage + variation));
}

// Calculate market price with realistic factors
function calculatePrice(basePrice, year, mileage, location, depreciation) {
    const currentYear = 2024;
    const age = currentYear - year;
    
    // Age depreciation
    let price = basePrice * Math.pow(1 - depreciation, age);
    
    // Mileage adjustment
    const avgMileage = age * 12000;
    const mileageDiff = mileage - avgMileage;
    const mileageAdjustment = mileageDiff * -0.05; // $0.05 per mile difference
    price += mileageAdjustment;
    
    // Market location adjustment
    const locationData = dealers[location];
    if (locationData) {
        price *= locationData.marketMultiplier;
    }
    
    // Random market variation (±5%)
    price *= (0.95 + Math.random() * 0.1);
    
    // Round to nearest $500
    return Math.round(price / 500) * 500;
}

// Generate realistic days on market
function generateDaysOnMarket(popularity) {
    const baseDays = Math.max(1, 45 - (popularity * 0.4)); // Popular cars sell faster
    const variation = baseDays * (Math.random() * 1.5); // Add randomness
    return Math.round(baseDays + variation);
}

// Get random features for a car - Updated to match filter system
function getRandomFeatures(make, price) {
    const allFeatures = [...features.safety, ...features.technology, ...features.comfort];
    
    // Luxury cars get performance and luxury features
    if (price > 50000) {
        allFeatures.push(...features.performance, ...features.luxury);
    }
    
    // Tesla gets specific tech features
    if (make === 'Tesla') {
        return ['Autopilot', 'Apple CarPlay', 'Navigation', 'Backup Camera', 'Heated Seats'];
    }
    
    // Select 3-6 random features that match our filter options
    const filterFeatures = ['Sunroof', 'Leather Seats', 'Navigation', 'Backup Camera', 'Bluetooth', 'Heated Seats', 'Remote Start', 'Apple CarPlay'];
    const numFeatures = 3 + Math.floor(Math.random() * 4);
    const selectedFeatures = [];
    
    for (let i = 0; i < numFeatures; i++) {
        const randomFeature = filterFeatures[Math.floor(Math.random() * filterFeatures.length)];
        if (!selectedFeatures.includes(randomFeature)) {
            selectedFeatures.push(randomFeature);
        }
    }
    
    return selectedFeatures;
}

// Generate fuel economy based on vehicle type
function generateMPG(make, model, year) {
    const currentYear = 2024;
    const isHybrid = model.includes('Prius') || Math.random() < 0.15;
    const isTruck = model.includes('F-150') || model.includes('Silverado') || model.includes('Tacoma') || model.includes('Ranger');
    const isSUV = model.includes('RAV4') || model.includes('CR-V') || model.includes('X3') || model.includes('Q5');
    const isLuxury = ['BMW', 'Mercedes-Benz', 'Audi'].includes(make);
    const isTesla = make === 'Tesla';
    
    let cityMPG, highwayMPG;
    
    if (isTesla) {
        // Tesla uses MPGe
        cityMPG = 110 + Math.random() * 20;
        highwayMPG = cityMPG + Math.random() * 10;
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
        // Regular sedan/compact
        cityMPG = 28 + Math.random() * 8;
        highwayMPG = 35 + Math.random() * 10;
    }
    
    // Newer cars tend to be more efficient
    const efficiencyBonus = (year - 2015) * 0.5;
    cityMPG += efficiencyBonus;
    highwayMPG += efficiencyBonus;
    
    return `${Math.round(cityMPG)}/${Math.round(highwayMPG)} mpg`;
}

// Generate transmission based on make and year
function generateTransmission(make, model, year) {
    const isManual = Math.random() < 0.05; // 5% manual
    const isCVT = ['Toyota', 'Honda', 'Subaru'].includes(make) && Math.random() < 0.4;
    const isElectric = make === 'Tesla';
    
    if (isElectric) return 'Direct Drive';
    if (isManual) return 'Manual';
    if (isCVT) return 'CVT';
    
    // Most cars have automatic
    return 'Automatic';
}

// Generate drivetrain - Updated to match filter options
function generateDrivetrain(make, model) {
    const isAWD = model.includes('X') || model.includes('Q') || model.includes('4') || 
                 ['RAV4', 'CR-V', 'Highlander', 'Pilot', 'Explorer', 'Tahoe'].includes(model);
    const isTruck = ['F-150', 'Silverado', 'Tacoma', 'Ranger'].includes(model);
    
    if (isTruck && Math.random() < 0.6) return '4WD';
    if (isAWD && Math.random() < 0.7) return 'AWD';
    if (['BMW', 'Audi', 'Mercedes-Benz'].includes(make) && Math.random() < 0.3) return 'RWD';
    
    return 'FWD';
}

// Generate dealer name
function generateDealerName(make, location) {
    const city = location.split(',')[0];
    const dealerTypes = ['Auto Center', 'Motors', 'Dealership', 'Auto Group'];
    const prefixes = [city, 'Premium', 'Elite', 'Metro', 'Central'];
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = dealerTypes[Math.floor(Math.random() * dealerTypes.length)];
    
    return `${make} of ${city}`;
}

// Generate price history (simulated market changes)
function generatePriceHistory(currentPrice) {
    const history = [];
    let price = currentPrice;
    
    // Go back 4 weeks
    for (let i = 3; i >= 0; i--) {
        // Price tends to decrease over time, with some randomness
        const change = Math.random() < 0.7 ? 
            Math.random() * 1000 + 500 : // Usually decrease
            -(Math.random() * 800); // Sometimes increase
        
        price += change;
        history.unshift(Math.round(price / 100) * 100); // Round to nearest $100
    }
    
    return history;
}

// Generate rating based on make and model popularity
function generateRating(make, popularity) {
    const baseRating = 3.5 + (popularity / 100) * 1.3; // 3.5 to 4.8 range
    const variation = (Math.random() - 0.5) * 0.4; // ±0.2 variation
    return Math.round((baseRating + variation) * 10) / 10; // Round to 1 decimal
}

// Generate fuel type based on make and model
function getFuelType(make, model) {
    if (make === 'Tesla') return 'Electric';
    if (model === 'Prius' || Math.random() < 0.15) return 'Hybrid';
    if (Math.random() < 0.05) return 'Diesel';
    return 'Gasoline';
}

// Generate condition - Updated to match filter options
function generateCondition(year) {
    if (year >= 2023) return Math.random() < 0.6 ? 'New' : 'Certified';
    if (year >= 2020) return Math.random() < 0.3 ? 'Certified' : 'Used';
    return 'Used';
}

// Get random color from filter options
function getRandomColor() {
    const colors = ['White', 'Black', 'Silver', 'Gray', 'Red', 'Blue'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function getRandomInteriorColor() {
    const colors = ['Black', 'Gray', 'Beige', 'Brown', 'Tan'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Main function to generate realistic cars
function generateRealisticCars(count = 200) {
    const cars = [];
    let carId = 1;
    
    // Get all make/model combinations
    const allCombinations = [];
    Object.keys(carModels).forEach(make => {
        Object.keys(carModels[make]).forEach(model => {
            const data = carModels[make][model];
            allCombinations.push({ make, model, ...data });
        });
    });
    
    for (let i = 0; i < count; i++) {
        // Select car based on popularity (more popular cars appear more often)
        let selectedCar;
        const random = Math.random() * 100;
        let cumulative = 0;
        
        for (const combo of allCombinations) {
            cumulative += combo.popularity / 10; // Scale down popularity
            if (random <= cumulative || combo === allCombinations[allCombinations.length - 1]) {
                selectedCar = combo;
                break;
            }
        }
        
        // Generate realistic year (weighted toward recent years)
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
        
        // Generate other realistic data
        const mileage = calculateMileage(year);
        const locations = Object.keys(dealers);
        const location = locations[Math.floor(Math.random() * locations.length)];
        const price = calculatePrice(selectedCar.basePrice, year, mileage, location, selectedCar.depreciation);
        const daysOnMarket = generateDaysOnMarket(selectedCar.popularity);
        
        // Generate car object - Updated to match filter system
        const car = {
            id: carId++,
            make: selectedCar.make,
            model: selectedCar.model,
            year: year,
            price: price,
            mileage: mileage,
            location: location,
            coordinates: [dealers[location].lat, dealers[location].lng],
            dealer: generateDealerName(selectedCar.make, location),
            priceHistory: generatePriceHistory(price),
            daysOnMarket: daysOnMarket,
            mpg: generateMPG(selectedCar.make, selectedCar.model, year),
            transmission: generateTransmission(selectedCar.make, selectedCar.model, year),
            drivetrain: generateDrivetrain(selectedCar.make, selectedCar.model),
            features: getRandomFeatures(selectedCar.make, price),
            rating: generateRating(selectedCar.make, selectedCar.popularity),
            vin: generateVIN(),
            condition: generateCondition(year),
            bodyType: selectedCar.bodyStyle,
            fuelType: getFuelType(selectedCar.make, selectedCar.model),
            exteriorColor: getRandomColor(),
            interiorColor: getRandomInteriorColor()
        };
        
        cars.push(car);
    }
    
    return cars;
}

// Export for use in your app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateRealisticCars };
} else if (typeof window !== 'undefined') {
    window.generateRealisticCars = generateRealisticCars;
}

// Example usage:
// const realisticCars = generateRealisticCars(200);
// console.log(realisticCars);