'use strict';

const should = require('should');
const Foo = require('./libs/Foo.class');
const mongoClient = require('./libs/mongoClient');

describe("Testing Collection class", function () {
  this.timeout(10000);
  let MyFoo;
  let db;
  const docToInsert = [
    {
      test: 2,
      name: "test doc 1"
    },
    {
      test: 2,
      name: "test doc 2"
    },
    {
      test: 2,
      name: "test doc 3"
    }
  ];

  before("Create db connection", function (done) {
    mongoClient.init()
      .then((_db) => {
        db = _db;
        MyFoo = new Foo(db);
        MyFoo.init()
          .then(done)
          .catch(done);
      })
      .catch(done);
  });

  after("close connection", function (done) {
    mongoClient.connectionInstance.dropCollection('foo')
      .then(() => {
        mongoClient.close()
          .then(done)
          .catch(done);
      })
      .catch(done);
  });

  describe('Test insertions', () => {
    describe("insertOne", function () {
      let doc;
      before('do insert', (done) => {
        MyFoo.insertOne(
          {
            test: 1,
            name: "test doc"
          }
        )
          .then((wRes) => {
            doc = wRes.ops[0]; //this will fail if write failed
            done();
          })
          .catch(done);
      });

      it("should have returned inserted doc", () => {
        should.exist(doc);
      });
      it("should have added fields createdAt and updatedAt", () => {
        doc.should.have.properties("name", "createdAt", "updatedAt");
      });
      it("createdAt and updatedAt should be equal", () => {
        doc.createdAt.toString().should.equal(doc.updatedAt.toString());
      });
    });

    describe("insertMany", () => {
      let insertedDocs = [];
      before('do insert', (done) => {
        MyFoo.insertMany(docToInsert)
          .then((ret) => {
            insertedDocs = ret.ops;
            done();
          })
          .catch(done);
      });
      it("should add the right number of docs into Foo collection", () => {
        insertedDocs.should.be.instanceOf(Array).and.have.lengthOf(docToInsert.length);
      });
      it("should have added fields createdAt and updatedAt in all docs", () => {
        insertedDocs.forEach((doc) => {
          doc.should.have.properties("createdAt", "updatedAt");
        });
      });
      it("fields createdAt and updatedAt should be equal in all docs", () => {
        insertedDocs.forEach((doc) => {
          doc.createdAt.toString().should.equal(doc.updatedAt.toString());
        });
      });
    });
  });

  describe('Test finding queries', () => {
    describe("findOne", () => {
      let doc;
      before("do findOne", (done) => {
        MyFoo.findOne({"test": 2})
          .then((_doc) => {
            doc = _doc;
            done();
          })
          .catch(done);
      });
      it('should have returned a doc', () => {
        should.exist(doc);
      });
      it('should have return a doc with all properties', () => {
        doc.should.have.properties("test", "name", "createdAt", "updatedAt");
      });
    });

    describe("findOne with projection", () => {
      let doc;
      before("do findOne", (done) => {
        MyFoo.findOne({"test": 2}, {projection: {name: 1}})
          .then((_doc) => {
            doc = _doc;
            done();
          })
          .catch(done)
      });
      it('should have returned a doc', () => {
        should.exist(doc);
      });
      it('should have returned a doc with the projected properties', () => {
        doc.should.have.properties("_id", "name");
      });
      it('should have returned a doc without the occulted properties', () => {
        doc.should.not.have.properties("test", "createdAt", "updatedAt");
      });
    });

    describe("find", () => {
      let docs;
      before("do find", (done) => {
        MyFoo.find({"test": 2})
          .then((_docs) => {
            docs = _docs;
            done();
          })
          .catch(done);
      });
      it('should have returned all docs', () => {
        docs.should.be.instanceOf(Array).and.have.lengthOf(docToInsert.length);
      });
      it('should have returned all props for each record', () => {
        docs.forEach((doc) => {
          doc.should.have.properties("test", "name", "createdAt", "updatedAt");
        });
      })
    });

    describe("find with project", () => {
      let docs;
      before("do find", (done) => {
        MyFoo.find({"test": 2}, {projection: {name: 1}})
          .then((_docs) => {
            docs = _docs;
            done();
          })
          .catch(done);
      });
      it('should have returned all docs', () => {
        docs.should.be.instanceOf(Array).and.have.lengthOf(docToInsert.length);
      });
      it('should have returned all projected props for each record', () => {
        docs.forEach((doc) => {
          doc.should.have.properties("name");
        });
      });
      it('should not have returned non projected props for each record', () => {
        docs.forEach((doc) => {
          doc.should.not.have.properties("test", "createdAt", "updatedAt");
        });
      });
    });
  });

  describe('Test updates', () => {
    let intermediateUpdatedAt;

    describe("findOneAndUpdate", () => {
      let doc;
      before('do update', (done) => {
        MyFoo.findOneAndUpdate({test: 1}, {$set: {"test": 3, "updated": true}})
          .then((ret) => {
            doc = ret;
            done();
          })
          .catch(done);
      });
      it("should return doc with all fields", () => {
        doc.should.have.properties("test", "name", "createdAt", "updatedAt", "updated");
      });
      it("should have added field `update`", () => {
        doc.should.have.property("updated", true);
      });
      it("should have updated field `test`", () => {
        doc.test.should.equal(3);
      });
      it("should have not moved field `name`", () => {
        doc.name.should.equal("test doc");
      });
      it("should have updated field `updatedAt`", () => {
        doc.updatedAt.should.be.greaterThan(doc.createdAt);
        intermediateUpdatedAt = doc.updatedAt;
      });
    });

    describe("updateMany", () => {
      let ret;
      before('do update', (done) => {
        MyFoo.updateMany({test: 2}, {$set: {"test": 4, "updated": true}})
          .then(() => {
            done();
          })
          .catch(done);
      });
      describe('check updated docs in db', () => {
        let docs;
        before('get docs in db', (done) => {
          MyFoo.find({"test": 4})
            .then((_docs) => {
              docs = _docs;
              done();
            })
            .catch(done);
        });
        it("should have return the right number of docs", () => {
          docs.should.be.instanceOf(Array).and.have.lengthOf(docToInsert.length);
        });
        it("should have return the updated values", () => {
          docs.forEach((doc) => {
            doc.should.have.properties({
              "test": 4,
              "updated": true
            });
          });
        });
        it("should have updated updatedAt fields", () => {
          docs.forEach((doc) => {
            doc.updatedAt.should.be.greaterThan(intermediateUpdatedAt);
          });
        })
      });
    });

    describe("findOneAndUpdate upserting a non existing doc", () => {
      let doc;
      before('do update', (done) => {
        MyFoo.findOneAndUpdate({test: 5}, {$set: {"name": "upserted doc", "updated": true}}, {upsert: true})
          .then((ret) => {
            doc = ret;
            done();
          })
          .catch(done);
      });
      it("should return doc with all fields", () => {
        doc.should.have.properties("test", "name", "createdAt", "updatedAt", "updated");
      });
      it("should have field `update`", () => {
        doc.should.have.property("updated", true);
      });
      it("should have field `test`", () => {
        doc.should.have.property('test', 5);
      });
      it("should have field `name`", () => {
        doc.should.have.property('name', "upserted doc");
      });
      it("should have fields `createdAt` and `updatedAt`", () => {
        doc.should.have.properties("createdAt", "updatedAt");
      });
      it("createdAt and updatedAt should be equal", () => {
        doc.updatedAt.toString().should.equal(doc.createdAt.toString());
      });
    });
  });
});