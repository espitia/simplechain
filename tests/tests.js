/**
 * TESTS
 * Comment and uncomment to test out different functionality
 */

const BlockchainClass = require('../Classes/Blockchain.js')
const BlockClass = require('../Classes/Block.js')

// INITIATE AN INSTANCE OF THE BLOCKCHAIN
let blockchain = new BlockchainClass.Blockchain()

// PRODUCE BLOCKS OF MOCK DATA
var x = 0;
function addBlocks() {
    setTimeout(function () {
        let blockTest = new BlockClass.Block("Test Block - " + (x + 1));
        blockchain.addBlock(blockTest).then((result) => {
            console.log(result);
            console.log('\n\n\n');
        });
        if (x <= 10) { x++; addBlocks(); }
    }, 1000);
} 

// ADD MOCK DATA
// addBlocks()

// ADDING A BLOCK
// blockchain.addBlock(new BlockClass.Block('satoshi - 2009')).then(newBlock => { console.log(`new block has been added!`)}).catch(error => console.log(error))

// RETREIVING BLOCKS
// blockchain.getBlock(0).then(block => console.log(`Block retreived: \n`, block)).catch(error => console.log(error))

// GETTING CURRENT BLOCK HEIGHT
// blockchain.getBlockHeight().then(height => console.log(`Block height is: ${height}`)).catch(error => console.log(error))

// VALIDATING SPECIFIC BLOCKS
// blockchain.validateBlockAtHeight(0).then(success => console.log(`Block was validated: ${success}`)).catch(error => console.log(error))

// VALIDATING ENTIRE CHAIN
// blockchain.validateChain().then(success => console.log(`Chain was validated: ${success}`)).catch(error => console.log(error))
