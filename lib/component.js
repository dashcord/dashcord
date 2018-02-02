class Component {
  constructor(data, provider) {
    this.data = {};
    this.provider = provider;
    this.type = this.provider.id;
    this.update(data);
  }
  
  contextualize() {
    return {};
  }
  
  renderDev(ren) {
    return ren.render(`component/${this.provider.id}-dev.html`, {
      data: this.data,
      ...this.contextualize(),
    });
  }
  
  update(data) {
    throw new Error('No implementation!');
  }
  
  renderUser(ren) {
    return ren.render(`component/${this.provider.id}.html`, {
      data: this.data,
      ...this.contextualize(),
    });
  }
  
  get json() {
    return {
      ...this.data,
      type: this.provider.id,
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

const mdRen = new (require('showdown').Converter)(), xss = require('xss');
compRegistry.register(new ComponentProvider('markdown', 'Markdown', class ComponentMarkdown extends Component {
  contextualize() {
    return {
      unrenderedMd: this.data.md,
      renderedMd: xss(mdRen.makeHtml(this.data.md)),
    };
  }
  
  update(data) {
    this.data.md = data.md;
  }
}));

module.exports = {compRegistry, Component, ComponentProvider};