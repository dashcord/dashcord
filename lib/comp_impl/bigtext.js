const {ComponentProvider, Component} = require('../component.js');

module.exports = new ComponentProvider('bigtext', 'Big Text', class ComponentGauge extends Component {
  contextualize(ifc) {
    return {
      src: this.data.src,
      data: ifc.get(this.data.src),
      title: this.data.title,
      icon: this.data.icon,
    };
  }
  
  update(data, validate) {
    if (validate) {
      Component.checkData(data.src);
      if (data.title.length > 16) throw new Error('Title must be at most 16 characters!');
      if (data.icon.length > 24 || !/^[\w-]*$/.test(data.icon)) throw new Floop(400, 'Invalid icon!');
    }
    this.data.src = data.src;
    this.data.title = data.title;
    this.data.icon = data.icon;
  }
});