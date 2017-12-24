const {FloofBall, redirect, Floop} = require('floof');
const {middleware} = require('./lib');

const app = middleware(new FloofBall());

app.get('/').exec((req, ren) => ren.render('euser/home.html'));

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
});

app.get('/logout').exec(async (req, ren) => {
  await req.logout();
  return redirect('/');
});

app.get('/dash').exec((req, ren) => {
  
});

app.get('/dash/:cid').exec((req, ren) => {
  
});

app.post('/dash/:cid/update').withBody('json').exec((req, ren) => {
  
});

app.error().forCode(404).exec((req, ren) => {
  
});

module.exports = app;