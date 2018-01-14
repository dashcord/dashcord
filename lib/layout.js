const {compRegistry} = require('./component.js');

class Layout {
  constructor(id, name, comps) {
    this.id = id;
    this.name = name;
    this.comps = comps;
  }
  
  renderDev(ren, data) {
    return ren.render(`/layout/${this.id}-dev.html`, {data});
  }
  
  renderUser(ren, data) {
    return ren.render(`/layout/${this.id}.html`, {data});
  }
  
  verify(data) {
    if (!data.comps) return false;
    const cleaned = {
      comps: [],
    };
    for (let i = 0; i < this.comps && i < data.comps.length; i++) {
      const comp = compRegistry.resolve(data.comps[i]);
      if (!comp) return false;
      cleaned.comps.push(comp);
    }
    return cleaned;
  }
}

class ConfigLayout {
  constructor() {
    super('config', 'Configuration', -1);
  }
  
  verify(data) {
    // TODO verify config layout
  }
}

const layouts = {
  full: new Layout('full', 'Full-Page Pane'),
  half: new Layout('half', 'Half-Page Panes'),
  hq: new Layout('hq', 'Half-Page Pane + Quarter Page Panes'),
  qh: new Layout('qh', 'Quarter-Page Panes + Half-Page Pane'),
  quarter: new Layout('quarter', 'Quarter-Page Panes'),
  config: new ConfigLayout(),
};

module.exports = {Layout, layouts};