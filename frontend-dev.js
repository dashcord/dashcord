const {FloofBall, redirect, Floop} = require('floof');
const {middleware, masters, botDb, generateToken,
       newBotRecord, updateBot, norm} = require('./lib');
const {isWebUri} = require('valid-url');

const app = middleware(new FloofBall());

app.get('/dev').exec((req, ren) => ren.render('dev/home.html'));

app.get('/dev/dash').exec(async (req, ren) => {
  if (!req.user) return redirect('/login');
  const bots = await masters.bots.find({owner: req.user.id});
  return ren.render('dev/dash.html', {bots});
});

app.post('/dev/new').withBody('json').exec(async (req, ren) => {
  if (!req.user) throw new Floop(401);
  const body = await req.body();
  if (!body.id) throw new Floop(400);
  if (body.id.length < 3 || body.id.length > 16) {
    return {status: 'error', error: 'Identifier must be between 3 and 16 characters!'};
  }
  if (!/^[a-z0-9]+$/.test(body.id)) {
    return {status: 'error', error: 'Identifier can only have lowercase alphanumeric characters!'};
  }
  if (await masters.bots.count({_id: body.id}) > 0) {
    return {status: 'error', error: `A bot already exists with the identifier "${body.id}"!`};
  }
  if (await masters.bots.count({owner: req.user.id}) >= 1) { // TODO make this mutable
    return {status: 'error', error: 'You\'ve reached your bot limit!'};
  }
  await masters.bots.insert(newBotRecord(body.id, req.user.id));
  req.flash(`Successfully created ${body.id}!`);
  return {status: 'success', redirect: `/dev/dash/${body.id}`};
});

const pages = ['general', 'controls', 'api', 'webhooks'];
app.get('/dev/dash/:cid').withQuery('p', 'str').exec(async (req, ren) => {
  if (!req.user) return redirect('login');
  const bot = norm('bot', await masters.bots.findOne({_id: req.cid}));
  if (!bot) throw new Floop(404, `There's no bot called "${req.cid}"!`);
  if (bot.owner !== req.user.id) throw new Floop(403, 'You don\'t own that bot!');
  if (!req.p) req.p = 'general';
  if (!pages.includes(req.p)) throw new Floop(404);
  return ren.render(`dev/bot/${req.p}.html`, {page: req.p, bot})
});

app.post('/dev/dash/:cid/update').withBody('form').exec(async (req, ren) => {
  if (!req.user) throw new Floop(401);
  const bot = await masters.bots.findOne({_id: req.cid});
  if (!bot) throw new Floop(404);
  if (bot.owner !== req.user.id) throw new Floop(403);
  let u;
  try {
    u = await req.body();
  } catch (e) {
    if (e instanceof URIError) {
      req.flash('Only ASCII characters are supported as of now!');
      return redirect(`/dev/dash/${bot._id}`);
    }
    throw e;
  }
  const invalid = updateBot(norm('bot', bot), u);
  if (invalid.length) {
    for (const error of invalid) req.flash(error);
  } else {
    await masters.bots.update({_id: bot._id}, bot);
    req.flash(`Successfully updated ${bot.name}!`);
  }
  return redirect(`/dev/dash/${bot._id}`);
});

app.get('/dev/dash/:cid/delete').exec(async (req, ren) => {
  if (!req.user) return redirect('login');
  const bot = await masters.bots.findOne({_id: req.cid});
  if (!bot) throw new Floop(404, `There's no bot called "${req.cid}"!`);
  if (bot.owner !== req.user.id) throw new Floop(401, 'You don\'t own that bot!');
  await masters.bots.remove({_id: bot._id});
  await botDb.drop(bot._id);
  req.flash(`Successfully deleted ${bot.name}!`);
  return redirect('/dev/dash');
});

app.post('/dev/dash/:cid/retoken').withBody('form').exec(async (req, ren) => {
  if (!req.user) throw new Floop(401);
  const bot = await masters.bots.findOne({_id: req.cid});
  if (!bot) throw new Floop(404);
  if (bot.owner !== req.user.id) throw new Floop(403);
  const newToken = generateToken();
  await masters.bots.update({_id: bot._id}, {$set: {token: newToken}});
  req.flash(`Successfully regenerated token for ${bot.name}!`);
  return redirect(`/dev/dash/${bot._id}?p=api`);
});

const whEvents = ['change', 'add', 'remove'];
app.post('/dev/dash/:cid/updatehooks').withBody('form').exec(async (req, ren) => {
  if (!req.user) throw new Floop(401);
  const bot = norm('bot', await masters.bots.findOne({_id: req.cid}));
  if (!bot) throw new Floop(404);
  if (bot.owner !== req.user.id) throw new Floop(403);
  bot.webhooks = [];
  const body = await req.body(), invalid = [];
  let success = false, lengthErr = false;
  for (const key in body) {
    if (key.length && body.hasOwnProperty(key)) {
      const url = decodeURIComponent(key);
      if (!isWebUri(url)) {
        invalid.push(`Invalid webhook URL "${url}"!`);
      } else if (url.length > 64) {
        lengthErr = true;
      } else if (!whEvents.includes(body[key])) {
        throw new Floop(400);
      } else {
        bot.webhooks.push({url: url, event: body[key]});
        success = true;
      }
    }
  }
  // edge case for when all hooks are removed
  if (!bot.webhooks.length) success = true;
  for (const error of invalid) req.flash(error);
  if (lengthErr) req.flash('Webhook URLs must be at most 64 characters!');
  if (success) {
    await masters.bots.update({_id: bot._id}, bot);
    req.flash(`Successfully updated webhooks for ${bot.name}!`);
  }
  return redirect(`/dev/dash/${bot._id}?p=webhooks`);
});

app.error().forCodes(400, 600)
  .exec((req, msg, ren) => ren.render('dev/error.html', {code: req.code, msg}));

module.exports = app;