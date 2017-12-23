const config = new Proxy({}, {
  get(target, key) {
    if (!process.env[key]) throw new Error(`Missing env var ${key}!`);
    return process.env[key];
  }
});

module.exports = config;