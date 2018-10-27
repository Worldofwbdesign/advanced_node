const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');
const keys = require('../config/keys');

const client = redis.createClient(keys.redisUrl);
client.hget = util.promisify(client.hget);

const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function(options = {}) {
  this.useCache = true;
  this.hashKey = JSON.stringify(options.key || '');

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

  console.info('this.hashKey', this.hashKey);
  const cacheValue = await client.hget(this.hashKey, key);
  if (cacheValue) {
    console.info('cacheValue', cacheValue);
    const parsedCache = JSON.parse(cacheValue);

    return Array.isArray(parsedCache)
      ? parsedCache.map(doc => new this.model(doc))
      : new this.model(parsedCache);
  }

  const result = await exec.apply(this, arguments);
  console.info('this.hashKey', this.hashKey);
  client.hset(this.hashKey, key, JSON.stringify(result), 'EX', 3600);
  return result;
};

module.exports = {
  clearHash(key) {
    client.del(JSON.stringify(key));
  }
};
