const {FloofBall, redirect, Floop} = require('floof');
const {middleware, masters, botDb, generateToken,
       newBotRecord, updateBot, norm, layouts, compRegistry} = require('./lib');
const {isWebUri} = require('valid-url');

const app = middleware(new FloofBall());

app.get('/dev').exec((req, ren) => ren.render('dev/home.html'));

app.get('/dev/dash').exec(async (req, ren) => {
  if (!req.user) return redirect('/login');
  const bots = await masters.bots.find({owner: req.user.id});
  return ren.render('dev/dash.html', {bots});
});

app.post('/dev/new').withBody('json').exec(async (req, ren) => {
  req.backing.jsonResponse = true;
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
  if (!req.user) return redirect('/login');
  const bot = norm('bot', await masters.bots.findOne({_id: req.cid}));
  if (!bot) throw new Floop(404, `There's no bot called "${req.cid}"!`);
  if (bot.owner !== req.user.id) throw new Floop(403, 'You don\'t own that bot!');
  if (!req.p) req.p = 'general';
  if (!pages.includes(req.p)) throw new Floop(404);
  return ren.render(`dev/bot/${req.p}.html`, {page: req.p, bot})
});

app.post('/dev/dash/:cid/update').withBody('form').exec(async (req, ren) => {
  req.backing.jsonResponse = true;
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
  if (!req.user) return redirect('/login');
  const bot = await masters.bots.findOne({_id: req.cid});
  if (!bot) throw new Floop(404, `There's no bot called "${req.cid}"!`);
  if (bot.owner !== req.user.id) throw new Floop(401, 'You don\'t own that bot!');
  await masters.bots.remove({_id: bot._id});
  await botDb.drop(bot._id);
  req.flash(`Successfully deleted ${bot.name}!`);
  return redirect('/dev/dash');
});

app.post('/dev/dash/:cid/retoken').withBody('form').exec(async (req, ren) => {
  req.backing.jsonResponse = true;
  if (!req.user) throw new Floop(401);
  const bot = await masters.bots.findOne({_id: req.cid});
  if (!bot) throw new Floop(404);
  if (bot.owner !== req.user.id) throw new Floop(403);
  const newToken = generateToken();
  await masters.bots.update({_id: bot._id}, {$set: {token: newToken}});
  req.flash(`Successfully regenerated token for ${bot.name}!`);
  return redirect(`/dev/dash/${bot._id}?p=api`);
});

const whEvents = ['change'];
app.post('/dev/dash/:cid/updatehooks').withBody('form').exec(async (req, ren) => {
  req.backing.jsonResponse = true;
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
  if (bot.webhooks.length > 3) {
    bot.webhooks = bot.webhooks.slice(0, 3);
    req.flash('Only 3 webhooks are allowed at this time!');
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

app.post('/dev/dash/:cid/updatepages').withBody('form').exec(async (req, ren) => {
  req.backing.jsonResponse = true;
  if (!req.user) throw new Floop(401);
  const bot = norm('bot', await masters.bots.findOne({_id: req.cid}));
  if (!bot) throw new Floop(404);
  if (bot.owner !== req.user.id) throw new Floop(403);
  const body = await req.body();
  const keys = Object.keys(body);
  if (keys.length > 4) throw new Floop(400);
  // edge case for when all pages are deleted
  if (keys.length === 1 && body[""] === "") {
    bot.pages = [];
  } else {
    const pages = new Array(keys.length);
    for (const key of keys) {
      const index = parseInt(key, 10);
      if (isNaN(index) || index >= pages.length || index < 0 || !!pages[index]) {
        throw new Floop(400);
      }
      pages[index] = body[key];
    }
    const seen = new Set();
    bot.pages = pages.map(p => {
      if (p.startsWith('!')) {
        const name = p.substring(1);
        if (name.length < 1 || name.length > 32) throw new Floop(400);
        return {
          title: p.substring(1),
          subtitle: '',
          icon: 'settings',
          layout: 'full',
          data: {},
        };
      } else {
        const index = parseInt(p, 10);
        if (!bot.pages[index] || seen.has(index)) throw new Floop(400);
        seen.add(index);
        return bot.pages[index];
      }
    });
  }
  await masters.bots.update({_id: bot._id}, bot);
  req.flash(`Successfully updated dashboard pages for ${bot.name}!`);
  return redirect(`/dev/dash/${bot._id}?p=controls`);
});

app.get('/dev/dash/:cid/page/:i').exec(async (req, ren) => {
  if (!req.user) return redirect('/login');
  const bot = norm('bot', await masters.bots.findOne({_id: req.cid}));
  if (!bot) throw new Floop(404, `There's no bot called "${req.cid}"!`);
  if (bot.owner !== req.user.id) throw new Floop(403, 'You don\'t own that bot!');
  const page = bot.pages[req.i];
  if (!page) throw new Floop(404, `Couldn't find page at index ${req.i}!`);
  return ren.render('dev/bot/page.html', {bot, page, layouts});
});

app.post('/dev/dash/:cid/page/:i').withBody('form').exec(async (req, ren) => {
  req.backing.jsonResponse = true;
  if (!req.user) throw new Floop(401);
  const bot = norm('bot', await masters.bots.findOne({_id: req.cid}));
  if (!bot) throw new Floop(404);
  if (bot.owner !== req.user.id) throw new Floop(403);
  const page = bot.pages[req.i];
  if (!page) throw new Floop(404);
  const index = bot.pages.indexOf(page);
  const body = await req.body();
  if (!body.hasOwnProperty('title')
      || !body.hasOwnProperty('subtitle')
      || !body.hasOwnProperty('icon')
      || !body.hasOwnProperty('layout')) {
    throw new Floop(400, 'Missing parameters');
  }
  if (body.title.length < 1 || body.title.length > 32) throw new Floop(400, 'Bad title');
  if (body.subtitle.length > 64) throw new Floop(400, 'Bad subtitle');
  if (body.icon.length > 24 || !/^[\w-]*$/.test(body.icon)) throw new Floop(400, 'Bad icon');
  if (!layouts.hasOwnProperty(body.layout)) throw new Floop(400, 'Bad layout');
  bot.pages[index] = {
    title: body.title,
    subtitle: body.subtitle,
    icon: body.icon,
    layout: body.layout,
    data: body.layout !== page.layout ? {} : page.data,
  };
  masters.bots.update({_id: bot._id}, bot);
  req.flash(`Successfully updated page ${page.title} for ${bot.name}!`);
  return redirect(`/dev/dash/${bot._id}/page/${index}`)
});

app.get('/dev/dash/:cid/page/:i/layout').exec(async (req, ren) => {
  if (!req.user) return redirect('/login');
  const bot = norm('bot', await masters.bots.findOne({_id: req.cid}));
  if (!bot) throw new Floop(404, `There's no bot called "${req.cid}"!`);
  if (bot.owner !== req.user.id) throw new Floop(403, 'You don\'t own that bot!');
  const page = bot.pages[req.i];
  if (!page) throw new Floop(404, `Couldn't find page at index ${req.i}!`);
  const layout = await layouts[page.layout].render(ren, page);
  return ren.render('dev/bot/layout.html', {bot, page, layout, types: compRegistry.registry.values()});
});

app.post('/dev/dash/:cid/page/:i/layout').withBody('json').exec(async (req, ren) => {
  req.backing.jsonResponse = true;
  if (!req.user) throw new Floop(401);
  const bot = norm('bot', await masters.bots.findOne({_id: req.cid}));
  if (!bot) throw new Floop(404);
  if (bot.owner !== req.user.id) throw new Floop(403);
  const page = bot.pages[req.i];
  if (!page) throw new Floop(404);
  const body = await req.body();
  if (!Array.isArray(body) || body.length !== layouts[page.layout].comps) throw new Floop(400);
  const wrapped = new Array(layouts[page.layout].comps);
  for (let i = 0; i < wrapped.length; i++) {
    if (page.comps[i] && page.comps[i].type === body[i].type) {
      wrapped[i] = compRegistry.resolve(page.comps[i]);
      try {
        wrapped[i].update(body[i]);
      } catch (e) {
        throw new Floop(400, e.message);
      }
    } else {
      try {
        wrapped[i] = compRegistry.resolve(body[i]);
      } catch (e) {
        throw new Floop(400, e.message);
      }
      if (!wrapped[i]) throw new Floop(400, 'Invalid component type');
    }
  }
  page.comps = wrapped.map(comp => comp.json);
  masters.bots.update({_id: bot._id}, bot);
  req.flash(`Successfully updated page ${page.title} for ${bot.name}!`);
});

app.get('/dev/dash/:cid/page/:i/layout/:j').withQuery('t', 'str').exec(async (req, ren) => {
  req.backing.jsonResponse = true;
  if (!req.user) throw new Floop(401);
  const bot = norm('bot', await masters.bots.findOne({_id: req.cid}));
  if (!bot) throw new Floop(404, 'Bot not found');
  if (bot.owner !== req.user.id) throw new Floop(403);
  const page = bot.pages[req.i];
  if (!page) throw new Floop(404, 'Page not found');
  let comp = page.comps[req.j];
  if (!comp) {
    if (req.t) {
      comp = compRegistry.create(req.t);
      if (!comp) throw new Floop(400);
    } else {
      throw new Floop(404, 'Component not found');
    }
  } else if (req.t && req.t !== comp.type) {
    comp = compRegistry.create(req.t);
  } else {
    comp = compRegistry.resolve(comp);
  }
  return await comp.renderDev(ren);
});

app.error().forCodes(400, 600)
  .exec((req, msg, ren) => req.backing.jsonResponse
        ? {code: req.code, msg} : ren.render('dev/error.html', {code: req.code, msg}));

module.exports = app;