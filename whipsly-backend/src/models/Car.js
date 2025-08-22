const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Car = sequelize.define('Car', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    vin: {
      type: DataTypes.STRING(17),
      unique: true,
      allowNull: false,
      validate: {
        len: [17, 17]
      }
    },
    make: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    model: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1990,
        max: new Date().getFullYear() + 1
      }
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    mileage: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    condition: {
      type: DataTypes.ENUM('New', 'Used', 'Certified Pre-Owned'),
      defaultValue: 'Used'
    },
    body_style: {
      type: DataTypes.STRING(50),
      field: 'bodyStyle'
    },
    transmission: {
      type: DataTypes.STRING(50)
    },
    drivetrain: {
      type: DataTypes.STRING(20)
    },
    fuel_type: {
      type: DataTypes.STRING(20),
      field: 'fuelType',
      defaultValue: 'Gasoline'
    },
    mpg_city: {
      type: DataTypes.INTEGER,
      field: 'mpgCity'
    },
    mpg_highway: {
      type: DataTypes.INTEGER,
      field: 'mpgHwy'
    },
    mpg_combined: {
      type: DataTypes.STRING(20),
      field: 'mpg'
    },
    exterior_color: {
      type: DataTypes.STRING(50),
      field: 'exteriorColor'
    },
    interior_color: {
      type: DataTypes.STRING(50),
      field: 'interiorColor'
    },
    engine: {
      type: DataTypes.STRING(100)
    },
    features: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    images: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    description: {
      type: DataTypes.TEXT
    },
    dealer_id: {
      type: DataTypes.INTEGER,
      field: 'dealerId',
      references: {
        model: 'Dealers',
        key: 'id'
      }
    },
    location: {
      type: DataTypes.STRING(100)
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8)
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8)
    },
    days_on_market: {
      type: DataTypes.INTEGER,
      field: 'daysOnMarket',
      defaultValue: 0
    },
    price_history: {
      type: DataTypes.JSONB,
      field: 'priceHistory',
      defaultValue: []
    },
    rating: {
      type: DataTypes.DECIMAL(2, 1),
      validate: {
        min: 1.0,
        max: 5.0
      }
    },
    view_count: {
      type: DataTypes.INTEGER,
      field: 'viewCount',
      defaultValue: 0
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      field: 'isFeatured',
      defaultValue: false
    },
    is_sold: {
      type: DataTypes.BOOLEAN,
      field: 'isSold',
      defaultValue: false
    },
    sold_date: {
      type: DataTypes.DATE,
      field: 'soldDate'
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
    tableName: 'cars',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['make', 'model']
      },
      {
        fields: ['year']
      },
      {
        fields: ['price']
      },
      {
        fields: ['mileage']
      },
      {
        fields: ['location']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['is_sold']
      }
    ]
  });

  // Instance methods
  Car.prototype.incrementViewCount = function() {
    return this.increment('view_count');
  };

  Car.prototype.updatePriceHistory = function(newPrice) {
    const history = this.price_history || [];
    history.push({
      price: parseFloat(newPrice),
      date: new Date()
    });
    
    // Keep only last 12 price changes
    if (history.length > 12) {
      history.shift();
    }
    
    return this.update({ 
      price: newPrice,
      price_history: history 
    });
  };

  Car.prototype.markAsSold = function() {
    return this.update({
      is_sold: true,
      sold_date: new Date()
    });
  };

  // Class methods
  Car.searchCars = function(searchParams) {
    const {
      make,
      model,
      minYear,
      maxYear,
      minPrice,
      maxPrice,
      maxMileage,
      location,
      radius,
      condition,
      bodyStyle,
      fuelType,
      features,
      limit = 20,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = searchParams;

    const where = { is_sold: false };
    
    if (make) where.make = { [sequelize.Sequelize.Op.iLike]: `%${make}%` };
    if (model) where.model = { [sequelize.Sequelize.Op.iLike]: `%${model}%` };
    if (minYear) where.year = { [sequelize.Sequelize.Op.gte]: minYear };
    if (maxYear) where.year = { ...where.year, [sequelize.Sequelize.Op.lte]: maxYear };
    if (minPrice) where.price = { [sequelize.Sequelize.Op.gte]: minPrice };
    if (maxPrice) where.price = { ...where.price, [sequelize.Sequelize.Op.lte]: maxPrice };
    if (maxMileage) where.mileage = { [sequelize.Sequelize.Op.lte]: maxMileage };
    if (condition) where.condition = condition;
    if (bodyStyle) where.body_style = bodyStyle;
    if (fuelType) where.fuel_type = fuelType;
    if (location) where.location = { [sequelize.Sequelize.Op.iLike]: `%${location}%` };

    return this.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]],
      include: ['Dealer']
    });
  };

  // Associations
  Car.associate = function(models) {
    Car.belongsTo(models.Dealer, {
      foreignKey: 'dealer_id',
      as: 'dealer'
    });
    
    Car.belongsToMany(models.User, {
      through: models.Favorite,
      foreignKey: 'car_id',
      as: 'favoritedBy'
    });
    
    Car.hasMany(models.Inquiry, {
      foreignKey: 'car_id',
      as: 'inquiries'
    });
  };

  return Car;
};