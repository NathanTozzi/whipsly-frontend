const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    first_name: {
      type: DataTypes.STRING(50),
      field: 'firstName',
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 50]
      }
    },
    last_name: {
      type: DataTypes.STRING(50),
      field: 'lastName',
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 50]
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true
      }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      field: 'passwordHash',
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING(20),
      validate: {
        is: /^[\+]?[1-9][\d]{0,15}$/
      }
    },
    location: {
      type: DataTypes.STRING(100)
    },
    preferences: {
      type: DataTypes.JSONB,
      defaultValue: {
        email_notifications: true,
        price_alerts: true,
        new_listings: false,
        market_reports: false
      }
    },
    search_radius: {
      type: DataTypes.INTEGER,
      field: 'searchRadius',
      defaultValue: 25,
      validate: {
        min: 5,
        max: 500
      }
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      field: 'isVerified',
      defaultValue: false
    },
    verification_token: {
      type: DataTypes.STRING(255),
      field: 'verificationToken'
    },
    reset_password_token: {
      type: DataTypes.STRING(255),
      field: 'resetPasswordToken'
    },
    reset_password_expires: {
      type: DataTypes.DATE,
      field: 'resetPasswordExpires'
    },
    last_login: {
      type: DataTypes.DATE,
      field: 'lastLogin'
    },
    login_count: {
      type: DataTypes.INTEGER,
      field: 'loginCount',
      defaultValue: 0
    },
    role: {
      type: DataTypes.ENUM('user', 'dealer', 'admin'),
      defaultValue: 'user'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      field: 'isActive',
      defaultValue: true
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
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password_hash) {
          const salt = await bcrypt.genSalt(12);
          user.password_hash = await bcrypt.hash(user.password_hash, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password_hash')) {
          const salt = await bcrypt.genSalt(12);
          user.password_hash = await bcrypt.hash(user.password_hash, salt);
        }
      }
    },
    indexes: [
      {
        unique: true,
        fields: ['email']
      },
      {
        fields: ['location']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['is_active']
      }
    ]
  });

  // Instance methods
  User.prototype.validatePassword = async function(password) {
    return await bcrypt.compare(password, this.password_hash);
  };

  User.prototype.getFullName = function() {
    return `${this.first_name} ${this.last_name}`;
  };

  User.prototype.updateLoginInfo = function() {
    return this.update({
      last_login: new Date(),
      login_count: this.login_count + 1
    });
  };

  User.prototype.toSafeJSON = function() {
    const { password_hash, verification_token, reset_password_token, ...safeUser } = this.toJSON();
    return safeUser;
  };

  // Class methods
  User.findByEmail = function(email) {
    return this.findOne({
      where: { email: email.toLowerCase() }
    });
  };

  User.findActiveUsers = function() {
    return this.findAll({
      where: { is_active: true },
      order: [['created_at', 'DESC']]
    });
  };

  // Associations
  User.associate = function(models) {
    User.belongsToMany(models.Car, {
      through: models.Favorite,
      foreignKey: 'user_id',
      as: 'favoriteCars'
    });
    
    User.hasMany(models.Inquiry, {
      foreignKey: 'user_id',
      as: 'inquiries'
    });
    
    User.hasMany(models.SearchHistory, {
      foreignKey: 'user_id',
      as: 'searchHistory'
    });
    
    User.hasMany(models.Favorite, {
      foreignKey: 'user_id',
      as: 'favorites'
    });
  };

  return User;
};