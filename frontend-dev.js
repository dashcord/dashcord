const {FloofBall, redirect, Floop} = require('floof');
const {middleware} = require('./lib');

const app = middleware(new FloofBall());

app.get('/dev').exec((req, ren) => ren.render('dev/home.html'));

app.get('/dev/dash').exec((req, ren) => {
  if (!req.user) return redirect('/login');
  return ren.render('dev/dash.html');
});

app.get('/dev/dash/:cid').withQuery('p', 'str').exec((req, ren) => {
  
});

app.error().forCodes(400, 600)
  .exec((req, msg, ren) => ren.render('dev/error.html', {code: req.code, msg}));

module.exports = app;