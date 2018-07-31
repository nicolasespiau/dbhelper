'use strict';

const Model = require('../../lib/Model.class');

module.exports = class Foo extends Model {
  constructor(params) {
    const schema = {
      "foo": String,
      "bar": Boolean,
      "baz": Number
    };
    super(schema, params);
  }
};
