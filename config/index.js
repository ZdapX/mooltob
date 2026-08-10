const database = require('./database');
const { CONSTANTS, ENV, CORS_OPTIONS, JWT_OPTIONS, LOG_CONFIG } = require('./constants');

module.exports = {
  database,
  constants: CONSTANTS,
  env: ENV,
  cors: CORS_OPTIONS,
  jwt: JWT_OPTIONS,
  log: LOG_CONFIG
};
