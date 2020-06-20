'use strict';

const ObjectId = require('mongodb').ObjectId;
const should = require('should');
const Foo = require('./libs/Foo.class');
const mongoClient = require('./libs/mongoClient');
const Cursor = require('mongodb').Cursor;

describe("Testing cache working with model", function () {
  this.timeout(10000);
  let MyFoo;
  let db;

  let cacheClient;
  const witnessObj = {
    _id: new ObjectId(),
    test: 1,
    name: "test doc"
  };

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
            .then(() => {
              MyFoo.insertOne(witnessObj)
                .then(() => {
                  done();
                })
                .catch(done);
            })
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
        MyFoo.collection.drop()
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
          .catch(done);
      })
      .catch(done)
  });

  describe("findOne", () => {
    let doc;
    before("do findOne", (done) => {
      MyFoo.findOne({"test": 1})
        .then((_doc) => {
          doc = _doc;
          done();
        })
        .catch(done)
    });
    it("should have returned a document", () => {
      should.exist(doc);
    });
    it("should have picked document in db", () => {
      doc.should.not.have.property("_inCache");
    });
  });

  describe("findOne a second time", () => {
    let doc;
    before("do findOne", (done) => {
      MyFoo.findOne({"test": 1})
        .then((_doc) => {
          doc = _doc;
          done();
        })
        .catch(done)
    });
    it("should have return a document", () => {
      should.exist(doc);
    });
    it("should have picked doc in cache", () => {
      doc.should.have.property("_inCache", true);
    });
  });

  describe("findOne a third time skipping cache", () => {
    let doc;
    before("do findOne", (done) => {
      MyFoo.findOne({"test": 1}, {skipCache: true})
        .then((_doc) => {
          doc = _doc;
          done();
        })
        .catch(done)
    });
    it("should have return a document", () => {
      should.exist(doc);
    });
    it("should have picked document in db", () => {
      doc.should.not.have.property("_inCache");
    });
  });

  describe("findOne after update", () => {
    let doc;
    before('do findOneAndUpdate and findOne', (done) => {
      MyFoo.findOneAndUpdate({_id: witnessObj._id}, {$set: {"test": 2}})
        .then(() => {
          MyFoo.findOne({"test": 2})
            .then((_doc) => {
              doc = _doc;
              done();
            })
            .catch(done);
        })
        .catch(done);
    });
    it("should have returned a document", () => {
      should.exist(doc);
    });
    it("should have picked document in db", () => {
      doc.should.not.have.property("_inCache");
    });
  });

  describe("findOne after delete", () => {
    let doc;
    before("do delete and findOne", (done) => {
      MyFoo.findOneAndDelete({_id: witnessObj._id})
        .then((r) => {
          MyFoo.findOne({_id: witnessObj._id})
            .then((_doc) => {
              doc = _doc;
              done();
            })
            .catch(done);
        })
        .catch(done);
    });
    it("should have returned nothing", () => {
      should.not.exist(doc);
    });
  });

  describe("Tests with cache down", () => {
    before("shut cache down", (done) => {
      cacheClient.quit()
        .then(() => {
          done();
        })
        .catch(done);
    });

    it("should have switched MyFoo's useCache property to false", () => {
      MyFoo.useCache.should.equal(false);
    });

    describe("findOne deleted doc when cache is down", () => {
      let doc;
      before("do findOne", (done) => {
        MyFoo.findOne({"test": 1})
          .then((_doc) => {
            doc = _doc;
            done();
          })
          .catch(done)
      });
      it("should have returned nothing", () => {
        should.not.exist(doc);
      });
    });

    describe("findOne reinserted object with cache down", function () {
      before("do insert", function (done) {
        MyFoo.insertOne(
          witnessObj
        )
          .then(() => {
            done();
          })
          .catch(done);
      });

      describe("findOne when cache is down", () => {
        let doc;
        before("do findOne", (done) => {
          MyFoo.findOne({"test": 1})
            .then((_doc) => {
              doc = _doc;
              done();
            })
            .catch(done)
        });
        it("should have return a document", () => {
          should.exist(doc);
        });
        it("should have picked document in db", () => {
          doc.should.not.have.property("_inCache");
        });
      });

      describe("findOne when cache is down a second time", () => {
        let doc;
        before("do findOne", (done) => {
          MyFoo.findOne({"test": 1})
            .then((_doc) => {
              doc = _doc;
              done();
            })
            .catch(done)
        });
        it("should have return a document", () => {
          should.exist(doc);
        });
        it("should have picked document in db", () => {
          doc.should.not.have.property("_inCache");
        });
      });
    });

    describe("Tests with cache up again", () => {
      before("set cache up", (done) => {
        cacheClient.connect()
          .then(() => {
            if (cacheClient.status === "ready") {
              return done();
            } else {
              cacheClient.on('ready', done);
            }
          })
          .catch(done);
      });

      it("should have switched MyFoo's useCache property to true", () => {
        MyFoo.useCache.should.equal(true);
      });

      describe("findOne when cache is up again", () => {
        let doc;
        before("do findOne", (done) => {
          MyFoo.findOne({"test": 1})
            .then((_doc) => {
              doc = _doc;
              done();
            })
            .catch(done)
        });
        it("should have return a document", () => {
          should.exist(doc);
        });
        it("should have picked document in db", () => {
          doc.should.not.have.property("_inCache");
        });
      });

      describe("findOne when cache is up again a second time", () => {
        let doc;
        before("do findOne", (done) => {
          MyFoo.findOne({"test": 1})
            .then((_doc) => {
              doc = _doc;
              done();
            })
            .catch(done)
        });
        it("should have return a document", () => {
          should.exist(doc);
        });
        it("should have picked document in cache", () => {
          doc.should.have.property("_inCache", true);
        });
      });
    });
  });
});