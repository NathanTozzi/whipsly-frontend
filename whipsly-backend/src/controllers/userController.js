const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Favorite, Car, Inquiry, SearchHistory } = require('../models');
const { validationResult } = require('express-validator');

class UserController {
  // Generate JWT token
  static generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  // Register new user
  static async register(req, res) {
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

      const { firstName, lastName, email, password, phone, location } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email'
        });
      }

      // Create new user
      const user = await User.create({
        first_name: firstName,
        last_name: lastName,
        email: email.toLowerCase(),
        password_hash: password, // Will be hashed by the model hook
        phone,
        location
      });

      // Generate token
      const token = UserController.generateToken(user.id);

      // Return user data (without password)
      const userData = user.toSafeJSON();

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: userData,
          token
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during registration'
      });
    }
  }

  // Login user
  static async login(req, res) {
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

      const { email, password } = req.body;

      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Check if user is active
      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          message: 'Account is disabled. Please contact support.'
        });
      }

      // Validate password
      const isPasswordValid = await user.validatePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Update login info
      await user.updateLoginInfo();

      // Generate token
      const token = UserController.generateToken(user.id);

      // Return user data (without password)
      const userData = user.toSafeJSON();

      return res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userData,
          token
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during login'
      });
    }
  }

  // Get current user profile
  static async getProfile(req, res) {
    try {
      const user = await User.findByPk(req.userId, {
        attributes: { exclude: ['password_hash', 'verification_token', 'reset_password_token'] }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      return res.json({
        success: true,
        data: {
          user: user.toSafeJSON()
        }
      });

    } catch (error) {
      console.error('Get profile error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
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

      const { firstName, lastName, phone, location, preferences } = req.body;

      const user = await User.findByPk(req.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update user data
      const updateData = {};
      if (firstName !== undefined) updateData.first_name = firstName;
      if (lastName !== undefined) updateData.last_name = lastName;
      if (phone !== undefined) updateData.phone = phone;
      if (location !== undefined) updateData.location = location;
      if (preferences !== undefined) updateData.preferences = preferences;

      await user.update(updateData);

      return res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: user.toSafeJSON()
        }
      });

    } catch (error) {
      console.error('Update profile error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Change password
  static async changePassword(req, res) {
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

      const { currentPassword, newPassword } = req.body;

      const user = await User.findByPk(req.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Validate current password
      const isCurrentPasswordValid = await user.validatePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password
      await user.update({ password_hash: newPassword });

      return res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('Change password error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Get user dashboard data
  static async getDashboard(req, res) {
    try {
      const userId = req.userId;
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [
        user,
        favoritesCount,
        recentFavorites,
        inquiriesCount,
        recentInquiries,
        searchesCount,
        recentSearches,
        priceAlerts
      ] = await Promise.all([
        User.findByPk(userId, {
          attributes: { exclude: ['password_hash', 'verification_token', 'reset_password_token'] }
        }),
        
        Favorite.getUserFavoriteCount(userId),
        
        Favorite.findUserFavorites(userId, { limit: 5 }),
        
        Inquiry.count({ where: { user_id: userId } }),
        
        Inquiry.findByUser(userId, { limit: 5 }),
        
        SearchHistory.count({ where: { user_id: userId } }),
        
        SearchHistory.findUserSearches(userId, { limit: 5 }),
        
        Favorite.findAll({
          where: {
            user_id: userId,
            price_alert_enabled: true
          },
          include: [{
            model: Car,
            as: 'car',
            attributes: ['id', 'make', 'model', 'year', 'price']
          }]
        })
      ]);

      // Check for triggered price alerts
      const triggeredAlerts = [];
      for (const alert of priceAlerts) {
        if (alert.car && alert.checkPriceAlert(alert.car.price)) {
          triggeredAlerts.push({
            favorite_id: alert.id,
            car: alert.car,
            target_price: alert.target_price,
            current_price: alert.car.price,
            savings: alert.target_price - alert.car.price
          });
        }
      }

      return res.json({
        success: true,
        data: {
          user: user.toSafeJSON(),
          summary: {
            favorites_count: favoritesCount,
            inquiries_count: inquiriesCount,
            searches_count: searchesCount,
            price_alerts_count: priceAlerts.length,
            triggered_alerts_count: triggeredAlerts.length
          },
          recent_activity: {
            favorites: recentFavorites.rows,
            inquiries: recentInquiries.rows,
            searches: recentSearches.rows
          },
          price_alerts: {
            active_alerts: priceAlerts,
            triggered_alerts: triggeredAlerts
          }
        }
      });

    } catch (error) {
      console.error('Get dashboard error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while fetching dashboard'
      });
    }
  }

  // Get user activity statistics
  static async getActivityStats(req, res) {
    try {
      const userId = req.userId;
      const { timeframe = '30d' } = req.query;
      
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
        searchActivity,
        favoriteActivity,
        inquiryActivity,
        topSearches
      ] = await Promise.all([
        SearchHistory.findAll({
          attributes: [
            [SearchHistory.sequelize.fn('DATE', SearchHistory.sequelize.col('created_at')), 'date'],
            [SearchHistory.sequelize.fn('COUNT', SearchHistory.sequelize.col('id')), 'count']
          ],
          where: {
            user_id: userId,
            created_at: { [SearchHistory.sequelize.Sequelize.Op.gte]: startDate }
          },
          group: [SearchHistory.sequelize.fn('DATE', SearchHistory.sequelize.col('created_at'))],
          order: [[SearchHistory.sequelize.fn('DATE', SearchHistory.sequelize.col('created_at')), 'ASC']],
          raw: true
        }),

        Favorite.findAll({
          attributes: [
            [Favorite.sequelize.fn('DATE', Favorite.sequelize.col('created_at')), 'date'],
            [Favorite.sequelize.fn('COUNT', Favorite.sequelize.col('id')), 'count']
          ],
          where: {
            user_id: userId,
            created_at: { [Favorite.sequelize.Sequelize.Op.gte]: startDate }
          },
          group: [Favorite.sequelize.fn('DATE', Favorite.sequelize.col('created_at'))],
          order: [[Favorite.sequelize.fn('DATE', Favorite.sequelize.col('created_at')), 'ASC']],
          raw: true
        }),

        Inquiry.findAll({
          attributes: [
            [Inquiry.sequelize.fn('DATE', Inquiry.sequelize.col('created_at')), 'date'],
            [Inquiry.sequelize.fn('COUNT', Inquiry.sequelize.col('id')), 'count']
          ],
          where: {
            user_id: userId,
            created_at: { [Inquiry.sequelize.Sequelize.Op.gte]: startDate }
          },
          group: [Inquiry.sequelize.fn('DATE', Inquiry.sequelize.col('created_at'))],
          order: [[Inquiry.sequelize.fn('DATE', Inquiry.sequelize.col('created_at')), 'ASC']],
          raw: true
        }),

        SearchHistory.findAll({
          attributes: [
            'search_criteria',
            [SearchHistory.sequelize.fn('COUNT', SearchHistory.sequelize.col('id')), 'count']
          ],
          where: {
            user_id: userId,
            created_at: { [SearchHistory.sequelize.Sequelize.Op.gte]: startDate }
          },
          group: ['search_criteria'],
          order: [[SearchHistory.sequelize.fn('COUNT', SearchHistory.sequelize.col('id')), 'DESC']],
          limit: 10,
          raw: true
        })
      ]);

      // Calculate total activities
      const totalSearches = searchActivity.reduce((sum, item) => sum + parseInt(item.count), 0);
      const totalFavorites = favoriteActivity.reduce((sum, item) => sum + parseInt(item.count), 0);
      const totalInquiries = inquiryActivity.reduce((sum, item) => sum + parseInt(item.count), 0);

      return res.json({
        success: true,
        data: {
          timeframe,
          summary: {
            total_searches: totalSearches,
            total_favorites: totalFavorites,
            total_inquiries: totalInquiries,
            total_activities: totalSearches + totalFavorites + totalInquiries
          },
          activity_timeline: {
            searches: searchActivity,
            favorites: favoriteActivity,
            inquiries: inquiryActivity
          },
          top_searches: topSearches
        }
      });

    } catch (error) {
      console.error('Get activity stats error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while fetching activity statistics'
      });
    }
  }

  // Delete user account
  static async deleteAccount(req, res) {
    try {
      const { password } = req.body;
      const userId = req.userId;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Validate password before deletion
      const isPasswordValid = await user.validatePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Password is incorrect'
        });
      }

      // Delete user and all related data (cascading delete should handle this)
      await user.destroy();

      return res.json({
        success: true,
        message: 'Account deleted successfully'
      });

    } catch (error) {
      console.error('Delete account error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while deleting account'
      });
    }
  }

  // Logout user (if you want to implement token blacklisting)
  static async logout(req, res) {
    try {
      // In a stateless JWT system, logout is typically handled client-side
      // by removing the token from storage. However, you could implement
      // token blacklisting here if needed.
      
      return res.json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during logout'
      });
    }
  }
}

module.exports = UserController;