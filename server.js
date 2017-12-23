const {Floof} = require('floof');
const fbApi = require('./api.js');
const fbFrontDev = require('./frontend-dev.js');
const fbFrontEUser = require('./frontend-euser.js');
const {logs, initDatabase, User, masters} = require('./lib');

const app = new Floof()
  .ball(fbApi).ball(fbFrontDev).ball(fbFrontEUser);
(async function() {
  try {
    logs.info('Initializing database...');
    await initDatabase();
    logs.info('Caching user data...');
    const users = await masters.users.find({});
    User.cache(users);
    logs.info('Starting server...');
    await app.go();
    logs.info('Server started.');
  } catch (e) {
    logs.error(e);
  }
})();