const {ComponentProvider, Component} = require('../component.js');
const deps = require('../component-deps.json');

module.exports = new ComponentProvider('gauge', 'Gauge', class ComponentGauge extends Component {
  contextualize(ifc) {
    return {
      src: this.data.src,
      value: ifc.get(this.data.src).map(parseFloat).or(0),
      min: this.data.min,
      max: this.data.max,
      title: this.data.title,
      unit: this.data.unit,
    };
  }
  
  update(data, validate) {
    if (validate) {
      Component.checkData(data.src);
      if (typeof data.min !== 'number') throw new Error('Minimum value must be a valid number!');
      if (typeof data.max !== 'number') throw new Error('Maximum value must be a valid number!');
      if (data.title.length > 16) throw new Error('Title must be at most 16 characters!');
      if (data.unit.length > 16) throw new Error('Unit must be at most 16 characters!');
    }
    this.data.src = data.src;
    this.data.min = data.min;
    this.data.max = data.max;
    this.data.title = data.title;
    this.data.unit = data.unit;
  }
  
  get dependencies() {
    return [deps.raphael, deps.justgage];
  }
});