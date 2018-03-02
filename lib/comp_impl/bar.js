const {ComponentProvider, Component} = require('../component.js');
const deps = require('../component-deps.json');

module.exports = new ComponentProvider('bar', 'Bar Chart', class ComponentGauge extends Component {
  contextualize(ifc) {
    return {
      src: this.data.src,
      title: this.data.title,
      data: ifc.get(this.data.src),
    };
  }
  
  update(data, validate) {
    if (validate) {
      Component.checkData(data.src);
      if (data.title.length > 16) throw new Error('Title must be at most 16 characters!');
    }
    this.data.src = data.src;
    this.data.title = data.title;
  }
  
  get dependencies() {
    return [deps.chartjs];
  }
});