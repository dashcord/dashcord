const logs = require('./logs.js');
const database = require('./database.js');
const user = require('./user.js');
const config = require('./config.js');

module.exports = {
  ...logs,
  ...database,
  ...user,
  dashConfig: config,
};