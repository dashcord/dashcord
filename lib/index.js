const logs = require('./logs.js');
const database = require('./database.js');

module.exports = {...logs, ...database};