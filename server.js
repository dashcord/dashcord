const {Floof} = require('floof');
const fbApi = require('./api.js');
const fbFrontDev = require('./frontend-dev.js');
const fbFrontEUser = require('./frontend-euser.js');
const {logs, LogLevel, initDatabase, User, masters} = require('./lib');

const app = new Floof()
  .ball(fbApi).ball(fbFrontDev).ball(fbFrontEUser);

app.error().forCode(404).exec(async (req, msg, ren) => {
  if (req.url.startsWith('/dev')) {
    return await req.delegateError(fbFrontDev);
  }
  return await req.delegateError(fbFrontEUser);
});

let debugMode = false;
if (process.env.DASHCORD_DEBUG === 'true') {
  debugMode = true;
  logs.setLevel(LogLevel.TRACE);
  logs.debug('Debug mode enabled!');
  const watcher = require('chokidar').watch('templates', {disableGlobbing: true});
  function recompile(fn) {
    logs.debug(`${fn} changed!`);
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
    logs.debug('Built GET endpoint tree:');
    (function iterEptNode(ept, path = '', layer = 0) {
      logs.debug(`${layer ? '│ '.repeat(layer - 1) + '├' : ''} ${path || '(root)'}${ept.endpoint ? ' <=' : ''}`);
      for (const [k, v] of ept.strong) iterEptNode(v, `${path}/${k}`, layer + 1);
      if (ept.weak) iterEptNode(ept.weak, `${path}/(${ept.weakType || '?'} ${ept.weakName})`, layer + 1);
    })(app.endpoints.roots.get('GET'));
    logs.info('Starting server...');
    await app.go();
    logs.info('Server started.');
  } catch (e) {
    logs.error(e);
  }
})();