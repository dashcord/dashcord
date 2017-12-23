const {botDb} = require('./database.js');

const guildCache = new Map();

class Guild {
  static fromId(id, props) {
    let guild = guildCache.get(id);
    if (!guild) guildCache.set(id, guild = new Guild(id));
    if (props) guild.update(props);
    return guild;
  }
  
  constructor(id) {
    this.id = id;
  }
  
  update(props) {
    
  }
}

module.exports = {Guild};