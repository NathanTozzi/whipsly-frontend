const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { Favorite, Car, User, Dealer } = require('../models');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/favorites
// @desc    Get current user's favorites
// @access  Private
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50'),
  query('sortBy').optional().isIn(['created_at', 'priority', 'price']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['ASC', 'DESC']).withMessage('Sort order must be ASC or DESC')
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
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const result = await Favorite.findUserFavorites(req.userId, {
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      includeDetails: true
    });

    // Sort results if needed
    if (sortBy !== 'created_at') {
      result.rows.sort((a, b) => {
        let aVal, bVal;
        
        switch (sortBy) {
          case 'priority':
            aVal = a.priority || 0;
            bVal = b.priority || 0;
            break;
          case 'price':
            aVal = a.car?.price || 0;
            bVal = b.car?.price || 0;
            break;
          default:
            aVal = a.created_at;
            bVal = b.created_at;
        }
        
        if (sortOrder === 'ASC') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }

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
    console.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching favorites'
    });
  }
});

// @route   POST /api/favorites
// @desc    Add car to favorites
// @access  Private
router.post('/', auth, [
  body('carId').isInt({ min: 1 }).withMessage('Valid car ID is required'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
  body('priority').optional().isInt({ min: 0, max: 10 }).withMessage('Priority must be 0-10'),
  body('targetPrice').optional().isFloat({ min: 0 }).withMessage('Target price must be positive')
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

    const { carId, notes, priority = 0, targetPrice } = req.body;

    // Check if car exists and is not sold
    const car = await Car.findByPk(carId);
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    if (car.is_sold) {
      return res.status(400).json({
        success: false,
        message: 'Cannot favorite a sold car'
      });
    }

    // Add to favorites
    const { favorite, created } = await Favorite.addToFavorites(req.userId, carId, {
      notes,
      priority,
      targetPrice
    });

    if (!created) {
      return res.status(400).json({
        success: false,
        message: 'Car is already in your favorites'
      });
    }

    // Load favorite with car details
    const favoriteWithDetails = await Favorite.findByPk(favorite.id, {
      include: [
        {
          model: Car,
          as: 'car',
          include: [
            {
              model: Dealer,
              as: 'dealer',
              attributes: ['id', 'name', 'city', 'state']
            }
          ]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Car added to favorites successfully',
      data: {
        favorite: favoriteWithDetails
      }
    });

  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding to favorites'
    });
  }
});

// @route   GET /api/favorites/:id
// @desc    Get specific favorite
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const favoriteId = req.params.id;

    const favorite = await Favorite.findByPk(favoriteId, {
      include: [
        {
          model: Car,
          as: 'car',
          include: [
            {
              model: Dealer,
              as: 'dealer'
            }
          ]
        }
      ]
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }

    // Check if user owns this favorite
    if (favorite.user_id !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own favorites.'
      });
    }

    res.json({
      success: true,
      data: {
        favorite
      }
    });

  } catch (error) {
    console.error('Get favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching favorite'
    });
  }
});

// @route   PUT /api/favorites/:id
// @desc    Update favorite
// @access  Private
router.put('/:id', auth, [
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
  body('priority').optional().isInt({ min: 0, max: 10 }).withMessage('Priority must be 0-10'),
  body('targetPrice').optional().isFloat({ min: 0 }).withMessage('Target price must be positive'),
  body('priceAlertEnabled').optional().isBoolean().withMessage('Price alert enabled must be boolean')
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

    const favoriteId = req.params.id;
    const { notes, priority, targetPrice, priceAlertEnabled } = req.body;

    const favorite = await Favorite.findByPk(favoriteId);
    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }

    // Check if user owns this favorite
    if (favorite.user_id !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own favorites.'
      });
    }

    // Build update object
    const updateData = {};
    if (notes !== undefined) updateData.notes = notes;
    if (priority !== undefined) updateData.priority = priority;
    if (targetPrice !== undefined) updateData.target_price = targetPrice;
    if (priceAlertEnabled !== undefined) updateData.price_alert_enabled = priceAlertEnabled;

    await favorite.update(updateData);

    // Load updated favorite with car details
    const updatedFavorite = await Favorite.findByPk(favoriteId, {
      include: [
        {
          model: Car,
          as: 'car',
          include: [
            {
              model: Dealer,
              as: 'dealer',
              attributes: ['id', 'name', 'city', 'state']
            }
          ]
        }
      ]
    });

    res.json({
      success: true,
      message: 'Favorite updated successfully',
      data: {
        favorite: updatedFavorite
      }
    });

  } catch (error) {
    console.error('Update favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating favorite'
    });
  }
});

// @route   DELETE /api/favorites/:id
// @desc    Remove favorite
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const favoriteId = req.params.id;

    const favorite = await Favorite.findByPk(favoriteId);
    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }

    // Check if user owns this favorite
    if (favorite.user_id !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own favorites.'
      });
    }

    await favorite.destroy();

    res.json({
      success: true,
      message: 'Favorite removed successfully'
    });

  } catch (error) {
    console.error('Delete favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing favorite'
    });
  }
});

// @route   DELETE /api/favorites/car/:carId
// @desc    Remove car from favorites by car ID
// @access  Private
router.delete('/car/:carId', auth, async (req, res) => {
  try {
    const carId = req.params.carId;

    const deleted = await Favorite.removeFromFavorites(req.userId, carId);

    if (deleted === 0) {
      return res.status(404).json({
        success: false,
        message: 'Car not found in your favorites'
      });
    }

    res.json({
      success: true,
      message: 'Car removed from favorites successfully'
    });

  } catch (error) {
    console.error('Remove favorite by car error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing favorite'
    });
  }
});

// @route   POST /api/favorites/:id/price-alert
// @desc    Set price alert for favorite
// @access  Private
router.post('/:id/price-alert', auth, [
  body('targetPrice').isFloat({ min: 0 }).withMessage('Target price must be positive')
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

    const favoriteId = req.params.id;
    const { targetPrice } = req.body;

    const favorite = await Favorite.findByPk(favoriteId);
    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }

    // Check if user owns this favorite
    if (favorite.user_id !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only set alerts for your own favorites.'
      });
    }

    await favorite.setPriceAlert(targetPrice);

    res.json({
      success: true,
      message: 'Price alert set successfully',
      data: {
        favorite
      }
    });

  } catch (error) {
    console.error('Set price alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while setting price alert'
    });
  }
});

// @route   DELETE /api/favorites/:id/price-alert
// @desc    Disable price alert for favorite
// @access  Private
router.delete('/:id/price-alert', auth, async (req, res) => {
  try {
    const favoriteId = req.params.id;

    const favorite = await Favorite.findByPk(favoriteId);
    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }

    // Check if user owns this favorite
    if (favorite.user_id !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only manage alerts for your own favorites.'
      });
    }

    await favorite.disablePriceAlert();

    res.json({
      success: true,
      message: 'Price alert disabled successfully',
      data: {
        favorite
      }
    });

  } catch (error) {
    console.error('Disable price alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while disabling price alert'
    });
  }
});

// @route   GET /api/favorites/stats
// @desc    Get user's favorites statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.userId;

    const [
      totalFavorites,
      favoritesWithAlerts,
      avgTargetPrice,
      favoritesByPriority,
      recentFavorites
    ] = await Promise.all([
      Favorite.getUserFavoriteCount(userId),
      Favorite.count({
        where: {
          user_id: userId,
          price_alert_enabled: true
        }
      }),
      Favorite.findOne({
        where: {
          user_id: userId,
          target_price: { [Favorite.sequelize.Sequelize.Op.not]: null }
        },
        attributes: [[Favorite.sequelize.fn('AVG', Favorite.sequelize.col('target_price')), 'avg_target']],
        raw: true
      }),
      Favorite.findAll({
        where: { user_id: userId },
        attributes: [
          'priority',
          [Favorite.sequelize.fn('COUNT', Favorite.sequelize.col('id')), 'count']
        ],
        group: ['priority'],
        raw: true
      }),
      Favorite.count({
        where: {
          user_id: userId,
          created_at: {
            [Favorite.sequelize.Sequelize.Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        total_favorites: totalFavorites,
        favorites_with_alerts: favoritesWithAlerts,
        avg_target_price: parseFloat(avgTargetPrice?.avg_target || 0).toFixed(2),
        favorites_by_priority: favoritesByPriority,
        recent_favorites: recentFavorites
      }
    });

  } catch (error) {
    console.error('Get favorites stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching favorites statistics'
    });
  }
});

// @route   POST /api/favorites/bulk-action
// @desc    Perform bulk actions on favorites
// @access  Private
router.post('/bulk-action', auth, [
  body('action').isIn(['delete', 'enable_alerts', 'disable_alerts', 'set_priority']).withMessage('Invalid action'),
  body('favoriteIds').isArray({ min: 1 }).withMessage('Favorite IDs array is required'),
  body('favoriteIds.*').isInt({ min: 1 }).withMessage('All favorite IDs must be positive integers'),
  body('priority').optional().isInt({ min: 0, max: 10 }).withMessage('Priority must be 0-10')
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

    const { action, favoriteIds, priority } = req.body;

    // Verify all favorites belong to the user
    const favorites = await Favorite.findAll({
      where: {
        id: favoriteIds,
        user_id: req.userId
      }
    });

    if (favorites.length !== favoriteIds.length) {
      return res.status(403).json({
        success: false,
        message: 'Some favorites do not belong to you or do not exist'
      });
    }

    let updateData = {};
    let message = '';

    switch (action) {
      case 'delete':
        await Favorite.destroy({
          where: {
            id: favoriteIds,
            user_id: req.userId
          }
        });
        message = `${favoriteIds.length} favorites deleted successfully`;
        break;

      case 'enable_alerts':
        updateData = { price_alert_enabled: true };
        message = `Price alerts enabled for ${favoriteIds.length} favorites`;
        break;

      case 'disable_alerts':
        updateData = { price_alert_enabled: false };
        message = `Price alerts disabled for ${favoriteIds.length} favorites`;
        break;

      case 'set_priority':
        if (priority === undefined) {
          return res.status(400).json({
            success: false,
            message: 'Priority value is required for set_priority action'
          });
        }
        updateData = { priority };
        message = `Priority set to ${priority} for ${favoriteIds.length} favorites`;
        break;
    }

    if (Object.keys(updateData).length > 0) {
      await Favorite.update(updateData, {
        where: {
          id: favoriteIds,
          user_id: req.userId
        }
      });
    }

    res.json({
      success: true,
      message,
      data: {
        affected_count: favoriteIds.length
      }
    });

  } catch (error) {
    console.error('Bulk action error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while performing bulk action'
    });
  }
});

module.exports = router;