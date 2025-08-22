const express = require('express');
const { query, validationResult } = require('express-validator');
const { Car, User, Favorite, Inquiry, SearchHistory, Dealer } = require('../models');
const { auth, requireAdmin, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/analytics/overview
// @desc    Get platform overview analytics
// @access  Private (Admin)
router.get('/overview', [auth, requireAdmin], [
  query('timeframe').optional().isIn(['24h', '7d', '30d', '90d', '1y']).withMessage('Invalid timeframe')
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

    const { timeframe = '30d' } = req.query;
    
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
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const [
      totalStats,
      recentStats,
      topMakes,
      priceDistribution,
      userGrowth
    ] = await Promise.all([
      // Total platform stats
      Promise.all([
        Car.count({ where: { is_sold: false } }),
        User.count({ where: { is_active: true } }),
        Favorite.count(),
        Inquiry.count(),
        SearchHistory.count(),
        Dealer.count({ where: { is_active: true } })
      ]).then(([cars, users, favorites, inquiries, searches, dealers]) => ({
        total_cars: cars,
        total_users: users,
        total_favorites: favorites,
        total_inquiries: inquiries,
        total_searches: searches,
        total_dealers: dealers
      })),

      // Recent activity stats
      Promise.all([
        Car.count({
          where: {
            created_at: { [Car.sequelize.Sequelize.Op.gte]: startDate },
            is_sold: false
          }
        }),
        User.count({
          where: {
            created_at: { [User.sequelize.Sequelize.Op.gte]: startDate }
          }
        }),
        Favorite.count({
          where: {
            created_at: { [Favorite.sequelize.Sequelize.Op.gte]: startDate }
          }
        }),
        Inquiry.count({
          where: {
            created_at: { [Inquiry.sequelize.Sequelize.Op.gte]: startDate }
          }
        }),
        SearchHistory.count({
          where: {
            created_at: { [SearchHistory.sequelize.Sequelize.Op.gte]: startDate }
          }
        })
      ]).then(([cars, users, favorites, inquiries, searches]) => ({
        new_cars: cars,
        new_users: users,
        new_favorites: favorites,
        new_inquiries: inquiries,
        new_searches: searches
      })),

      // Top makes by popularity
      Car.findAll({
        attributes: [
          'make',
          [Car.sequelize.fn('COUNT', Car.sequelize.col('id')), 'count'],
          [Car.sequelize.fn('AVG', Car.sequelize.col('price')), 'avg_price']
        ],
        where: { is_sold: false },
        group: ['make'],
        order: [[Car.sequelize.literal('count'), 'DESC']],
        limit: 10,
        raw: true
      }),

      // Price distribution
      Car.findAll({
        attributes: [
          [Car.sequelize.fn('COUNT', Car.sequelize.col('id')), 'count']
        ],
        where: { is_sold: false },
        group: [
          Car.sequelize.literal(`
            CASE 
              WHEN price < 20000 THEN 'Under $20k'
              WHEN price < 40000 THEN '$20k-$40k'
              WHEN price < 60000 THEN '$40k-$60k'
              WHEN price < 80000 THEN '$60k-$80k'
              ELSE 'Over $80k'
            END
          `)
        ],
        raw: true
      }),

      // User growth over time
      User.findAll({
        attributes: [
          [User.sequelize.fn('DATE', User.sequelize.col('created_at')), 'date'],
          [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']
        ],
        where: {
          created_at: { [User.sequelize.Sequelize.Op.gte]: startDate }
        },
        group: [User.sequelize.fn('DATE', User.sequelize.col('created_at'))],
        order: [[User.sequelize.fn('DATE', User.sequelize.col('created_at')), 'ASC']],
        raw: true
      })
    ]);

    res.json({
      success: true,
      data: {
        timeframe,
        total_stats: totalStats,
        recent_stats: recentStats,
        top_makes: topMakes,
        price_distribution: priceDistribution,
        user_growth: userGrowth
      }
    });

  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching analytics'
    });
  }
});

// @route   GET /api/analytics/cars
// @desc    Get car-specific analytics
// @access  Private (Admin)
router.get('/cars', [auth, requireAdmin], async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    const now = new Date();
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      inventoryStats,
      popularCars,
      priceAnalytics,
      locationAnalytics,
      soldCarsStats
    ] = await Promise.all([
      // Inventory statistics
      Promise.all([
        Car.count({ where: { is_sold: false } }),
        Car.count({ where: { is_sold: true } }),
        Car.findOne({
          attributes: [[Car.sequelize.fn('AVG', Car.sequelize.col('price')), 'avg_price']],
          where: { is_sold: false },
          raw: true
        }),
        Car.findOne({
          attributes: [[Car.sequelize.fn('AVG', Car.sequelize.col('mileage')), 'avg_mileage']],
          where: { is_sold: false },
          raw: true
        }),
        Car.findOne({
          attributes: [[Car.sequelize.fn('AVG', Car.sequelize.col('days_on_market')), 'avg_days']],
          where: { is_sold: false },
          raw: true
        })
      ]).then(([available, sold, avgPrice, avgMileage, avgDays]) => ({
        available_cars: available,
        sold_cars: sold,
        avg_price: parseFloat(avgPrice?.avg_price || 0).toFixed(2),
        avg_mileage: Math.round(avgMileage?.avg_mileage || 0),
        avg_days_on_market: Math.round(avgDays?.avg_days || 0)
      })),

      // Most popular cars (by views)
      Car.findAll({
        attributes: ['id', 'make', 'model', 'year', 'price', 'view_count'],
        where: { is_sold: false },
        order: [['view_count', 'DESC']],
        limit: 10
      }),

      // Price analytics by make
      Car.findAll({
        attributes: [
          'make',
          [Car.sequelize.fn('AVG', Car.sequelize.col('price')), 'avg_price'],
          [Car.sequelize.fn('MIN', Car.sequelize.col('price')), 'min_price'],
          [Car.sequelize.fn('MAX', Car.sequelize.col('price')), 'max_price'],
          [Car.sequelize.fn('COUNT', Car.sequelize.col('id')), 'count']
        ],
        where: { is_sold: false },
        group: ['make'],
        having: Car.sequelize.literal('COUNT(id) >= 3'),
        order: [[Car.sequelize.literal('avg_price'), 'DESC']],
        raw: true
      }),

      // Cars by location
      Car.findAll({
        attributes: [
          'location',
          [Car.sequelize.fn('COUNT', Car.sequelize.col('id')), 'count'],
          [Car.sequelize.fn('AVG', Car.sequelize.col('price')), 'avg_price']
        ],
        where: { is_sold: false },
        group: ['location'],
        order: [[Car.sequelize.literal('count'), 'DESC']],
        limit: 15,
        raw: true
      }),

      // Sold cars analysis
      Car.findAll({
        attributes: [
          [Car.sequelize.fn('DATE', Car.sequelize.col('sold_date')), 'date'],
          [Car.sequelize.fn('COUNT', Car.sequelize.col('id')), 'count'],
          [Car.sequelize.fn('AVG', Car.sequelize.col('days_on_market')), 'avg_days_to_sell']
        ],
        where: {
          is_sold: true,
          sold_date: { [Car.sequelize.Sequelize.Op.gte]: startDate }
        },
        group: [Car.sequelize.fn('DATE', Car.sequelize.col('sold_date'))],
        order: [[Car.sequelize.fn('DATE', Car.sequelize.col('sold_date')), 'ASC']],
        raw: true
      })
    ]);

    res.json({
      success: true,
      data: {
        inventory_stats: inventoryStats,
        popular_cars: popularCars,
        price_analytics: priceAnalytics,
        location_analytics: locationAnalytics,
        sold_cars_stats: soldCarsStats
      }
    });

  } catch (error) {
    console.error('Car analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching car analytics'
    });
  }
});

// @route   GET /api/analytics/users
// @desc    Get user behavior analytics
// @access  Private (Admin)
router.get('/users', [auth, requireAdmin], async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    const now = new Date();
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      userStats,
      userActivity,
      favoriteStats,
      searchStats
    ] = await Promise.all([
      // User statistics
      Promise.all([
        User.count({ where: { is_active: true } }),
        User.count({ where: { is_active: false } }),
        User.count({
          where: {
            created_at: { [User.sequelize.Sequelize.Op.gte]: startDate }
          }
        }),
        User.count({
          where: {
            last_login: { [User.sequelize.Sequelize.Op.gte]: startDate }
          }
        })
      ]).then(([active, inactive, newUsers, activeUsers]) => ({
        total_active: active,
        total_inactive: inactive,
        new_users: newUsers,
        active_users: activeUsers
      })),

      // User activity patterns
      User.findAll({
        attributes: [
          [User.sequelize.fn('DATE', User.sequelize.col('last_login')), 'date'],
          [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'active_users']
        ],
        where: {
          last_login: { [User.sequelize.Sequelize.Op.gte]: startDate }
        },
        group: [User.sequelize.fn('DATE', User.sequelize.col('last_login'))],
        order: [[User.sequelize.fn('DATE', User.sequelize.col('last_login')), 'ASC']],
        raw: true
      }),

      // Favorite statistics
      Promise.all([
        Favorite.count(),
        Favorite.count({
          where: {
            created_at: { [Favorite.sequelize.Sequelize.Op.gte]: startDate }
          }
        }),
        Favorite.count({ where: { price_alert_enabled: true } }),
        User.findAll({
          attributes: [
            'id',
            [User.sequelize.fn('COUNT', User.sequelize.col('favorites.id')), 'favorite_count']
          ],
          include: [{
            model: Favorite,
            as: 'favorites',
            attributes: []
          }],
          group: ['User.id'],
          having: User.sequelize.literal('COUNT(favorites.id) > 0'),
          order: [[User.sequelize.literal('favorite_count'), 'DESC']],
          limit: 10,
          raw: true
        })
      ]).then(([total, recent, withAlerts, topUsers]) => ({
        total_favorites: total,
        recent_favorites: recent,
        favorites_with_alerts: withAlerts,
        top_users_by_favorites: topUsers
      })),

      // Search statistics
      SearchHistory.getSearchAnalytics({
        dateRange: { start: startDate, end: now }
      })
    ]);

    res.json({
      success: true,
      data: {
        user_stats: userStats,
        user_activity: userActivity,
        favorite_stats: favoriteStats,
        search_stats: searchStats
      }
    });

  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user analytics'
    });
  }
});

// @route   GET /api/analytics/search
// @desc    Get search analytics
// @access  Private (Admin)
router.get('/search', [auth, requireAdmin], async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    const now = new Date();
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      searchOverview,
      popularSearches,
      trendingFilters,
      searchBySource,
      searchSuccess
    ] = await Promise.all([
      SearchHistory.getSearchAnalytics({
        dateRange: { start: startDate, end: now }
      }),

      SearchHistory.findPopularSearches({
        limit: 15,
        dateRange: { start: startDate, end: now }
      }),

      SearchHistory.findTrendingFilters({
        limit: 15,
        dateRange: { start: startDate, end: now }
      }),

      SearchHistory.findAll({
        attributes: [
          'search_source',
          [SearchHistory.sequelize.fn('COUNT', SearchHistory.sequelize.col('id')), 'count'],
          [SearchHistory.sequelize.fn('AVG', SearchHistory.sequelize.col('time_spent')), 'avg_time']
        ],
        where: {
          created_at: { [SearchHistory.sequelize.Sequelize.Op.gte]: startDate }
        },
        group: ['search_source'],
        raw: true
      }),

      SearchHistory.findAll({
        attributes: [
          [SearchHistory.sequelize.fn('DATE', SearchHistory.sequelize.col('created_at')), 'date'],
          [SearchHistory.sequelize.fn('COUNT', SearchHistory.sequelize.col('id')), 'total_searches'],
          [SearchHistory.sequelize.fn('SUM', 
            SearchHistory.sequelize.literal('CASE WHEN results_count > 0 THEN 1 ELSE 0 END')
          ), 'successful_searches']
        ],
        where: {
          created_at: { [SearchHistory.sequelize.Sequelize.Op.gte]: startDate }
        },
        group: [SearchHistory.sequelize.fn('DATE', SearchHistory.sequelize.col('created_at'))],
        order: [[SearchHistory.sequelize.fn('DATE', SearchHistory.sequelize.col('created_at')), 'ASC']],
        raw: true
      })
    ]);

    res.json({
      success: true,
      data: {
        search_overview: searchOverview,
        popular_searches: popularSearches,
        trending_filters: trendingFilters,
        search_by_source: searchBySource,
        search_success_rate: searchSuccess
      }
    });

  } catch (error) {
    console.error('Search analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching search analytics'
    });
  }
});

// @route   GET /api/analytics/performance
// @desc    Get platform performance metrics
// @access  Private (Admin)
router.get('/performance', [auth, requireAdmin], async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    const now = new Date();
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      inquiryMetrics,
      conversionMetrics,
      engagementMetrics
    ] = await Promise.all([
      // Inquiry metrics
      Promise.all([
        Inquiry.count({
          where: {
            created_at: { [Inquiry.sequelize.Sequelize.Op.gte]: startDate }
          }
        }),
        Inquiry.count({
          where: {
            created_at: { [Inquiry.sequelize.Sequelize.Op.gte]: startDate },
            status: 'completed'
          }
        }),
        Inquiry.findOne({
          attributes: [[Inquiry.sequelize.fn('AVG', 
            Inquiry.sequelize.literal('EXTRACT(EPOCH FROM (dealer_responded_at - created_at))/3600')
          ), 'avg_response_time']],
          where: {
            created_at: { [Inquiry.sequelize.Sequelize.Op.gte]: startDate },
            dealer_responded_at: { [Inquiry.sequelize.Sequelize.Op.not]: null }
          },
          raw: true
        })
      ]).then(([total, completed, responseTime]) => ({
        total_inquiries: total,
        completed_inquiries: completed,
        completion_rate: total > 0 ? ((completed / total) * 100).toFixed(1) : 0,
        avg_response_time_hours: parseFloat(responseTime?.avg_response_time || 0).toFixed(1)
      })),

      // Conversion metrics
      Promise.all([
        SearchHistory.count({
          where: {
            created_at: { [SearchHistory.sequelize.Sequelize.Op.gte]: startDate }
          }
        }),
        SearchHistory.count({
          where: {
            created_at: { [SearchHistory.sequelize.Sequelize.Op.gte]: startDate },
            clicked_cars: { [SearchHistory.sequelize.Sequelize.Op.ne]: '[]' }
          }
        }),
        Favorite.count({
          where: {
            created_at: { [Favorite.sequelize.Sequelize.Op.gte]: startDate }
          }
        })
      ]).then(([searches, clickedSearches, favorites]) => ({
        total_searches: searches,
        searches_with_clicks: clickedSearches,
        click_through_rate: searches > 0 ? ((clickedSearches / searches) * 100).toFixed(1) : 0,
        favorites_created: favorites
      })),

      // Engagement metrics
      Promise.all([
        Car.findOne({
          attributes: [[Car.sequelize.fn('AVG', Car.sequelize.col('view_count')), 'avg_views']],
          where: { is_sold: false },
          raw: true
        }),
        SearchHistory.findOne({
          attributes: [[SearchHistory.sequelize.fn('AVG', SearchHistory.sequelize.col('time_spent')), 'avg_time']],
          where: {
            created_at: { [SearchHistory.sequelize.Sequelize.Op.gte]: startDate },
            time_spent: { [SearchHistory.sequelize.Sequelize.Op.gt]: 0 }
          },
          raw: true
        }),
        User.count({
          where: {
            last_login: { [User.sequelize.Sequelize.Op.gte]: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
          }
        })
      ]).then(([avgViews, avgTime, weeklyActiveUsers]) => ({
        avg_car_views: parseFloat(avgViews?.avg_views || 0).toFixed(1),
        avg_session_time: parseFloat(avgTime?.avg_time || 0).toFixed(1),
        weekly_active_users: weeklyActiveUsers
      }))
    ]);

    res.json({
      success: true,
      data: {
        inquiry_metrics: inquiryMetrics,
        conversion_metrics: conversionMetrics,
        engagement_metrics: engagementMetrics,
        timeframe
      }
    });

  } catch (error) {
    console.error('Performance analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching performance analytics'
    });
  }
});

// @route   GET /api/analytics/export
// @desc    Export analytics data
// @access  Private (Admin)
router.get('/export', [auth, requireAdmin], [
  query('type').isIn(['cars', 'users', 'searches', 'inquiries']).withMessage('Invalid export type'),
  query('format').optional().isIn(['json', 'csv']).withMessage('Invalid format')
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

    const { type, format = 'json', timeframe = '30d' } = req.query;
    
    const now = new Date();
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let data;
    let filename;

    switch (type) {
      case 'cars':
        data = await Car.findAll({
          where: {
            created_at: { [Car.sequelize.Sequelize.Op.gte]: startDate }
          },
          include: [{ model: Dealer, as: 'dealer', attributes: ['name', 'city', 'state'] }]
        });
        filename = `cars_export_${timeframe}`;
        break;

      case 'users':
        data = await User.findAll({
          where: {
            created_at: { [User.sequelize.Sequelize.Op.gte]: startDate }
          },
          attributes: { exclude: ['password_hash', 'verification_token', 'reset_password_token'] }
        });
        filename = `users_export_${timeframe}`;
        break;

      case 'searches':
        data = await SearchHistory.findAll({
          where: {
            created_at: { [SearchHistory.sequelize.Sequelize.Op.gte]: startDate }
          }
        });
        filename = `searches_export_${timeframe}`;
        break;

      case 'inquiries':
        data = await Inquiry.findAll({
          where: {
            created_at: { [Inquiry.sequelize.Sequelize.Op.gte]: startDate }
          },
          include: [
            { model: User, as: 'user', attributes: ['email', 'first_name', 'last_name'] },
            { model: Car, as: 'car', attributes: ['make', 'model', 'year', 'vin'] }
          ]
        });
        filename = `inquiries_export_${timeframe}`;
        break;
    }

    if (format === 'csv') {
      // Simple CSV conversion (in production, use a proper CSV library)
      const headers = Object.keys(data[0]?.toJSON() || {}).join(',');
      const rows = data.map(item => Object.values(item.toJSON()).join(','));
      const csv = [headers, ...rows].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      res.json({
        success: true,
        data: data,
        exported_at: new Date().toISOString(),
        timeframe,
        type
      });
    }

  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while exporting analytics'
    });
  }
});

module.exports = router;