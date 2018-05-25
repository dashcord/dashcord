const {masters} = require('./database.js');
const {request, UseCached} = require('./request.js');
const dashConfig = require('./config.js');
const {logs} = require('./logs.js');

const userCache = new Map();
const endpoints = {
  user: 'https://discordapp.com/api/users/@me',
  guilds: 'https://discordapp.com/api/users/@me/guilds',
};
const cacheDuration = 30 * 60 * 1000;

class User {
  static async fromDiscord(accessToken, refreshToken, profile) {
    const user = await User.fromId(profile.id, false);
    user.accessToken = accessToken;
    user.refreshToken = refreshToken;
    await user.write();
    return user;
  }
  
  static async fromId(id, write = true) {
    let user = userCache.get(id);
    if (!user) {
      user = await masters.users.findOne({_id: id});
      if (user) {
        user = new User(user._id, user);
        userCache.set(user.id, user);
      } else {
        user = new User(id);
        userCache.set(id, user);
        if (write) await user.write();
      }
    }
    return user;
  }
  
  static cache(users) {
    for (const user of users) {
      userCache.set(user._id, new User(user._id, user));
    }
  }
  
  constructor(id, user = {}) {
    this.id = id;
    this.accessToken = user.accessToken || null;
    this.refreshToken = user.refreshToken || null;
    this.cache = {times: {}};
  }
  
  isManager(guild) {
    return guild.owner || (guild.permissions & 8) || (guild.permissions & 32);
  }
  
  async write() {
    await masters.users.update({_id: this.id}, this.json, {
      upsert: true,
    });
  }
  
  get profile() {
    return this._cachingRequest('profile', endpoints.user);
  }
  
  get guilds() {
    return this._cachingRequest('guild', endpoints.guilds);
  }
  
  async _cachingRequest(name, url) {
    const now = Date.now(), time = this.cache.times[name];
    if (!time || now - time >= cacheDuration) {
      logs.info(`${this.id} => ${url}: cache expired`);
      this.cache.times[name] = now;
      return this.cache[name] = await this._oauthRequest(name, url);
    }
    return this.cache[name];
  }
  
  async _oauthRequest(name, url) {
    try {
      return await request.get(url, {
        json: true,
        auth: {
          bearer: this.accessToken,
        },
      });
    } catch (e) {
      if (e instanceof UseCached) {
        logs.warn(`${this.id} => ${url}: cache refresh failed`);
        return this.cache[name];
      }
      throw e;
    }
  }
  
  get json() {
    return {
      _id: this.id,
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
    };
  }
}

const userSerialization = {};
userSerialization.serialize = function(user) {
  return user.id;
};
userSerialization.deserialize = async function(id) {
  return await User.fromId(id);
};

module.exports = {User, userSerialization};