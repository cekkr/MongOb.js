// Riccardo Cecchini 2017 (rcecchini.ds@gmail.com)
// Maybe in future support to TypeScript inhertance?

'use strict';

const ObjectID = require('mongodb').ObjectID;
const MongoClient = require('mongodb').MongoClient;
const deasync = require('deasync');
const ASQ = require('asynquence');

class Schema {
  constructor(findOne, callback) {
    this.$$nestedObjects = {};

    if(typeof findOne === 'string') findOne = {_id: ObjectID(findOne)};
    this.$$findOne = findOne;
  }

  ///
  /// Settings
  ///
  get $$settings(){
    return {
      collectionName: this.$$collectionName,
      mongoConnection: this.$$mongoConnection
    }
  }

  get $$collectionName(){
    return "default";
  }

  get $$mongoConnection(){
    return "mongodb://127.0.0.1/testmongobj";
  }

  ///
  /// To override
  ///
  $$onNewObject(){
    return {};
  }

  ///
  /// Reserved keywords
  ///
  get Proxy(){
    return this.$P = getProxySchema(this);
  }

  Save(callback){
    if(!callback) callback = function(){};

    this.$$checkObject();
    this.$$collection.update({_id: this.$$._id}, {$set: this.$$}, callback);

    for(var no in this.$$nestedObjects)
      this.$$nestedObjects[no].Save();
  }

  ///
  /// Mongo calls
  ///
  $$checkObject(){
    if(!this.$$object){
      let completed = false;
      this.$$getObject((err, resp)=>{
        if(err)
          throw err;

        completed = true;
      });

      require('deasync').loopWhile(function(){return !completed;});
    }
  }

  $$wrapObject(obj){
    console.log(obj);
    for(var p of obj){
      Object.defineProperty(obj, p, {
        value: 'static'
      });
    }
  }

  $$getObject(callback, findOne){
    let that = this;
    findOne = findOne || this.$$findOne

    if(!findOne){
      let _id = new ObjectID();

      ASQ((done) => {
        // connect
        that.$$getCollection(done.errfcb);

      }).then((done, collection) => {
        collection.insert(mergeProperties(that.$$onNewObject(), {_id: _id}), done.errfcb);

      }).then((done, obj) => {
        that.$$object = this.$$ = {_id: _id};

        callback(null, that.$$object);
        done();

      }).or((err) => {
        callback(err);
      });
    }
    else{
      ASQ((done) => {
        // connect
        that.$$getCollection(done.errfcb);

      }).then((done, collection) => {
        collection.findOne(findOne, done.errfcb);

      }).then((done, obj) => {
        that.$$object = this.$$ = obj;
        //that.$$wrapObject(obj);

        callback(null, obj);
        done();

      }).or((err) => {
        callback(err);
      });
    }
  }

  $$getCollection(callback, contextName) {
    contextName = contextName || this.$$settings.collectionName;

    let that = this;
    if(!that.$$collections)
      that.$$collections = {};

    if(that.$$collections[contextName])
      callback(null, that.$$collections[contextName]);
    else {
      let that = this;
      ASQ((done) => {
        // connect
        that.$$getConnection(done.errfcb);

      }).then((done, db) => {
        // get collection
        db.collection(contextName, done.errfcb);

      }).then((done, collection) => {
        that.$$collections[contextName] = collection;
        if(contextName == this.$$settings.collectionName) that.$$collection = collection;

        // return
        callback(null, collection);
        done();

      }).or((err) => {
        callback(err);
      });
    }
  }

  $$getConnection(callback){
    let that = this;

    if(that.$$connection)
      onComplete(null, that.$$connection);
    else{
      MongoClient.connect(that.$$settings.mongoConnection, (err, res)=>{
        if(err) callback(err);
        else {
          that.$$connection = res;
          callback(null, res);
        }
      });
    }
  }

  ///
  /// Basic Mongo object properties
  ///
  get _id(){
    this.$$checkObject();
    return this.$$object._id;
  }

}

class Link{
  constructor(schema, settings){
    this.schema = schema;
    this.settings = settings;
  }

  getObject(target, name){
    if(name == "owner")
      console.log("ciao");

    var obj;
    target.$$checkObject();
    if(target.$$[name]){
      obj = new this.schema(target.$$[name]);
    }
    else{
      obj = new this.schema();
      target.$$[name] = obj._id;
    }

    target.$$nestedObjects[obj._id] = obj;
    return obj.Proxy;
  }
}

module.exports = {
  Schema: Schema,
  Link: Link
};

/*var istanceWrapper = function(f, args) {
  return function() {
    f.apply(this, args);
  };
};*/

function mergeProperties(var1, var2){
  var ret = {};
  for(var p in var1)
    ret[p] = var1[p];
  for(var p in var2)
    ret[p] = var2[p];

  return ret;
}

function getProxySchema(target){
  return new Proxy(target,{
    get: function(obj, name){

      if(obj[name]){
        var ret = obj[name];

        if(typeof ret === "object" && ret.constructor.name === "Link")
          return ret.getObject(obj, name);
        else
          return ret;
      }
      else {
        obj.$$checkObject();
        if (obj.$$[name]) {
          return obj.$$[name];
        }
        else
          return undefined;
      }
    },
    set: function(obj, name, value) {
      var ret = obj[name];

      if(name=='$$')
        obj.$$ = mergeProperties(value, obj.$$);
      else if(ret && typeof ret === "object" && ret.constructor.name === "Link"){
          var pret = ret.getObject(target, name);

          if(typeof value === "object")
            pret.$$ = mergeProperties(value, pret.$$);
          else
            throw new Error("Can't assign an value object to link");

      }
      else {
        obj.$$checkObject();
        obj.$$[name] = value;
      }

      return true;
    },
    construct: function(obj, argumentsList, newTarget) {
      //console.log(obj, newTarget);
      //return getProxySchema(new (Function.prototype.bind.apply(obj, [null].concat(argumentsList))));
    }
  });
}
