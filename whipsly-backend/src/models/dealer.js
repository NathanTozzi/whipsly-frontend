const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Dealer = sequelize.define('Dealer', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    brand: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    address: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    city: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    state: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    zip_code: {
      type: DataTypes.STRING(10),
      field: 'zipCode',
      allowNull: false
    },
    country: {
      type: DataTypes.STRING(50),
      defaultValue: 'United States'
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING(20),
      validate: {
        is: /^[\+]?[1-9][\d]{0,15}$/
      }
    },
    email: {
      type: DataTypes.STRING(100),
      validate: {
        isEmail: true
      }
    },
    website: {
      type: DataTypes.STRING(200),
      validate: {
        isUrl: true
      }
    },
    hours: {
      type: DataTypes.JSONB,
      defaultValue: {
        monday: "9:00 AM - 7:00 PM",
        tuesday: "9:00 AM - 7:00 PM",
        wednesday: "9:00 AM - 7:00 PM",
        thursday: "9:00 AM - 7:00 PM",
        friday: "9:00 AM - 7:00 PM",
        saturday: "9:00 AM - 6:00 PM",
        sunday: "12:00 PM - 5:00 PM"
      }
    },
    services: {
      type: DataTypes.JSONB,
      defaultValue: ["Sales", "Service", "Parts", "Financing"]
    },
    rating: {
      type: DataTypes.DECIMAL(2, 1),
      defaultValue: 4.5,
      validate: {
        min: 1.0,
        max: 5.0
      }
    },
    review_count: {
      type: DataTypes.INTEGER,
      field: 'reviewCount',
      defaultValue: 0
    },
    is_certified: {
      type: DataTypes.BOOLEAN,
      field: 'isCertified',
      defaultValue: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      field: 'isActive',
      defaultValue: true
    },
    logo_url: {
      type: DataTypes.STRING(500),
      field: 'logoUrl'
    },
    description: {
      type: DataTypes.TEXT
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
    tableName: 'dealers',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['brand']
      },
      {
        fields: ['city', 'state']
      },
      {
        fields: ['latitude', 'longitude']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['rating']
      }
    ]
  });

  // Instance methods
  Dealer.prototype.getFullAddress = function() {
    return `${this.address}, ${this.city}, ${this.state} ${this.zip_code}`;
  };

  Dealer.prototype.isOpenNow = function() {
    const now = new Date();
    const day = now.toLocaleLowerCase().substring(0, 3); // Get day abbreviation
    const currentTime = now.toTimeString().substring(0, 5); // HH:MM format
    
    const todayHours = this.hours[day];
    if (!todayHours || todayHours.toLowerCase() === 'closed') {
      return false;
    }
    
    // Simple time comparison (would need more robust parsing in production)
    return true; // Simplified for now
  };

  Dealer.prototype.getDistance = function(lat, lng) {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat - this.latitude) * Math.PI / 180;
    const dLng = (lng - this.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.latitude * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * 
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in miles
  };

  // Class methods
  Dealer.findNearby = function(lat, lng, radiusMiles = 25) {
    // Using Haversine formula in SQL
    return this.findAll({
      attributes: {
        include: [
          [
            sequelize.literal(`
              3959 * acos(
                cos(radians(${lat})) * 
                cos(radians(latitude)) * 
                cos(radians(longitude) - radians(${lng})) + 
                sin(radians(${lat})) * 
                sin(radians(latitude))
              )
            `),
            'distance'
          ]
        ]
      },
      having: sequelize.literal(`distance <= ${radiusMiles}`),
      order: [[sequelize.literal('distance'), 'ASC']],
      where: { is_active: true }
    });
  };

  Dealer.findByBrand = function(brand) {
    return this.findAll({
      where: { 
        brand: { [sequelize.Sequelize.Op.iLike]: `%${brand}%` },
        is_active: true
      },
      order: [['rating', 'DESC']]
    });
  };

  // Associations
  Dealer.associate = function(models) {
    Dealer.hasMany(models.Car, {
      foreignKey: 'dealer_id',
      as: 'cars'
    });
    
    Dealer.hasMany(models.Inquiry, {
      foreignKey: 'dealer_id',
      as: 'inquiries'
    });
  };

  return Dealer;
};