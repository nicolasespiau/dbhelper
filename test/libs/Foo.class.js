'use strict';

const Collection = require('../../lib/Collection.class');

module.exports = class Foo extends Collection {
  constructor(dbInstance, cacheClient) {
    super(dbInstance, 'foo', cacheClient);
  }
};
