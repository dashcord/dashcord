const {ComponentProvider, Component} = require('../component.js');
const deps = require('../component-deps.json');

const validOptions = new Set(['backgroundColor', 'borderColor', 'borderWidth', 'pointBackgroundColor', 'pointBorderColor']);

module.exports = new ComponentProvider('graph', 'Graph', class ComponentGauge extends Component {
  contextualize(ifc) {
    return {
      src: this.data.src,
      title: this.data.title,
      options: this.data.options,
      data: ifc.get(this.data.src),
    };
  }
  
  update(data, validate) {
    if (validate) {
      Component.checkData(data.src);
      if (data.title.length > 16) throw new Error('Title must be at most 16 characters!');
      for (const key of Object.keys(data.options)) {
        if (!validOptions.has(key)) throw new Error(`No such field ${key}!`);
      }
    }
    this.data.src = data.src;
    this.data.title = data.title;
    this.data.options = data.options || {};
  }
  
  get dependencies() {
    return [deps.chartjs];
  }
});