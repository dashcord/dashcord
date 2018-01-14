class Component {
  constructor(data, provider) {
    this.data = data;
    this.provider = provider;
  }
  
  renderDev(ren) {
    return ren.render(`component/${this.provider.id}-dev.html`, {
      data: this.data,
    });
  }
  
  update(data) {
    
  }
  
  renderUser(ren) {
    return ren.render(`component/${this.provider.id}.html`, {
      data: this.data,
    });
  }
  
  get json() {
    return {
      ...this.data,
      id: this.provider.id,
    };
  }
}

class ComponentProvider {
  constructor(id, name, compType = Component) {
    this.id = id;
    this.name = name;
    this.compType = compType;
  }
  
  wrap(data = {}) {
    return new this.compType(data, this);
  }
}

class ComponentRegistry {
  constructor() {
    this.registry = new Map();
  }
  
  register(provider) {
    this.registry.set(provider.id, provider);
  }
  
  get types() {
    return this.registry.values().map(provider => provider.name);
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

module.exports = {compRegistry: new ComponentRegistry(), Component, ComponentProvider};