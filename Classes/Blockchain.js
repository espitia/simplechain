
const SHA256 = require('crypto-js/sha256');
const db = require('../levelSandbox.js')
const BlockClass = require('./Block.js')


/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain{
    constructor() {
      this.getBlockHeight()
          .then(blockHeight => {
              if (blockHeight == -1) {
                  this.addBlock(new BlockClass.Block("First block in the chain - Genesis block"));
                  console.log(`Genesis block has been created!`)
              }
          })
  }

    // Add new block
    async addBlock(newBlock) {
      try {
          // Block height
          let blockHeight = await db.getBlockHeight();
          newBlock.height = blockHeight + 1;

          //UTC timestamp
          newBlock.time = new Date().getTime().toString().slice(0,-3);

          // previous block hash
          if (newBlock.height > 0) {
              let lastBlock = await db.getLevelDBData(blockHeight)
              newBlock.previousBlockHash = lastBlock.hash;
          }
          // Block hash with SHA256 using newBlock and converting to a string
          newBlock.hash = SHA256(JSON.stringify(newBlock)).toString()

          // add new block to db
          return db.addDataToLevelDB(newBlock)

      } catch (error) {
          throw new Error(error.message)
      }
    }

  async getBlockHeight() {
      try {
          return db.getBlockHeight()
      } catch(error) {
          throw new Error(error.message)
      }
  }


  // get block
  async getBlock(blockHeight){
    // return object as a single string
          try {
              let block = await db.getLevelDBData(blockHeight)
              block.body.star.storyDecoded = hexDecode(block.body.star.story)
              return block;
          } catch (error) {
              throw new Error(error.message)
          }
  }

  // validate block using block height
  async validateBlockAtHeight(blockHeight){
          try {
              // get block to validate
              let block = await this.getBlock(blockHeight)
              return this.validateBlock(block)
          } catch (error) {
              throw new Error(error.message)
          }
  }

  // validate block
  validateBlock(block) {
      //get block hash of block to validateBlock
      let blockHash = block.hash

      // remove hash to hash contents before adding hash property
      block.hash = ''

      // generate block hash
      let validBlockHash = SHA256(JSON.stringify(block)).toString();

      // Compare
      if (blockHash === validBlockHash) {
              block.hash = blockHash; // reset block hash
              return true;
          } else {
              throw new Error('Block #'+block.height+' has an invalid hash:\n'+blockHash+'<>'+validBlockHash);
          }
  }

     // Validate blockchain
  async validateChain() {
      try {
          //get chain of blocks
          let blockHeight = await this.getBlockHeight()
          let promises = []
          for (let i = 0; i <= blockHeight; i++) { promises.push(this.getBlock(i)) }
          let chain = await Promise.all(promises)

          // loop through all blocks to validate
          for (var x = 0; x <= chain.length; x++) {

              // check if all blocks have been validated (to be able to resolve promise)
              if (x == chain.length) return true;

              // check integrity of block
              if (!(this.validateBlock(chain[x]))) {
                  throw new Error(`block #${x} is invalid`)
              }
              // check that hash of block is the 'previousHash' for next block
              if (chain[x+1]) { // make sure there is a "next block" to check its previousHash property
                  let blockHash = chain[x].hash;
                  let previousHash = chain[x+1].previousBlockHash;
                  if (blockHash!== previousHash) throw new Error(`block #${x}'s hash does not match up to block #${x+1}'s 'previousBlockHash'`)
              }

          }
      } catch(error) {
          throw new Error(error.message)
      }
  }
    async getBlocksWithAddress(_address) {
        try {
            let blocks = await db.getBlocksWithAddress(_address)
            blocks.forEach(block => {
				block.body.star.storyDecoded = hexDecode(block.body.star.story)
			})
        } catch (error) {
            throw new Error(error.message)
        }
    }

    async getBlockWithHash(_hash) {
        try {
            let block = await db.getBlockWithHash(_hash)
            block.body.star.storyDecoded = hexDecode(block.body.star.story)
            return block
        } catch (error) {
            throw new Error(error.message)
        }
    }
}

/* ===== UTILITIES =====*/

function hexEncode(r){
    var hex, i;
    var result = "";
    for (i=0; i<this.length; i++) {
        hex = r.charCodeAt(i).toString(16);
        result += ("000"+hex).slice(-4);
    }
    return result
}


function hexDecode(hex){
	var hex = hex.toString();//force conversion
	var str = '';
	for (var i = 0; i < hex.length; i += 2)
		str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
	return str;
}




module.exports.Blockchain = Blockchain