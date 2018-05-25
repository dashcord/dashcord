const {FloofBall, redirect, Floop} = require('floof');
const {middleware, masters, guildDb, norm} = require('./lib');

const app = middleware(new FloofBall());

app.get('/').exec((req, ren) => ren.render('euser/home.html'));

app.get('/login').exec(async (req, ren) => {
  req.session.cameFrom = req.header('referer') || '/';
  const result = await req.authenticate('discord');
  if (result.status === 'redirect') {
    return result.redirect;
  }
  throw new Floop(500);
});

app.get('/login/cb').exec(async (req, ren) => {
  const result = await req.authenticate('discord');
  if (result.status !== 'success') {
    req.flash('Login failed! Please try again...');
  } else {
    req.flash('Logged in successfully!')
  }
  return redirect(req.cameFrom);
});

app.get('/logout').exec(async (req, ren) => {
  await req.logout();
  req.flash('Logged out successfully!');
  return redirect(req.header('referer') || '/');
});

app.get('/dash').exec(async (req, ren) => {
  if (!req.user) return redirect('/login');
  const ownedGuilds = (await req.user.guilds).filter(g => req.user.isManager(g));
  return ren.render('euser/dash.html', {guilds: ownedGuilds});
});

app.get('/dash/:gid').exec(async (req, ren) => {
  if (!req.user) return redirect('/login');
  if (!req.gid) throw new Floop(400, 'No server specified!');
  const guild = (await req.user.guilds).find(g => g.id === req.gid);
  if (!guild) throw new Floop(404, 'You\'re not in that server!');
  if (!req.user.isManager(guild)) throw new Floop(403, 'You\'re not a manager for that server!');
  const data = await (await guildDb.getOrCreate(guild.id)).find({});
  const bots = await Promise.all(data.map(async datum => await masters.bots.findOne({_id: datum._id})));
  return ren.render('euser/guild.html', {guild, bots});
});

app.get('/dash/:gid/:cid').withQuery('p', 'int').exec(async (req, ren) => {
  if (!req.user) return redirect('/login');
  if (!req.gid) throw new Floop(400, 'No server specified!');
  const pageNum = req.p || 0;
  if (pageNum < 0) throw new Floop(400, 'Invalid page number!');
  const guild = (await req.user.guilds).find(g => g.id === req.gid);
  if (!guild) throw new Floop(404, 'You\'re not in that server!');
  if (!req.user.isManager(guild)) throw new Floop(403, 'You\'re not a manager for that server!');
  const bot = norm('bot', await masters.bots.findOne({_id: req.cid}));
  if (!bot) throw new Floop(404, 'That bot doesn\'t exist!');
  const datum = await (await guildDb.getOrCreate(guild.id)).find({_id: req.cid});
  if (!datum) throw new Floop(404, 'That bot\'s not in that server!');
});

app.post('/dash/:gid/:cid/update').withBody('json').exec(async (req, ren) => {
  req.backing.jsonResponse = true;
  if (!req.user) return redirect('/login');
  if (!req.gid) throw new Floop(400, 'No server specified!');
  const guild = (await req.user.guilds).find(g => g.id === req.gid);
  if (!guild) throw new Floop(404, 'You\'re not in that server!');
  if (!req.user.isManager(guild)) throw new Floop(403, 'You\'re not a manager for that server!');
  const bot = norm('bot', await masters.bots.findOne({_id: req.cid}));
  if (!bot) throw new Floop(404, 'That bot doesn\'t exist!');
  const datum = await (await guildDb.getOrCreate(guild.id)).find({_id: req.cid});
  if (!datum) throw new Floop(404, 'That bot\'s not in that server!');
  
});

app.error().forCodes(400, 600)
  .exec((req, msg, ren) => req.backing.jsonResponse
        ? {code: req.code, msg} : ren.render('euser/error.html', {code: req.code, msg}));

module.exports = app;