const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Favorite = sequelize.define('Favorite', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      field: 'userId',
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    car_id: {
      type: DataTypes.INTEGER,
      field: 'carId',
      allowNull: false,
      references: {
        model: 'Cars',
        key: 'id'
      }
    },
    notes: {
      type: DataTypes.TEXT
    },
    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 10
      }
    },
    price_alert_enabled: {
      type: DataTypes.BOOLEAN,
      field: 'priceAlertEnabled',
      defaultValue: false
    },
    target_price: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'targetPrice'
    },
    created_at: {
      type: DataTypes.DATE,
      field: 'createdAt',
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      field: 'updatedAt',
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'favorites',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'car_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['car_id']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['price_alert_enabled']
      }
    ]
  });

  // Instance methods
  Favorite.prototype.checkPriceAlert = function(currentPrice) {
    if (!this.price_alert_enabled || !this.target_price) {
      return false;
    }
    return currentPrice <= this.target_price;
  };

  Favorite.prototype.updateNotes = function(notes) {
    return this.update({ notes, updated_at: new Date() });
  };

  Favorite.prototype.setPriceAlert = function(targetPrice) {
    return this.update({
      target_price: targetPrice,
      price_alert_enabled: true,
      updated_at: new Date()
    });
  };

  Favorite.prototype.disablePriceAlert = function() {
    return this.update({
      price_alert_enabled: false,
      updated_at: new Date()
    });
  };

  // Class methods
  Favorite.findUserFavorites = function(userId, options = {}) {
    const { limit = 50, offset = 0, includeDetails = true } = options;
    
    const query = {
      where: { user_id: userId },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    };
    
    if (includeDetails) {
      query.include = [
        {
          model: sequelize.models.Car,
          as: 'car',
          include: [
            {
              model: sequelize.models.Dealer,
              as: 'dealer'
            }
          ]
        }
      ];
    }
    
    return this.findAndCountAll(query);
  };

  Favorite.findCarFavorites = function(carId) {
    return this.findAll({
      where: { car_id: carId },
      include: [
        {
          model: sequelize.models.User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ]
    });
  };

  Favorite.findWithPriceAlerts = function() {
    return this.findAll({
      where: { 
        price_alert_enabled: true,
        target_price: { [sequelize.Sequelize.Op.not]: null }
      },
      include: [
        {
          model: sequelize.models.User,
          as: 'user',
          attributes: ['id', 'email', 'first_name', 'preferences']
        },
        {
          model: sequelize.models.Car,
          as: 'car',
          attributes: ['id', 'make', 'model', 'year', 'price', 'vin']
        }
      ]
    });
  };

  Favorite.getUserFavoriteCount = function(userId) {
    return this.count({
      where: { user_id: userId }
    });
  };

  Favorite.getCarFavoriteCount = function(carId) {
    return this.count({
      where: { car_id: carId }
    });
  };

  Favorite.addToFavorites = async function(userId, carId, options = {}) {
    const { notes, priority = 0, targetPrice } = options;
    
    const [favorite, created] = await this.findOrCreate({
      where: { user_id: userId, car_id: carId },
      defaults: {
        notes,
        priority,
        target_price: targetPrice,
        price_alert_enabled: !!targetPrice
      }
    });
    
    return { favorite, created };
  };

  Favorite.removeFromFavorites = function(userId, carId) {
    return this.destroy({
      where: { user_id: userId, car_id: carId }
    });
  };

  // Associations
  Favorite.associate = function(models) {
    Favorite.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    
    Favorite.belongsTo(models.Car, {
      foreignKey: 'car_id',
      as: 'car'
    });
  };

  return Favorite;
};