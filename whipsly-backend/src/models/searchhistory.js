const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Inquiry = sequelize.define('Inquiry', {
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
    dealer_id: {
      type: DataTypes.INTEGER,
      field: 'dealerId',
      allowNull: false,
      references: {
        model: 'Dealers',
        key: 'id'
      }
    },
    inquiry_type: {
      type: DataTypes.ENUM('general', 'test_drive', 'financing', 'trade_in', 'price_quote'),
      field: 'inquiryType',
      defaultValue: 'general'
    },
    subject: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [10, 2000]
      }
    },
    contact_preference: {
      type: DataTypes.ENUM('email', 'phone', 'text'),
      field: 'contactPreference',
      defaultValue: 'email'
    },
    preferred_contact_time: {
      type: DataTypes.ENUM('morning', 'afternoon', 'evening', 'anytime'),
      field: 'preferredContactTime',
      defaultValue: 'anytime'
    },
    status: {
      type: DataTypes.ENUM('pending', 'contacted', 'in_progress', 'completed', 'closed'),
      defaultValue: 'pending'
    },
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
      defaultValue: 'normal'
    },
    dealer_response: {
      type: DataTypes.TEXT,
      field: 'dealerResponse'
    },
    dealer_responded_at: {
      type: DataTypes.DATE,
      field: 'dealerRespondedAt'
    },
    scheduled_appointment: {
      type: DataTypes.DATE,
      field: 'scheduledAppointment'
    },
    appointment_type: {
      type: DataTypes.ENUM('test_drive', 'viewing', 'financing', 'trade_appraisal'),
      field: 'appointmentType'
    },
    trade_in_info: {
      type: DataTypes.JSONB,
      field: 'tradeInInfo',
      defaultValue: null
    },
    financing_info: {
      type: DataTypes.JSONB,
      field: 'financingInfo',
      defaultValue: null
    },
    notes: {
      type: DataTypes.TEXT
    },
    is_urgent: {
      type: DataTypes.BOOLEAN,
      field: 'isUrgent',
      defaultValue: false
    },
    follow_up_date: {
      type: DataTypes.DATE,
      field: 'followUpDate'
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
    tableName: 'inquiries',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['car_id']
      },
      {
        fields: ['dealer_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['priority']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['inquiry_type']
      }
    ]
  });

  // Instance methods
  Inquiry.prototype.markAsContacted = function(response) {
    return this.update({
      status: 'contacted',
      dealer_response: response,
      dealer_responded_at: new Date()
    });
  };

  Inquiry.prototype.scheduleAppointment = function(appointmentDate, appointmentType) {
    return this.update({
      scheduled_appointment: appointmentDate,
      appointment_type: appointmentType,
      status: 'in_progress'
    });
  };

  Inquiry.prototype.complete = function(notes) {
    return this.update({
      status: 'completed',
      notes: notes,
      updated_at: new Date()
    });
  };

  Inquiry.prototype.setFollowUp = function(followUpDate) {
    return this.update({
      follow_up_date: followUpDate,
      updated_at: new Date()
    });
  };

  Inquiry.prototype.addTradeInInfo = function(tradeInData) {
    return this.update({
      trade_in_info: tradeInData,
      updated_at: new Date()
    });
  };

  Inquiry.prototype.addFinancingInfo = function(financingData) {
    return this.update({
      financing_info: financingData,
      updated_at: new Date()
    });
  };

  // Class methods
  Inquiry.findByUser = function(userId, options = {}) {
    const { limit = 20, offset = 0, status } = options;
    
    const whereClause = { user_id: userId };
    if (status) whereClause.status = status;
    
    return this.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: sequelize.models.Car,
          as: 'car',
          attributes: ['id', 'make', 'model', 'year', 'price', 'vin']
        },
        {
          model: sequelize.models.Dealer,
          as: 'dealer',
          attributes: ['id', 'name', 'phone', 'email']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });
  };

  Inquiry.findByDealer = function(dealerId, options = {}) {
    const { limit = 50, offset = 0, status, priority } = options;
    
    const whereClause = { dealer_id: dealerId };
    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;
    
    return this.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: sequelize.models.User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone']
        },
        {
          model: sequelize.models.Car,
          as: 'car',
          attributes: ['id', 'make', 'model', 'year', 'price', 'vin']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });
  };

  Inquiry.findByCar = function(carId) {
    return this.findAll({
      where: { car_id: carId },
      include: [
        {
          model: sequelize.models.User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });
  };

  Inquiry.findPending = function(dealerId = null) {
    const whereClause = { status: 'pending' };
    if (dealerId) whereClause.dealer_id = dealerId;
    
    return this.findAll({
      where: whereClause,
      include: [
        {
          model: sequelize.models.User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone']
        },
        {
          model: sequelize.models.Car,
          as: 'car',
          attributes: ['id', 'make', 'model', 'year', 'price']
        },
        {
          model: sequelize.models.Dealer,
          as: 'dealer',
          attributes: ['id', 'name', 'phone', 'email']
        }
      ],
      order: [['created_at', 'ASC']] // Oldest first for pending
    });
  };

  Inquiry.findUrgent = function(dealerId = null) {
    const whereClause = { 
      priority: 'urgent',
      status: ['pending', 'contacted', 'in_progress']
    };
    if (dealerId) whereClause.dealer_id = dealerId;
    
    return this.findAll({
      where: whereClause,
      include: [
        {
          model: sequelize.models.User,
          as: 'user'
        },
        {
          model: sequelize.models.Car,
          as: 'car'
        }
      ],
      order: [['created_at', 'ASC']]
    });
  };

  Inquiry.getStats = function(dealerId = null, dateRange = null) {
    const whereClause = {};
    if (dealerId) whereClause.dealer_id = dealerId;
    if (dateRange) {
      whereClause.created_at = {
        [sequelize.Sequelize.Op.between]: [dateRange.start, dateRange.end]
      };
    }
    
    return Promise.all([
      this.count({ where: { ...whereClause, status: 'pending' } }),
      this.count({ where: { ...whereClause, status: 'contacted' } }),
      this.count({ where: { ...whereClause, status: 'completed' } }),
      this.count({ where: { ...whereClause, priority: 'urgent' } }),
      this.count({ where: whereClause })
    ]).then(([pending, contacted, completed, urgent, total]) => ({
      pending,
      contacted,
      completed,
      urgent,
      total,
      response_rate: total > 0 ? ((contacted + completed) / total * 100).toFixed(1) : 0
    }));
  };

  // Associations
  Inquiry.associate = function(models) {
    Inquiry.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    
    Inquiry.belongsTo(models.Car, {
      foreignKey: 'car_id',
      as: 'car'
    });
    
    Inquiry.belongsTo(models.Dealer, {
      foreignKey: 'dealer_id',
      as: 'dealer'
    });
  };

  return Inquiry;
};