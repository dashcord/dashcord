const {ComponentProvider, Component} = require('../component.js');
const xss = require('xss');
const mdRen = new (require('showdown').Converter)();

module.exports = new ComponentProvider('markdown', 'Markdown', class ComponentMarkdown extends Component {
  contextualize(ifc) {
    return {
      unrenderedMd: this.data.md,
      renderedMd: xss(mdRen.makeHtml(this.data.md)),
    };
  }
  
  update(data, validate) {
    this.data.md = data.md;
  }
});