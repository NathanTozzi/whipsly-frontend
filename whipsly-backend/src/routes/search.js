const express = require('express');
const { query, validationResult } = require('express-validator');
const { Car, Dealer, SearchHistory, User } = require('../models');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/search
// @desc    Advanced car search with logging
// @access  Public
router.get('/', [
  query('q').optional().trim().isLength({ max: 500 }).withMessage('Search query too long'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be positive'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be positive'),
  query('maxMileage').optional().isInt({ min: 0 }).withMessage('Max mileage must be positive'),
  query('minYear').optional().isInt({ min: 1990 }).withMessage('Min year must be 1990+'),
  query('maxYear').optional().isInt({ max: new Date().getFullYear() + 1 }).withMessage('Invalid max year'),
  query('radius').optional().isInt({ min: 5, max: 500 }).withMessage('Radius must be 5-500 miles'),
  query('lat').optional().isFloat().withMessage('Invalid latitude'),
  query('lng').optional().isFloat().withMessage('Invalid longitude')
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
      q: searchQuery,
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
      lat,
      lng,
      radius = 25,
      condition,
      bodyStyle,
      fuelType,
      features,
      sortBy = 'relevance',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build search parameters
    const searchParams = {
      make: make || (searchQuery ? searchQuery : undefined),
      model: model || (searchQuery ? searchQuery : undefined),
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
      features: features ? features.split(',').map(f => f.trim()) : undefined,
      limit: parseInt(limit),
      offset,
      sortBy: sortBy === 'relevance' ? 'created_at' : sortBy,
      sortOrder: sortOrder.toUpperCase()
    };

    // Perform search
    const result = await Car.searchCars(searchParams);

    // Enhanced relevance scoring if search query provided
    let rankedResults = result.rows;
    if (searchQuery && sortBy === 'relevance') {
      rankedResults = result.rows.map(car => {
        let score = 0;
        const query = searchQuery.toLowerCase();
        const carText = `${car.make} ${car.model} ${car.year}`.toLowerCase();
        
        // Exact make/model matches get highest score
        if (car.make.toLowerCase().includes(query)) score += 10;
        if (car.model.toLowerCase().includes(query)) score += 10;
        
        // Partial matches
        if (carText.includes(query)) score += 5;
        
        // Newer cars get slight boost
        score += (car.year - 2000) * 0.1;
        
        // Lower mileage gets boost
        score += Math.max(0, (200000 - car.mileage) / 10000);
        
        return { ...car.toJSON(), relevance_score: score };
      }).sort((a, b) => b.relevance_score - a.relevance_score);
    }

    // Log search if user is authenticated or provide session tracking
    const sessionId = req.headers['x-session-id'] || `anon_${Date.now()}_${Math.random()}`;
    
    if (req.userId || sessionId) {
      try {
        await SearchHistory.logSearch({
          userId: req.userId,
          sessionId: req.userId ? undefined : sessionId,
          searchQuery,
          filters: {
            make,
            model,
            minYear,
            maxYear,
            minPrice,
            maxPrice,
            maxMileage,
            condition,
            bodyStyle,
            fuelType,
            features
          },
          resultsCount: result.count,
          location,
          radius: parseInt(radius),
          sortBy,
          searchSource: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'web',
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip
        });
      } catch (logError) {
        console.error('Search logging error:', logError);
        // Don't fail the search if logging fails
      }
    }

    // Add related searches suggestions
    const suggestions = [];
    if (searchQuery) {
      // Simple suggestion logic - in production you'd use more sophisticated methods
      const popularMakes = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW', 'Mercedes-Benz', 'Audi'];
      suggestions.push(
        ...popularMakes
          .filter(makeName => makeName.toLowerCase().includes(searchQuery.toLowerCase()))
          .map(makeName => ({ type: 'make', value: makeName }))
      );
    }

    res.json({
      success: true,
      data: {
        cars: rankedResults,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total_items: result.count,
          total_pages: Math.ceil(result.count / parseInt(limit))
        },
        search_params: searchParams,
        suggestions: suggestions.slice(0, 5), // Limit suggestions
        session_id: req.userId ? undefined : sessionId
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during search'
    });
  }
});

// @route   GET /api/search/suggestions
// @desc    Get search suggestions and autocomplete
// @access  Public
router.get('/suggestions', [
  query('q').trim().isLength({ min: 1, max: 100 }).withMessage('Query must be 1-100 characters'),
  query('type').optional().isIn(['make', 'model', 'location', 'all']).withMessage('Invalid suggestion type')
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

    const { q: query, type = 'all' } = req.query;
    const searchTerm = query.toLowerCase();
    const suggestions = [];

    try {
      // Get make suggestions
      if (type === 'all' || type === 'make') {
        const makes = await Car.findAll({
          attributes: [[Car.sequelize.fn('DISTINCT', Car.sequelize.col('make')), 'make']],
          where: {
            make: { [Car.sequelize.Sequelize.Op.iLike]: `%${searchTerm}%` },
            is_sold: false
          },
          limit: 5,
          raw: true
        });
        
        suggestions.push(...makes.map(item => ({
          type: 'make',
          value: item.make,
          label: item.make
        })));
      }

      // Get model suggestions
      if (type === 'all' || type === 'model') {
        const models = await Car.findAll({
          attributes: [
            [Car.sequelize.fn('DISTINCT', Car.sequelize.col('model')), 'model'],
            'make'
          ],
          where: {
            model: { [Car.sequelize.Sequelize.Op.iLike]: `%${searchTerm}%` },
            is_sold: false
          },
          limit: 5,
          raw: true
        });
        
        suggestions.push(...models.map(item => ({
          type: 'model',
          value: item.model,
          label: `${item.make} ${item.model}`
        })));
      }

      // Get location suggestions
      if (type === 'all' || type === 'location') {
        const locations = await Car.findAll({
          attributes: [[Car.sequelize.fn('DISTINCT', Car.sequelize.col('location')), 'location']],
          where: {
            location: { [Car.sequelize.Sequelize.Op.iLike]: `%${searchTerm}%` },
            is_sold: false
          },
          limit: 5,
          raw: true
        });
        
        suggestions.push(...locations.map(item => ({
          type: 'location',
          value: item.location,
          label: item.location
        })));
      }

    } catch (dbError) {
      console.error('Database error in suggestions:', dbError);
      // Return empty suggestions if DB query fails
    }

    // Remove duplicates and limit results
    const uniqueSuggestions = suggestions
      .filter((item, index, self) => 
        index === self.findIndex(t => t.value === item.value && t.type === item.type)
      )
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        suggestions: uniqueSuggestions,
        query: query
      }
    });

  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching suggestions'
    });
  }
});

// @route   GET /api/search/popular
// @desc    Get popular searches
// @access  Public
router.get('/popular', [
  query('timeframe').optional().isIn(['24h', '7d', '30d']).withMessage('Invalid timeframe'),
  query('location').optional().trim().isLength({ max: 100 }).withMessage('Location too long')
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

    const { timeframe = '7d', location } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const popularSearches = await SearchHistory.findPopularSearches({
      limit: 10,
      dateRange: { start: startDate, end: now },
      location
    });

    res.json({
      success: true,
      data: {
        popular_searches: popularSearches,
        timeframe,
        location: location || 'All locations'
      }
    });

  } catch (error) {
    console.error('Popular searches error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching popular searches'
    });
  }
});

// @route   GET /api/search/trending
// @desc    Get trending search filters and terms
// @access  Public
router.get('/trending', async (req, res) => {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [trendingFilters, trendingMakes, trendingPriceRanges] = await Promise.all([
      SearchHistory.findTrendingFilters({
        limit: 10,
        dateRange: { start: weekAgo, end: now }
      }),
      
      // Most searched makes
      Car.findAll({
        attributes: [
          'make',
          [Car.sequelize.fn('COUNT', Car.sequelize.col('view_count')), 'popularity']
        ],
        where: {
          created_at: { [Car.sequelize.Sequelize.Op.gte]: weekAgo },
          is_sold: false
        },
        group: ['make'],
        order: [[Car.sequelize.literal('popularity'), 'DESC']],
        limit: 5,
        raw: true
      }),
      
      // Popular price ranges
      SearchHistory.findAll({
        attributes: [
          [Car.sequelize.fn('COUNT', Car.sequelize.col('id')), 'count']
        ],
        where: {
          created_at: { [Car.sequelize.Sequelize.Op.gte]: weekAgo },
          filters: {
            [Car.sequelize.Sequelize.Op.and]: [
              { [Car.sequelize.Sequelize.Op.ne]: null },
              Car.sequelize.literal("filters ? 'minPrice' OR filters ? 'maxPrice'")
            ]
          }
        },
        group: [Car.sequelize.literal("filters->>'minPrice'"), Car.sequelize.literal("filters->>'maxPrice'")],
        order: [[Car.sequelize.literal('count'), 'DESC']],
        limit: 5,
        raw: true
      })
    ]);

    res.json({
      success: true,
      data: {
        trending_filters: trendingFilters,
        trending_makes: trendingMakes,
        trending_price_ranges: trendingPriceRanges,
        timeframe: 'Last 7 days'
      }
    });

  } catch (error) {
    console.error('Trending searches error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching trending searches'
    });
  }
});

// @route   POST /api/search/track-click
// @desc    Track when user clicks on a car from search results
// @access  Public
router.post('/track-click', [
  query('searchId').optional().isInt().withMessage('Invalid search ID'),
  query('carId').isInt({ min: 1 }).withMessage('Valid car ID required'),
  query('sessionId').optional().trim().isLength({ max: 100 }).withMessage('Invalid session ID')
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

    const { searchId, carId, sessionId } = req.query;

    // Find the search record to update
    let searchRecord = null;
    
    if (searchId) {
      searchRecord = await SearchHistory.findByPk(searchId);
    } else if (sessionId || req.userId) {
      // Find most recent search for this user/session
      const whereClause = {};
      if (req.userId) {
        whereClause.user_id = req.userId;
      } else if (sessionId) {
        whereClause.session_id = sessionId;
      }
      
      searchRecord = await SearchHistory.findOne({
        where: whereClause,
        order: [['created_at', 'DESC']]
      });
    }

    if (searchRecord) {
      await searchRecord.addClickedCar(parseInt(carId));
    }

    res.json({
      success: true,
      message: 'Click tracked successfully'
    });

  } catch (error) {
    console.error('Track click error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while tracking click'
    });
  }
});

// @route   GET /api/search/saved
// @desc    Get user's saved searches (if authenticated)
// @access  Private
router.get('/saved', optionalAuth, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to view saved searches'
      });
    }

    const { page = 1, limit = 20 } = req.query;
    
    const result = await SearchHistory.findUserSearches(req.userId, {
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        saved_searches: result.rows,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total_items: result.count,
          total_pages: Math.ceil(result.count / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get saved searches error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching saved searches'
    });
  }
});

module.exports = router;