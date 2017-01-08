"use strict";

var MongObj = require('./index.js');

var mongoConnection = "mongodb://127.0.0.1/testmongobj";

class ManSchema extends MongObj.Schema{
  get $$collectionName(){ return "men"; }
  get $$mongoConnection(){ return mongoConnection; }
}

class DogSchema extends MongObj.Schema{
  get $$collectionName(){ return "dogs"; }
  get $$mongoConnection(){ return mongoConnection; }

  sayBau() {
    this.$$.dogSays = "bau";
    this.Save();
  }

  get owner() {
    return new MongObj.Link(ManSchema, { /* options */ });
  }
}

console.log(DogSchema.name);

//var testSchema = new MongObj.Schema("ciao").Proxy;
var testDog = new DogSchema().Proxy;

console.log("testDog id: ", testDog._id);
console.log("testDog", testDog._id);

var existingDog = new DogSchema(testDog._id).Proxy;
console.log("existDog id:", existingDog._id);

existingDog.sayBau();
existingDog.owner = {name: "Alessadro", surname: "Magno"};
console.log("existing dog $$", existingDog.$$);

existingDog.Save(()=>{
  let theSameExistingDog = new DogSchema(testDog._id).Proxy;
  console.log('Existing dog owner: ', theSameExistingDog.owner.$$);
});
