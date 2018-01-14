const logs = require('./logs.js');
const database = require('./database.js');
const user = require('./user.js');
const layout = require('./layout.js');
const component = require('./component.js');
const config = require('./config.js');
const middleware = require('./middleware.js');

module.exports = {
  ...logs,
  ...database,
  ...user,
  ...layout,
  ...component,
  dashConfig: config,
  middleware: middleware,
};