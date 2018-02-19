//const {} = require('./database.js');
const Monad = require('./monad.js');

class Interface {
  get(key) {
    return Monad.maybe(null);
  }
  
  set(key, value) {
    // NO-OP
  }
  
  static get(bId, gId) {
    return new InterfaceImpl(bId, gId);
  }
}

Interface.noop = new Interface();

class InterfaceImpl extends Interface {
  constructor(bId, gId) {
    // TODO Implement
  }
  // TODO Implement
}

module.exports = Interface;