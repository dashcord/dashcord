const {FloofBall, Floop} = require('floof');
const {masters, Interface} = require('./lib');

const app = new FloofBall();

app.before().when(req => req.cid).exec(async req => {
  const token = req.header('Authorization');
  if (!token) throw new Floop(401, 'No authentication!');
  const bot = await masters.bots.findOne({_id: req.cid});
  if (!bot) throw new Floop(404, 'No such bot!');
  if (token !== bot.token) throw new Floop(403, 'Unauthorized!');
  req.bot = bot;
});

app.get('/api').exec((req, ren) => 'Hello, world!');

app.get('/api/bot/:cid').exec((req, ren) => {
  if (!req.bot) throw new Floop(400, 'No bot specified!');
  return {
    id: req.bot._id,
    owner: req.bot.owner,
    name: req.bot.name,
    subtitle: req.bot.subtitle,
    webstie: req.bot.website,
    invite: req.bot.invite,
  };
});

app.get('/api/bot/:cid/guild/:gid').withQuery('fields', 'str').exec(async (req, ren) => {
  if (!req.bot) throw new Floop(400, 'No bot specified!');
  if (!req.fields) throw new Floop(400, 'No fields requested!');
  const ifc = Interface.get(req.bot._id, req.gid);
  if (!(await ifc.isValid())) throw new Floop(404, 'No such guild!');
  for (const field of req.fields.split(',')) ifc.ask(field);
  const result = await ifc.receive();
  for (const key of Object.keys(result)) result[key] = result[key].jsonify;
  return result;
});

app.post('/api/bot/:cid/guild/:gid').withBody('json').exec(async (req, ren) => {
  if (!req.bot) throw new Floop(400, 'No bot specified!');
  const ifc = Interface.get(req.bot._id, req.gid);
  const body = await req.body();
  for (const [key, value] of Object.entries(body)) ifc.set(key, value);
  await ifc.commit();
});

app.delete('/api/bot/:cid/guild/:gid').exec(async (req, ren) => {
  if (!req.bot) throw new Floop(400, 'No bot specified!');
  const ifc = Interface.get(req.bot._id, req.gid);
  if (!(await ifc.isValid())) throw new Floop(404, 'No such guild!');
  await ifc.destroy();
});

app.error().forCodes(400, 600)
  .exec((req, msg, ren) => ({code: req.code, msg}));

module.exports = app;