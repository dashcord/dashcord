const SessionPlugin = require('floof-session');
const PassportPlugin = require('floof-passport');
const {Strategy} = require('passport-discord');
const {User, userSerialization} = require('./user.js');
const dashConfig = require('./config.js');

module.exports = function middleware(app) {
  // register plugins
  app.plugin(new SessionPlugin(dashConfig.DASHCORD_SECRET));
  const pass = new PassportPlugin(true, userSerialization);
  app.plugin(pass)

  // register passport auth strategy
  pass.use(new Strategy({
    clientID: dashConfig.DASHCORD_CLIENT_ID,
    clientSecret: dashConfig.DASHCORD_CLIENT_SECRET,
    callbackURL: dashConfig.DASHCORD_AUTH_CB,
    scope: ['identify', 'guilds'],
  }, async function(accessToken, refreshToken, profile, cb) {
    cb(null, await User.fromDiscord(accessToken, refreshToken, profile));
  }));

  // other stuff
  app.context({
    flashes: [],
  });
  app.before().exec(async req => {
    req.flashes = req.session.flashes || [];
    req.session.flashes = [];
    req.cameFrom = req.session.cameFrom || '/';
    req.session.cameFrom = '/';
    req.flash = function(str) {
      req.session.flashes.push(str);
    };
    if (req.user) req.profile = await req.user.profile;
  });
  
  return app;
};