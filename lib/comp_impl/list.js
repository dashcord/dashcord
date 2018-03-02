const {ComponentProvider, Component} = require('../component.js');

module.exports = new ComponentProvider('list', 'List', class ComponentGauge extends Component {
  contextualize(ifc) {
    return {
      src: this.data.src,
      data: ifc.get(this.data.src),
      title: this.data.title,
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
});