const {FloofBall, redirect, Floop} = require('floof');
const SessionPlugin = require('floof-session');
const PassportPlugin = require('floof-passport');
const {Strategy} = require('passport-discord');
const {User, userSerialization, dashConfig} = require('./lib');

let s = require('floof').Stoof;
let c = s.prototype.cookie;
s.prototype.cookie = function(...args) {
  console.log('cookie called', args);
  return c.apply(this, args);
};

const app = new FloofBall();
app.plugin(new SessionPlugin(dashConfig.DASHCORD_SECRET));
const pp = new PassportPlugin(true, userSerialization);
app.plugin(pp)

pp.use(new Strategy({
  clientID: dashConfig.DASHCORD_CLIENT_ID,
  clientSecret: dashConfig.DASHCORD_CLIENT_SECRET,
  callbackURL: dashConfig.DASHCORD_AUTH_CB,
  scope: ['identify', 'guilds'],
}, async function(accessToken, refreshToken, profile, cb) {
  cb(null, await User.fromDiscord(accessToken, refreshToken, profile));
}));

app.context({
  flashes: [],
});
app.before().exec(req => {
  req.flashes = req.session.flashes || [];
  req.session.flashes = [];
  req.flash = function(str) {
    req.session.flashes.push(str);
  };
});

app.get('/').exec(async (req, ren) => {
  const ctx = {};
  if (req.user) {
    ctx.profile = await req.user.profile;
    ctx.guilds = await req.user.guilds;
  }
  return ren.render('test.html', ctx);
});

app.get('/bots').exec((req, ren) => {
  
});

app.get('/login').exec(async (req, ren) => {
  const result = await req.authenticate('discord');
  if (result.status === 'redirect') {
    return result.redirect;
  }
  throw new Floop(500);
});

app.get('/login/cb').exec(async (req, ren) => {
  const result = await req.authenticate('discord');
  if (result.status !== 'success') {
    req.flash('Authentication failed! Please try again.');
  }
  return redirect('/');
})

app.get('/dash').exec((req, ren) => {
  
});

app.get('/dash/:cid').exec((req, ren) => {
  
});

app.post('/dash/:cid/update').withBody('json').exec((req, ren) => {
  
});

app.error().forCode(404).exec((req, ren) => {
  
});

module.exports = app;