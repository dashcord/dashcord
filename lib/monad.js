class Maybe {
  constructor(value) {
    this._value = value || null;
  }
  
  map(func) {
    if (this._value !== null) this._value = func(this._value);
    this._checkNull();
    return this;
  }
  
  offer(value) {
    if (this._value === null) this._value = value;
    this._checkNull();
    return this;
  }
  
  or(def) {
    return this._value !== null ? this._value : def;
  }
  
  get unwrap() {
    if (this._value === null) throw new Error('No value present!');
    return this._value;
  }
  
  get jsonify() {
    return this._value !== null ? {present: true, value: this._value} : {present: false};
  }
  
  _checkNull() {
    if (isNaN(this._value) || this._value === undefined) this._value = null;
  }
}

module.exports = {
  maybe(value) {
    return new Maybe(value);
  },
};