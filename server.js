const {Floof} = require('floof');
const fbApi = require('./api.js');
const fbFrontDev = require('./frontend-dev.js');
const fbFrontEUser = require('./frontend-euser.js');
const {logs, initDatabase, User, masters} = require('./lib');

const app = new Floof()
  .ball(fbApi).ball(fbFrontDev).ball(fbFrontEUser);

if (process.env.DASHCORD_DEBUG === 'true') {
  logs.warn('Debug mode enabled!');
  const watcher = require('chokidar').watch('templates', {disableGlobbing: true});
  function recompile(fn) {
    logs.info(`${fn} changed!`);
    app.renderer.recompile();
  }
  watcher.on('ready', function() {
    watcher.on('change', recompile).on('add', recompile).on('unlink', recompile);
  });
}

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