'use strict';

const should = require('should');
const Bar = require('./libs/Bar.class');
const Scaff = require('./libs/Scaff.class');
const ObjectsUtils = require('@bonjourjohn/utils').Objects;

describe("Testing Model class", function () {
  this.timeout(10000);
  let MyBar, MyScaff;
  let db;
  const goodparams = {
    "foo": "Foo",
    "bar": true,
    "baz": 23
  };
  const wrongparams = {
    "foo": "Foo",
    "bar": "true",
    "baz": "23"
  };
  const extraparams = {
    "foo": "Foo",
    "bar": true,
    "baz": 23, //extra
    "scaff": {
      "fii": "fou",
      "boo": 23,
      "buu": true //extra
    },
    "arr": [
      {
        "buu": "hoo",
        "moo": true,
        "maa": "extra" //extra
      },
      {
        "buu": "raah",
        "moo": false,
        "puu": 1
      }
    ]
  };

  describe('Test Model.load', () => {
    before("do instanciation and loading good params", () => {
      MyBar = new Bar();
      MyBar.load(goodparams);
    });
    it("should create an object with all properties", () => {
      MyBar.should.have.properties(
        {
          "foo": goodparams.foo,
          "bar": goodparams.bar,
          "baz": goodparams.baz
        }
      );
    });
  });

  describe('Test Model.load with sub objected schema', () => {
    before("do instanciation and loading good params", () => {
      MyScaff = new Scaff();
      MyScaff.load(extraparams);
    });
    it("should create an object with all properties in schema", () => {
      ObjectsUtils.hasProperties(MyScaff, ["foo", "bar", "scaff.fii", "scaff.boo", "arr"]).should.equal(true);
    });
    it("should have returned all properties in sub objects in array", () => {
      for (let subobj of MyScaff.arr) {
        ObjectsUtils.hasProperties(subobj, ["buu", "moo"]).should.equal(true);
      }
    });
    it("should have return array field with all its children", () => {
      MyScaff.arr.length.should.equal(extraparams.arr.length);
    });
    it("should not have returned extra properties", () => {
      ObjectsUtils.hasProperties(MyScaff, ["scaff.buu"]).should.equal(false);
    });
    it("should have not returned extra properties in sub objects in array", () => {
      for (let subobj of MyScaff.arr) {
        ObjectsUtils.hasProperties(subobj, ["maa", "puu"]).should.equal(false);
      }
    });
  });

  describe('Test good instanciation', () => {
    before("do instanciation", () => {
      MyBar = new Bar(goodparams);
    });
    it("should create an object with all properties", () => {
      MyBar.should.have.properties(
        {
          "foo": goodparams.foo,
          "bar": goodparams.bar,
          "baz": goodparams.baz
        }
      );
    });
  });

  describe("Test Model.get", () => {
    describe("Full schema", () => {
      it("should return a full object", () => {
        const get = MyBar.get();
        get.should.have.properties(goodparams);
      });
    });
    describe("Single bject property", () => {
      it("should return a single property", () => {
        MyBar.get("foo").should.equal(goodparams.foo);
      });
    });
  });

  describe('Test bad instanciation', () => {
    it("should throw error", () => {
      (() => {
        MyBar = new Bar(wrongparams);
      }).should.throw()
    });
  });
});
