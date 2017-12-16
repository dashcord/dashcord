const {Floof} = require('floof');
const fbApi = require('./api.js');
const fbFrontDev = require('./frontend-dev.js');
const fbFrontEUser = require('./frontend-euser.js');
const {logs} = require('./lib');

const app = new Floof()
  .ball(fbApi).ball(fbFrontDev).ball(fbFrontEUser);
(async function() {
  try {
    await app.go();
    logs.info('Server started.');
  } catch (e) {
    logs.error(e);
  }
})();