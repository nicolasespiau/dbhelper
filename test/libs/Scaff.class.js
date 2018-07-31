'use strict';

const Model = require('../../lib/Model.class');

module.exports = class Foo extends Model {
  constructor(params) {
    const schema = {
      "foo": String,
      "bar": Boolean,
      "scaff": {
        "fii": String,
        "boo": Number
      },
      "arr": [
        {
          "buu": String,
          "moo": Boolean
        }
      ]
    };
    super(schema, params);
  }
};
