const Store = require('nedb');

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

class BotDatabase {
  constructor() {
    this.dbs = new Map();
  }
  
  async load(id) {
    const store = await open(`botdata/${id}.db`);
    this.dbs.set(id, store);
    return store;
  }
  
  drop(id) {
    const store = this.dbs.get(id);
    if (store != null) {
      store.dropDatabase();
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
    botDb.load(bot.id);
  }
}

module.exports = {masters, botDb, initDatabase};