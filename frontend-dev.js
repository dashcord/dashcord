const {FloofBall, redirect, Floop} = require('floof');
const {middleware} = require('./lib');

const app = middleware(new FloofBall());

app.get('/dev').exec((req, ren) => ren.render('dev/home.html'));

app.get('/dev/dash').exec((req, ren) => {
  
});

app.get('/dev/dash/:cid').withQuery('p', 'str').exec((req, ren) => {
  
});

module.exports = app;