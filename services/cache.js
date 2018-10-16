const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');

const clientUrl = 'redis://127.0.0.1:6379';
const client = redis.createClient(clientUrl);
client.get = util.promisify(client.get);

const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function() {
  this.useCache = true;
  return this;
};

mongoose.Query.prototype.exec = async function() {
  if (!this.useCache) {
    return exec.apply(this, arguments);
  }

  const key = JSON.stringify(
    Object.assign({}, this.getQuery(), {
      collection: this.mongooseCollection.name
    })
  );

  const cacheValue = await client.get(key);
  if (cacheValue) {
    console.info('cacheValue', cacheValue);
    const parsedCache = JSON.parse(cacheValue);

    return Array.isArray(parsedCache)
      ? parsedCache.map(doc => new this.model(doc))
      : new this.model(parsedCache);
  }

  const result = await exec.apply(this, arguments);
  client.set(key, JSON.stringify(result));
  return result;
};
