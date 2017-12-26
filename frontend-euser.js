const {FloofBall, redirect, Floop} = require('floof');
const {middleware} = require('./lib');

const app = middleware(new FloofBall());

app.get('/').exec((req, ren) => ren.render('euser/home.html'));

app.get('/bots').exec((req, ren) => {
  
});

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

app.get('/dash').exec((req, ren) => {
  
});

app.get('/dash/:id').exec((req, ren) => {
  
});

app.get('/dash/:id/:gid').exec((req, ren) => {
  
});

app.post('/dash/:id/:gid/update').withBody('json').exec((req, ren) => {
  
});

app.error().forCodes(400, 600)
  .exec((req, msg, ren) => ren.render('euser/error.html', {code: req.code, msg}));

module.exports = app;