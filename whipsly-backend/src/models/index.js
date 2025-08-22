const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Initialize Sequelize
let sequelize;
if (dbConfig.use_env_variable) {
  sequelize = new Sequelize(process.env[dbConfig.use_env_variable], dbConfig);
} else {
  sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig);
}

// Import models
const Car = require('../../models/car')(sequelize);
const User = require('../../models/User')(sequelize);
const Dealer = require('../../models/Dealer')(sequelize);
const Favorite = require('../../models/Favorite')(sequelize);
const Inquiry = require('../../models/Inquiry')(sequelize);
const SearchHistory = require('../../models/SearchHistory')(sequelize);

// Store models in db object
const db = {
  sequelize,
  Sequelize,
  Car,
  User,
  Dealer,
  Favorite,
  Inquiry,
  SearchHistory
};

// Define associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;