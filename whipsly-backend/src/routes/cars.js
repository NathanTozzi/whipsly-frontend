const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { Car, Dealer, Favorite, User } = require('../src/models');
const { auth, optionalAuth, requireAdmin, requireDealer } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/cars
// @desc    Get all cars with filtering and pagination
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be positive'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be positive'),
  query('maxMileage').optional().isInt({ min: 0 }).withMessage('Max mileage must be positive'),
  query('minYear').optional().isInt({ min: 1990 }).withMessage('Min year must be 1990 or later'),
  query('maxYear').optional().isInt({ max: new Date().getFullYear() + 1 }).withMessage('Max year invalid')
], optionalAuth, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 20,
      make,
      model,
      minYear,
      maxYear,
      minPrice,
      maxPrice,
      maxMileage,
      location,
      radius = 25,
      condition,
      bodyStyle,
      fuelType,
      features,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      search
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build search parameters
    const searchParams = {
      make,
      model,
      minYear: minYear ? parseInt(minYear) : undefined,
      maxYear: maxYear ? parseInt(maxYear) : undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      maxMileage: maxMileage ? parseInt(maxMileage) : undefined,
      location,
      radius: parseInt(radius),
      condition,
      bodyStyle,
      fuelType,
      features: features ? features.split(',') : undefined,
      limit: parseInt(limit),
      offset,
      sortBy,
      sortOrder: sortOrder.toUpperCase()
    };

    // If there's a general search term, add it to make/model search
    if (search) {
      searchParams.make = search;
      searchParams.model = search;
    }

    // Use the Car model's search method
    const result = await Car.searchCars(searchParams);

    // Add favorite status if user is authenticated
    let carsWithFavorites = result.rows;
    if (req.userId) {
      const carIds = result.rows.map(car => car.id);
      const userFavorites = await Favorite.findAll({
        where: {
          user_id: req.userId,
          car_id: carIds
        },
        attributes: ['car_id']
      });
      
      const favoriteCarIds = new Set(userFavorites.map(fav => fav.car_id));
      
      carsWithFavorites = result.rows.map(car => ({
        ...car.toJSON(),
        is_favorited: favoriteCarIds.has(car.id)
      }));
    }

    res.json({
      success: true,
      data: {
        cars: carsWithFavorites,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total_items: result.count,
          total_pages: Math.ceil(result.count / parseInt(limit))
        },
        filters: searchParams
      }
    });

  } catch (error) {
    console.error('Get cars error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching cars'
    });
  }
});

// @route   GET /api/cars/:id
// @desc    Get single car by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const carId = req.params.id;

    const car = await Car.findByPk(carId, {
      include: [
        {
          model: Dealer,
          as: 'dealer',
          attributes: ['id', 'name', 'phone', 'email', 'address', 'city', 'state', 'website', 'rating']
        }
      ]
    });

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    // Increment view count
    await car.incrementViewCount();

    // Check if favorited by current user
    let isFavorited = false;
    if (req.userId) {
      const favorite = await Favorite.findOne({
        where: {
          user_id: req.userId,
          car_id: carId
        }
      });
      isFavorited = !!favorite;
    }

    res.json({
      success: true,
      data: {
        car: {
          ...car.toJSON(),
          is_favorited: isFavorited
        }
      }
    });

  } catch (error) {
    console.error('Get car error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching car'
    });
  }
});

// @route   POST /api/cars
// @desc    Create a new car listing
// @access  Private (Dealer/Admin only)
router.post('/', [auth, requireDealer], [
  body('vin').isLength({ min: 17, max: 17 }).withMessage('VIN must be exactly 17 characters'),
  body('make').trim().notEmpty().withMessage('Make is required'),
  body('model').trim().notEmpty().withMessage('Model is required'),
  body('year').isInt({ min: 1990, max: new Date().getFullYear() + 1 }).withMessage('Invalid year'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be positive'),
  body('mileage').isInt({ min: 0 }).withMessage('Mileage must be positive'),
  body('dealerId').isInt().withMessage('Dealer ID is required')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      vin,
      make,
      model,
      year,
      price,
      mileage,
      condition,
      bodyStyle,
      transmission,
      drivetrain,
      fuelType,
      mpgCity,
      mpgHwy,
      mpg,
      exteriorColor,
      interiorColor,
      engine,
      features,
      images,
      description,
      dealerId,
      location,
      latitude,
      longitude
    } = req.body;

    // Check if VIN already exists
    const existingCar = await Car.findOne({ where: { vin } });
    if (existingCar) {
      return res.status(400).json({
        success: false,
        message: 'Car with this VIN already exists'
      });
    }

    // Verify dealer exists
    const dealer = await Dealer.findByPk(dealerId);
    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: 'Dealer not found'
      });
    }

    // Create car
    const car = await Car.create({
      vin,
      make,
      model,
      year,
      price,
      mileage,
      condition,
      body_style: bodyStyle,
      transmission,
      drivetrain,
      fuel_type: fuelType,
      mpg_city: mpgCity,
      mpg_highway: mpgHwy,
      mpg_combined: mpg,
      exterior_color: exteriorColor,
      interior_color: interiorColor,
      engine,
      features: features || [],
      images: images || [],
      description,
      dealer_id: dealerId,
      location: location || dealer.getFullAddress(),
      latitude: latitude || dealer.latitude,
      longitude: longitude || dealer.longitude,
      price_history: [{ price, date: new Date() }]
    });

    // Load car with dealer info
    const carWithDealer = await Car.findByPk(car.id, {
      include: [
        {
          model: Dealer,
          as: 'dealer',
          attributes: ['id', 'name', 'phone', 'email']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Car listing created successfully',
      data: {
        car: carWithDealer
      }
    });

  } catch (error) {
    console.error('Create car error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating car listing'
    });
  }
});

// @route   PUT /api/cars/:id
// @desc    Update car listing
// @access  Private (Dealer/Admin only)
router.put('/:id', [auth, requireDealer], async (req, res) => {
  try {
    const carId = req.params.id;
    const updateData = req.body;

    const car = await Car.findByPk(carId);
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    // Check if user can edit this car (dealer can only edit their own cars)
    if (req.user.role !== 'admin' && car.dealer_id !== req.user.dealer_id) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own car listings'
      });
    }

    // If price is being updated, add to price history
    if (updateData.price && updateData.price !== car.price) {
      await car.updatePriceHistory(updateData.price);
    } else {
      await car.update(updateData);
    }

    const updatedCar = await Car.findByPk(carId, {
      include: [
        {
          model: Dealer,
          as: 'dealer'
        }
      ]
    });

    res.json({
      success: true,
      message: 'Car listing updated successfully',
      data: {
        car: updatedCar
      }
    });

  } catch (error) {
    console.error('Update car error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating car listing'
    });
  }
});

// @route   DELETE /api/cars/:id
// @desc    Delete car listing
// @access  Private (Dealer/Admin only)
router.delete('/:id', [auth, requireDealer], async (req, res) => {
  try {
    const carId = req.params.id;

    const car = await Car.findByPk(carId);
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    // Check if user can delete this car
    if (req.user.role !== 'admin' && car.dealer_id !== req.user.dealer_id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own car listings'
      });
    }

    await car.destroy();

    res.json({
      success: true,
      message: 'Car listing deleted successfully'
    });

  } catch (error) {
    console.error('Delete car error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting car listing'
    });
  }
});

// @route   POST /api/cars/:id/mark-sold
// @desc    Mark car as sold
// @access  Private (Dealer/Admin only)
router.post('/:id/mark-sold', [auth, requireDealer], async (req, res) => {
  try {
    const carId = req.params.id;

    const car = await Car.findByPk(carId);
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    // Check if user can mark this car as sold
    if (req.user.role !== 'admin' && car.dealer_id !== req.user.dealer_id) {
      return res.status(403).json({
        success: false,
        message: 'You can only mark your own cars as sold'
      });
    }

    await car.markAsSold();

    res.json({
      success: true,
      message: 'Car marked as sold successfully',
      data: {
        car
      }
    });

  } catch (error) {
    console.error('Mark car sold error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking car as sold'
    });
  }
});

// @route   GET /api/cars/:id/similar
// @desc    Get similar cars
// @access  Public
router.get('/:id/similar', async (req, res) => {
  try {
    const carId = req.params.id;
    const { limit = 5 } = req.query;

    const car = await Car.findByPk(carId);
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    // Find similar cars based on make, model, year range, and price range
    const priceRange = car.price * 0.2; // 20% price range
    const yearRange = 2;

    const similarCars = await Car.findAll({
      where: {
        id: { [Car.sequelize.Sequelize.Op.not]: carId },
        make: car.make,
        year: {
          [Car.sequelize.Sequelize.Op.between]: [car.year - yearRange, car.year + yearRange]
        },
        price: {
          [Car.sequelize.Sequelize.Op.between]: [car.price - priceRange, car.price + priceRange]
        },
        is_sold: false
      },
      include: [
        {
          model: Dealer,
          as: 'dealer',
          attributes: ['id', 'name', 'city', 'state']
        }
      ],
      limit: parseInt(limit),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        similar_cars: similarCars
      }
    });

  } catch (error) {
    console.error('Get similar cars error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching similar cars'
    });
  }
});

module.exports = router;