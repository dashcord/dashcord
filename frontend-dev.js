const {FloofBall} = require('floof');

const app = new FloofBall();

app.get('/dev').exec((req, ren) => {
  
});

app.get('/dev/dash').exec((req, ren) => {
  
});

app.get('/dev/dash/:cid').withQuery('p', 'str').exec((req, ren) => {
  
});

module.exports = app;