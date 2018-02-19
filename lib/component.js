const Interface = require('./data.js');

class Component {
  constructor(data, provider, init = true) {
    this.data = {};
    this.provider = provider;
    this.type = this.provider.id;
    this.update(data, !init);
  }
  
  contextualize(ifc) {
    return {};
  }
  
  renderDev(ren) {
    return ren.render(`component/${this.provider.id}-dev.html`, {
      data: this.data,
      ...this.contextualize(Interface.noop),
    });
  }
  
  update(data, validate) {
    throw new Error('No implementation!');
  }
  
  renderUser(ren, bot, gId) {
    return ren.render(`component/${this.provider.id}.html`, {
      data: this.data,
      ...this.contextualize(Interface.get(bot._id, gId)),
    });
  }
  
  get dependencies() {
    return [];
  }
  
  get json() {
    return {
      ...this.data,
      type: this.provider.id,
    };
  }
  
  static checkData(id) {
    if (!/^\w{1,16}$/.test(id)) {
      throw new Error('Data entry ID must be between 1 and 16 alphanumeric characters');
    }
  }
}

class ComponentProvider {
  constructor(id, name, compType = Component) {
    this.id = id;
    this.name = name;
    this.compType = compType;
  }
  
  wrap(data) {
    return new this.compType(data || {}, this, !data);
  }
}

class ComponentRegistry {
  constructor() {
    this.registry = new Map();
  }
  
  register(provider) {
    this.registry.set(provider.id, provider);
  }
  
  create(type) {
    const provider = this.registry.get(type);
    return provider ? provider.wrap() : null;
  }
  
  resolve(comp) {
    if (!comp) return comp;
    const provider = this.registry.get(comp.type);
    return provider ? provider.wrap(comp) : null;
  }
}

const compRegistry = new ComponentRegistry();

module.exports = {compRegistry, Component, ComponentProvider};