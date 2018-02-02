const {compRegistry} = require('./component.js');

const defaultComp = compRegistry.create('markdown');

class Layout {
  constructor(id, name, comps) {
    this.id = id;
    this.name = name;
    this.comps = comps;
  }
  
  render(ren, data) {
    while (data.comps.length < this.comps) data.comps.push(defaultComp);
    return ren.render(`layout/${this.id}.html`, {data});
  }
}

const layouts = {
  full: new Layout('full', 'Full-Page Pane', 1),
  half: new Layout('half', 'Half-Page Panes', 2),
  hq: new Layout('hq', 'Half-Page Pane + Quarter Page Panes', 3),
  qh: new Layout('qh', 'Quarter-Page Panes + Half-Page Pane', 3),
  quarter: new Layout('quarter', 'Quarter-Page Panes', 4),
};

module.exports = {Layout, layouts};