/* ===== Persist data with LevelDB ===================================
|  Learn more: level: https://github.com/Level/level     |
|  =============================================================*/

const level = require('level');
const chainDB = './chaindata';
const db = level(chainDB, { valueEncoding: 'json'});


// Add data to levelDB with key/value pair
function addLevelDBData(key,value){
  return new Promise((resolve, reject) => {
    db.put(key, value, function(err) {
      if (err) return reject(err);
      resolve()
    })
  })

}

// Get data from levelDB with key
function getLevelDBData(key){
  return new Promise ((resolve, reject) => {
    db.get(key, function(err, value) {
      if (err) reject(err);
      // console.log('Value = ' + value);
      resolve(value);
    })
  })

}

// Add data to levelDB with value
function addDataToLevelDB(value) {
  return new Promise((resolve, reject) => {
    let i = 0;
    db.createReadStream().on('data', function(data) {
          i++;
        }).on('error', function(err) {
            console.log('Unable to read data stream!', err)
            reject(err)
        }).on('close', function() {
          // console.log('Block #' + i);
          addLevelDBData(i, value)
            .then(resolve(value))
        });
  })
}

// find blocks that have a given address as their body.address field
function getBlocksWithAddress(_address) {
  return new Promise((resolve, reject) => {
    let i = 0;
    let results = []
    db.createReadStream().on('data', function(data) {
          i++;
          if (data.value.body.address == _address) results.push(data.value)
        }).on('error', function(err) {
          console.log('Unable to read data stream!', err)
          reject(err)
        }).on('close', function() {
          if (results.length == 0) reject(Error('No blocks were found for given address.'))
          resolve(results)
        });
  })  
}

// find blocks that have a given address as their body.address field
function getBlockWithHash(_hash) {
  return new Promise((resolve, reject) => {
    let i = 0;
    var block;
    db.createReadStream().on('data', function(data) {
          i++;
          if (data.value.hash == _hash) block = data.value
        }).on('error', function(err) {
          console.log('Unable to read data stream!', err)
          reject(err)
        }).on('close', function() {
          if (block) resolve(block)
          reject(Error('No block was found with given hash. Make sure you have a valid hash.'))
        });
  })  
}

function getBlockHeight() {
  return new Promise ((resolve, reject) => {
    let i = 0
    db.createReadStream().on('data', function(data) {
      i++;
      }).on('error', function(err) {
          console.log('Unable to read data stream!', err)
          reject(err)
      }).on('close', function() {
        // console.log('Block #' + i);
        resolve(i - 1)
      });
  })
}

module.exports.getBlockHeight = getBlockHeight;
module.exports.getLevelDBData = getLevelDBData;
module.exports.addDataToLevelDB = addDataToLevelDB;
module.exports.getBlocksWithAddress = getBlocksWithAddress;
module.exports.getBlockWithHash = getBlockWithHash;

/* ===== Testing ==============================================================|
|  - Self-invoking function to add blocks to chain                             |
|  - Learn more:                                                               |
|   https://scottiestech.info/2014/07/01/javascript-fun-looping-with-a-delay/  |
|                                                                              |
|  * 100 Milliseconds loop = 36,000 blocks per hour                            |
|     (13.89 hours for 500,000 blocks)                                         |
|    Bitcoin blockchain adds 8640 blocks per day                               |
|     ( new block every 10 minutes )                                           |
|  ===========================================================================*/


// (function theLoop (i) {
//   setTimeout(function () {
//     addDataToLevelDB('Testing data');
//     if (--i) theLoop(i);
//   }, 100);
// })(10);
