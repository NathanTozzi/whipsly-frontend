const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { User, Favorite, Car, Inquiry, SearchHistory } = require('../models');
const { auth, requireAdmin, requireOwnership } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private (Admin)
router.get('/', [auth, requireAdmin], [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('role').optional().isIn(['user', 'dealer', 'admin']).withMessage('Invalid role'),
  query('isActive').optional().isBoolean().withMessage('isActive must be boolean')
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
      page = 1,
      limit = 20,
      role,
      isActive,
      search
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build where clause
    const whereClause = {};
    if (role) whereClause.role = role;
    if (isActive !== undefined) whereClause.is_active = isActive === 'true';
    
    // Search by name or email
    if (search) {
      const { Op } = require('sequelize');
      whereClause[Op.or] = [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { rows: users, count } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password_hash', 'verification_token', 'reset_password_token'] },
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        users: users.map(user => user.toSafeJSON()),
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total_items: count,
          total_pages: Math.ceil(count / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Own profile or Admin)
router.get('/:id', auth, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Users can only view their own profile, admins can view any
    if (req.user.role !== 'admin' && parseInt(userId) !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own profile.'
      });
    }

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password_hash', 'verification_token', 'reset_password_token'] },
      include: [
        {
          model: Favorite,
          as: 'favorites',
          include: [
            {
              model: Car,
              as: 'car',
              attributes: ['id', 'make', 'model', 'year', 'price', 'mileage']
            }
          ]
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: user.toSafeJSON()
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user'
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private (Own profile or Admin)
router.put('/:id', auth, [
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  body('location').optional().trim().isLength({ max: 100 }).withMessage('Location too long'),
  body('searchRadius').optional().isInt({ min: 5, max: 500 }).withMessage('Search radius must be 5-500 miles'),
  body('role').optional().isIn(['user', 'dealer', 'admin']).withMessage('Invalid role')
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

    const userId = req.params.id;
    const { firstName, lastName, phone, location, searchRadius, preferences, role } = req.body;

    // Users can only update their own profile, admins can update any
    if (req.user.role !== 'admin' && parseInt(userId) !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own profile.'
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Build update object
    const updateData = {};
    if (firstName !== undefined) updateData.first_name = firstName;
    if (lastName !== undefined) updateData.last_name = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (location !== undefined) updateData.location = location;
    if (searchRadius !== undefined) updateData.search_radius = searchRadius;
    if (preferences !== undefined) updateData.preferences = preferences;
    
    // Only admins can change roles
    if (role !== undefined && req.user.role === 'admin') {
      updateData.role = role;
    }

    await user.update(updateData);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: user.toSafeJSON()
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Deactivate user account
// @access  Private (Own account or Admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.params.id;

    // Users can only deactivate their own account, admins can deactivate any
    if (req.user.role !== 'admin' && parseInt(userId) !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only deactivate your own account.'
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete - deactivate instead of hard delete
    await user.update({ is_active: false });

    res.json({
      success: true,
      message: 'User account deactivated successfully'
    });

  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deactivating user'
    });
  }
});

// @route   POST /api/users/:id/activate
// @desc    Reactivate user account (Admin only)
// @access  Private (Admin)
router.post('/:id/activate', [auth, requireAdmin], async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.update({ is_active: true });

    res.json({
      success: true,
      message: 'User account activated successfully',
      data: {
        user: user.toSafeJSON()
      }
    });

  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while activating user'
    });
  }
});

// @route   GET /api/users/:id/favorites
// @desc    Get user's favorite cars
// @access  Private (Own favorites or Admin)
router.get('/:id/favorites', auth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50')
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

    const userId = req.params.id;
    const { page = 1, limit = 20 } = req.query;

    // Users can only view their own favorites, admins can view any
    if (req.user.role !== 'admin' && parseInt(userId) !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own favorites.'
      });
    }

    const result = await Favorite.findUserFavorites(userId, {
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        favorites: result.rows,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total_items: result.count,
          total_pages: Math.ceil(result.count / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get user favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching favorites'
    });
  }
});

// @route   GET /api/users/:id/inquiries
// @desc    Get user's inquiries
// @access  Private (Own inquiries or Admin)
router.get('/:id/inquiries', auth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50'),
  query('status').optional().isIn(['pending', 'contacted', 'in_progress', 'completed', 'closed']).withMessage('Invalid status')
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

    const userId = req.params.id;
    const { page = 1, limit = 20, status } = req.query;

    // Users can only view their own inquiries, admins can view any
    if (req.user.role !== 'admin' && parseInt(userId) !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own inquiries.'
      });
    }

    const result = await Inquiry.findByUser(userId, {
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      status
    });

    res.json({
      success: true,
      data: {
        inquiries: result.rows,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total_items: result.count,
          total_pages: Math.ceil(result.count / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get user inquiries error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching inquiries'
    });
  }
});

// @route   GET /api/users/:id/search-history
// @desc    Get user's search history
// @access  Private (Own history or Admin)
router.get('/:id/search-history', auth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100')
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

    const userId = req.params.id;
    const { page = 1, limit = 50 } = req.query;

    // Users can only view their own search history, admins can view any
    if (req.user.role !== 'admin' && parseInt(userId) !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own search history.'
      });
    }

    const result = await SearchHistory.findUserSearches(userId, {
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        searches: result.rows,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total_items: result.count,
          total_pages: Math.ceil(result.count / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get user search history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching search history'
    });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics (Admin only)
// @access  Private (Admin)
router.get('/stats', [auth, requireAdmin], async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const [
      totalUsers,
      activeUsers,
      newUsers,
      usersByRole,
      avgFavoritesPerUser,
      avgSearchesPerUser
    ] = await Promise.all([
      User.count(),
      User.count({ where: { is_active: true } }),
      User.count({
        where: {
          created_at: { [User.sequelize.Sequelize.Op.gte]: startDate }
        }
      }),
      User.findAll({
        attributes: [
          'role',
          [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']
        ],
        group: ['role'],
        raw: true
      }),
      Favorite.findOne({
        attributes: [[Favorite.sequelize.fn('AVG', Favorite.sequelize.literal('user_favorites.count')), 'avg_favorites']],
        include: [{
          model: User.sequelize.models.User,
          as: 'user',
          attributes: [],
          include: [{
            model: Favorite,
            as: 'favorites',
            attributes: []
          }]
        }],
        raw: true
      }),
      SearchHistory.findOne({
        attributes: [[SearchHistory.sequelize.fn('COUNT', SearchHistory.sequelize.col('id')), 'total_searches']],
        include: [{
          model: User,
          as: 'user',
          attributes: []
        }],
        raw: true
      })
    ]);

    res.json({
      success: true,
      data: {
        total_users: totalUsers,
        active_users: activeUsers,
        new_users: newUsers,
        users_by_role: usersByRole,
        avg_favorites_per_user: parseFloat(avgFavoritesPerUser?.avg_favorites || 0).toFixed(1),
        avg_searches_per_user: parseFloat(avgSearchesPerUser?.total_searches || 0) / Math.max(activeUsers, 1),
        timeframe
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user statistics'
    });
  }
});

module.exports = router;