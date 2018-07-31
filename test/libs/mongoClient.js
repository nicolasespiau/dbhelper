'use strict';

const MongoClient = require('mongodb').MongoClient;

module.exports = {
  connectionInstance: null,
  client: null,
  async init() {
    //if already we have a connection, don't connect to database again
    if (this.connectionInstance) {
      return this.connectionInstance;
    }

    this.client = await new MongoClient.connect("mongodb://localhost:27017");
    this.connectionInstance = await this.client.db("foodb");

    return this.connectionInstance;
  },

  async close() {
    if (!this.client) {
      throw new Error("There is no client to close.");
    }
    await this.client.close();
    this.connectionInstance = false;
  }
};