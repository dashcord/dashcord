const {guildDb} = require('./database.js');
const Monad = require('./monad.js');

class Interface {
  get(key) {
    return Monad.maybe(null);
  }
  
  set(key, value) {
    // NO-OP
  }
  
  commit() {
    // NO-OP
  }
  
  isValid() {
    return true;
  }
  
  destroy() {
    // NO-OP
  }
  
  static get(bId, gId) {
    return new InterfaceImpl(bId, gId);
  }
}

Interface.noop = new Interface();

class InterfaceImpl extends Interface {
  constructor(bId, gId) {
    super();
    this.botId = bId;
    this.guildId = gId;
    this.updateQueue = [];
  }
  
  get _guildDb() {
    return guildDb.getOrCreate(this.guildId);
  }
  
  async get(key) {
    const entry = await (await this._guildDb).findOne({_id: this.botId});
    return entry ? Monad.maybe(entry.body[key]) : Monad.maybe();
  }
  
  ask(key) {
    this.updateQueue.push(key);
  }
  
  async receive() {
    const entry = await (await this._guildDb).findOne({_id: this.botId});
    const result = {};
    if (entry) {
      for (const key of this.updateQueue) result[key] = Monad.maybe(entry.body[key]);
    }
    this.updateQueue = [];
    return result;
  }
  
  set(key, value) {
    this.updateQueue.push([key, value]);
  }
  
  unset(key) {
    this.updateQueue.push([key]);
  }
  
  async commit() {
    const update = {$set: {}, $unset: {}};
    for (const entry of this.updateQueue) {
      if (entry.length === 2) {
        update.$set[`body.${entry[0]}`] = entry[1];
      } else {
        update.$unset[`body.${entry[0]}`] = true;
      }
    }
    this.updateQueue = [];
    await (await this._guildDb).update({_id: this.botId}, update, {upsert: true});
  }
  
  async isValid() {
    return (await (await this._guildDb).count({_id: this.botId})) > 0;
  }
  
  async destroy() {
    await (await this._guildDb).remove({_id: this.botId});
  }
}

module.exports = Interface;