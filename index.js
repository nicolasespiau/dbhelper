'use strict';

//define Mongo's ObjectId as a default var type
global.ObjectId = require('mongodb').ObjectId;

const Cache = require('./lib/cacheClient');
const Model = require('./lib/Model.class');
const Collection = require('./lib/Collection.class');

module.exports = {
  Cache,
  Model,
  Collection
};
