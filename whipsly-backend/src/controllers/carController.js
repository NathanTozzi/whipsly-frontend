const { Car, Dealer, Favorite, User } = require('../models');
const { validationResult } = require('express-validator');

class CarController {
  // Get all cars with advanced filtering
  static async getAllCars(req, res) {
    try {
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
        make: make || (search ? search : undefined),
        model: model || (search ? search : undefined),
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

      return res.json({
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
      return res.status(500).json({
        success: false,
        message: 'Server error while fetching cars'
      });
    }
  }

  // Get single car by ID
  static async getCarById(req, res) {
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

      return res.json({
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
      return res.status(500).json({
        success: false,
        message: 'Server error while fetching car'
      });
    }
  }

  // Create new car listing
  static async createCar(req, res) {
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

      return res.status(201).json({
        success: true,
        message: 'Car listing created successfully',
        data: {
          car: carWithDealer
        }
      });

    } catch (error) {
      console.error('Create car error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while creating car listing'
      });
    }
  }

  // Update car listing
  static async updateCar(req, res) {
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

      return res.json({
        success: true,
        message: 'Car listing updated successfully',
        data: {
          car: updatedCar
        }
      });

    } catch (error) {
      console.error('Update car error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while updating car listing'
      });
    }
  }

  // Delete car listing
  static async deleteCar(req, res) {
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

      return res.json({
        success: true,
        message: 'Car listing deleted successfully'
      });

    } catch (error) {
      console.error('Delete car error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while deleting car listing'
      });
    }
  }

  // Get similar cars
  static async getSimilarCars(req, res) {
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

      return res.json({
        success: true,
        data: {
          similar_cars: similarCars
        }
      });

    } catch (error) {
      console.error('Get similar cars error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while fetching similar cars'
      });
    }
  }

  // Mark car as sold
  static async markAsSold(req, res) {
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

      return res.json({
        success: true,
        message: 'Car marked as sold successfully',
        data: {
          car
        }
      });

    } catch (error) {
      console.error('Mark car sold error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while marking car as sold'
      });
    }
  }

  // Get car analytics for dealers
  static async getCarAnalytics(req, res) {
    try {
      const { timeframe = '30d' } = req.query;
      const dealerId = req.user.role === 'dealer' ? req.user.dealer_id : null;
      
      const now = new Date();
      const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const whereClause = dealerId ? { dealer_id: dealerId } : {};
      const recentWhereClause = {
        ...whereClause,
        created_at: { [Car.sequelize.Sequelize.Op.gte]: startDate }
      };

      const [
        totalCars,
        soldCars,
        avgPrice,
        avgDaysOnMarket,
        topViewedCars,
        recentListings
      ] = await Promise.all([
        Car.count({ where: { ...whereClause, is_sold: false } }),
        Car.count({ where: { ...whereClause, is_sold: true } }),
        Car.findOne({
          attributes: [[Car.sequelize.fn('AVG', Car.sequelize.col('price')), 'avg_price']],
          where: { ...whereClause, is_sold: false },
          raw: true
        }),
        Car.findOne({
          attributes: [[Car.sequelize.fn('AVG', Car.sequelize.col('days_on_market')), 'avg_days']],
          where: { ...whereClause, is_sold: false },
          raw: true
        }),
        Car.findAll({
          where: { ...whereClause, is_sold: false },
          order: [['view_count', 'DESC']],
          limit: 10,
          attributes: ['id', 'make', 'model', 'year', 'price', 'view_count']
        }),
        Car.count({ where: recentWhereClause })
      ]);

      return res.json({
        success: true,
        data: {
          total_cars: totalCars,
          sold_cars: soldCars,
          avg_price: parseFloat(avgPrice?.avg_price || 0).toFixed(2),
          avg_days_on_market: Math.round(avgDaysOnMarket?.avg_days || 0),
          top_viewed_cars: topViewedCars,
          recent_listings: recentListings,
          timeframe
        }
      });

    } catch (error) {
      console.error('Car analytics error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while fetching car analytics'
      });
    }
  }
}

module.exports = CarController;