class Maybe {
  constructor(value) {
    this._value = value || null;
  }
  
  map(func) {
    if (this._value !== null) this._value = func(this._value);
    return this;
  }
  
  offer(value) {
    if (this._value === null) this._value = value;
    return this;
  }
  
  or(def) {
    return this._value !== null ? this._value : def;
  }
  
  get unwrap() {
    if (this._value === null) throw new Error('No value present!');
    return this._value;
  }
}

module.exports = {
  maybe(value) {
    return new Maybe(value);
  },
};