## Simple Chain

Project for the Udacity Blockchain Nanodegree course.

## Getting Started

To get started, clone the repo `https://github.com/espitia/simplechain.git` and `npm install` to install dependencies. You can then run the chain:
```node simpleChain.js```
Your chain will now be deployed to a loca server on port `8000` when you can use the endpoints detailed in the endpoints section below. To add mockdata and test functionality, please review the Testing section below.

### Prerequisites

Installing Node and NPM is pretty straightforward using the installer package available from the (Node.js® web site)[https://nodejs.org/en/].

### Configuring your project

Make sure to install dependencies. To build the RESTful API, we are using the following libraries:
- express
- body-parser

Other dependencies include:
- level
- crypto-js


## Testing

Within the `tests.js`, you can test functionality by commenting/uncommenting the functions below. Simply comment/uncomment and run `node tests.js`:

Add dummy blocks:
```
addBlocks()
```
Adding a block:
```
blockchain.addBlock(new BlockClass.Block('satoshi - 2009'))
```
Retreiving blocks:
```
blockchain.getBlock(blockHeightToRetrieve)
```
Getting current block height:
```
blockchain.getBlockHeight()
```
Validating specific blocks:
```
blockchain.validateBlockAtHeight(0)
```
Validating entire chain:
```
blockchain.validateChain()
```

## Endpoints

**POST Endpoints**

Request validation of your address to be able to add stars to the blockchain. With a successful response, you will have a time window of 5 minutes to validate ownership (see below)

```
POST /requestValidation
```
*parameters:*
```
{
   "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ"
}
```

Validate ownership by providing a message signature with your address:

```
POST /message-signature/validate
```
*parameters:*
```
{
  "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
  "signature": "H6ZrGrF0Y4rMGBMRT2+hHWGbThTIyhBS0dNKQRov9Yg6GgXcHxtO9GJN4nwD2yNXpnXHTWU9i+qdw5vpsooryLU="
}
```

Once validated, add stars to the blockchain:

```
POST /block
```
*parameters:*
```
{
  "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
  "star": {
    "dec": "-26° 29'\'' 24.9",
    "ra": "16h 29m 1.0s",
    "story": "Found star using https://www.google.com/sky/"
  }
}
```
**GET Endpoints**

Get a star block given the block height:

```
GET /block/:blockHeight
```
Get a star block using hash of block:
```
/stars/hash:hash
```
Get a star block using a wallet address:
```
/stars/address:walletAddress
```
