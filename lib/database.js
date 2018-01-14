const Store = require('nedb');
const fs = require('fs');
const crypto = require('crypto');
const {isWebUri} = require('valid-url');

function open(fname) {
  return new Promise((res, rej) => {
    const store = new Store({filename: fname});
    store.loadDatabase(err => {
      if (err) {
        rej(err);
      } else {
        res(new Proxy(store, {
          get(target, prop) {
            const value = target[prop];
            if (value instanceof Function) {
              return (...args) => new Promise((res, rej) => {
                value.call(target, ...args, (err, result) => {
                  if (err) {
                    rej(err);
                  } else {
                    res(result);
                  }
                });
              });
            }
            return value;
          },
        }));
      }
    });
  });
}

const masters = {
  users: null,
  bots: null,
};

function generateToken() {
  return crypto.randomBytes(24).toString('hex');
}

function newBotRecord(id, owner) {
  return norm('bot', {
    _id: id,
    owner: owner,
    name: id,
    token: generateToken(),
  });
}

function norm(type, rec) {
  if (!rec) return rec;
  switch (type) {
    case 'user':
      // do nothing for now
      break;
    case 'bot':
      if (!rec.subtitle) rec.subtitle = '';
      if (!rec.website) rec.website = '';
      if (!rec.invite) rec.invite = '';
      if (!rec.webhooks) rec.webhooks = [];
      if (!rec.pages) rec.pages = [];
      break;
  }
  return rec;
}

function updateBot(bot, u) {
  const invalid = [];
  if (u.name !== undefined) {
    if (u.name.length < 1 || u.name.length > 16) {
      invalid.push('Bot name must be between 1 and 16 characters!');
    }
    bot.name = u.name;
  }
  if (u.subtitle !== undefined) {
    if (u.name.length > 140) {
      invalid.push('Subtitle must be at most 140 characters!');
    }
    bot.subtitle = u.subtitle;
  }
  if (u.website !== undefined) {
    if (u.website) {
      if (u.website.length > 64) {
        invalid.push('Website URL must be at most 64 characters!');
      } else if (!isWebUri(u.website)) {
        invalid.push('Invalid website URL!');
      }
    }
    bot.website = u.website;
  }
  if (u.invite !== undefined) {
    if (u.invite) {
      if (u.invite.length > 64) {
        invalid.push('Invitation link must be at most 64 characters!');
      } else if (!isWebUri(u.invite)) {
        invalid.push('Invalid invitation link!');
      }
    }
    bot.invite = u.invite;
  }
  return invalid;
}

class BotDatabase {
  constructor() {
    this.dbs = new Map();
  }
  
  async getOrCreate(id) {
    return this.dbs.get(id) || await this._load(id);
  }
  
  async _load(id) {
    const store = await open(`botdata/${id}.db`);
    this.dbs.set(id, store);
    return store;
  }
  
  async drop(id) {
    const store = this.dbs.get(id);
    if (store != null) {
      fs.unlinkSync(`botdata/${id}.db`);
      this.dbs.delete(id);
    }
  }
}
const botDb = new BotDatabase();

async function initDatabase() {
  masters.users = await open('users.db');
  masters.bots = await open('bots.db');
  const bots = await masters.bots.find({}, {cid: 1});
  for (const bot of bots) {
    botDb._load(bot._id);
  }
}

module.exports = {masters, botDb, initDatabase, generateToken, newBotRecord, updateBot, norm};