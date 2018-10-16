const cache = require('../services/cache');

module.exports = async (req, res, next) => {
  await next();

  cache.clearHash(req.user.id);
};
