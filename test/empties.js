'use strict';

const should = require('should');
const Foo = require('./libs/Foo.class');
const mongoClient = require('./libs/mongoClient');

describe("Testing Collection class", function () {
  this.timeout(10000);
  let MyFoo;
  let db;
  let cacheClient;

  before("Create db connection", function (done) {
    delete require.cache[require.resolve('./libs/mongoClient')];
    delete require.cache[require.resolve('../lib/cacheClient')];

    cacheClient = require('../lib/cacheClient')();
    cacheClient.once('ready', () => {
      mongoClient.init()
        .then((_db) => {
          db = _db;
          MyFoo = new Foo(db, cacheClient);
          MyFoo.init()
            .then(done)
            .catch(done);
        })
        .catch(done);
    });
  });

  after("close connection", function (done) {
    if (cacheClient.status !== "ready") {
      cacheClient.connect();
    }
    cacheClient.flushall()
      .then(() => {
        Promise.all(
          [mongoClient.close(), cacheClient.end()]
        )
          .then(() => {
            delete require.cache[require.resolve('./libs/mongoClient')];
            delete require.cache[require.resolve('../lib/cacheClient')];
            done();
          })
          .catch(done);
      })
      .catch(done)
  });

  describe('Test find queries with empty results', () => {
    describe("findOne", () => {
      let doc;
      before("do findOne", (done) => {
        MyFoo.findOne({"test": 3})
          .then((_doc) => {
            doc = _doc;
            done();
          })
          .catch(done);
      });
      it('should have returned null', () => {
        should.not.exist(doc);
      });
    });
    describe("findOne again", () => {
      let doc;
      before("do findOne", (done) => {
        MyFoo.findOne({"test": 3})
          .then((_doc) => {
            doc = _doc;
            done();
          })
          .catch(done);
      });
      it('should have returned null', () => {
        should.exist(doc);
      });
      it('should have returned an empty document', () => {
        doc.should.eql(MyFoo.emptyDocument);
      })
    });
  });
});