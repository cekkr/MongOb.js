# MongOb.js

> MongOb.js is the simplest concept for a MongoDB ORM

## Installation
```sh
$ npm install git+https://github.com/cekkr/MongOb.js.git --save
```
Is required ES6 support

### Usage
First of all call MongOb.js in your code:
```javascript
var MongObj = require('mongob.js');
```
Then extends his schema class for define object structure for a collection
```javascript
class ManSchema extends MongObj.Schema{
  get $$collectionName(){ return "men"; }
  get $$mongoConnection(){ return "mongodb://127.0.0.1/testmongobj"; }
}
```
All internal properties for MongObj have as prefix the double $, except for Proxy and Save
Then you can create new object with an istance

```javascript
var newMan = new ManSchema();
console.log('New man object id:', newMan._id);
```

You can load an object having his ID:
```javascript
var loadMan = new ManSchema(newMan._id).Proxy;
```
Proxy property returns same object with property getter and setter traps. This allow you to handle the object 'as is':
```javascript
loadMan.name = "Perla";
loadMan.surname = "Miseria";
loadMan.Save(); // You can watch changes in your collection
```

You can also link nested structures from another collections:
```javascript
var mongoConnection = "mongodb://127.0.0.1/testmongobj"; //You can centralize parameters
class DogSchema extends MongObj.Schema{
  get $$collectionName(){ return "dogs"; }
  get $$mongoConnection(){ return mongoConnection; }

  sayBau() {
    this.$$.dogSays = "bau"; //$$ is the main mongo object
    this.Save();
  }

  get owner() {
    return new MongObj.Link(ManSchema, { /* options */ });
  }
}

//Test code
var testDog = new DogSchema().Proxy;

testDog.sayBau();
testDog.owner = {name: "Alessadro", surname: "Magno"};
console.log('testDog $$:', testDog.$$);

existingDog.Save((err, res)=>{
  let theSameExistingDog = new DogSchema(testDog._id).Proxy;
  console.log(testDog owner:', theSameExistingDog.owner.$$);
});
//Watch results
```

`First commit ever. Work in progress...`