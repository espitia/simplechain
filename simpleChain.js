
const BlockClass = require('./Classes/Block.js')
const BlockchainClass = require('./Classes/Blockchain.js')
const SHA256 = require('crypto-js/sha256');
const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');

const bodyParser = require('body-parser');
const express = require('express')
const app = express()
const port = 8000;
app.use(bodyParser.json())

let validationWindowRegistry = {} // object to hold wallet/timestamp pairs to validate requests
let validatedAddresses = [] // objec to hold validated addresses

/* ===== API Routes ==========================*/

app.get('/block/:block', (req, res) => {

	// get current instance of blockchain
	let blockChain = new BlockchainClass.Blockchain()

	// get block
	blockChain.getBlock(req.params.block)
		.then(block => {
			res.send(block) // reply with block
		})
		.catch(error => {
			res.status(500)
			res.send(`There was an error retrieving the requested block. Please review the following error message:\n${error.message}`) // in case of error, reply with error message
		})
})


app.get('/stars/address:walletAddress', (req, res) => {
	
	// get address from request
	let address = req.params.walletAddress.slice(1,)
	
	// get current instance of blockchain
	let blockchain = new BlockchainClass.Blockchain()

	// get blocks with address
	blockchain.getBlocksWithAddress(address)
		.then(blocks => {
			res.send(blocks)
		})
		.catch(error => {
			res.status(500)
			res.send(error.message)
		})
})

app.get('/stars/hash:hash', (req, res) => {
	
	// get hash from request
	let hash = req.params.hash.slice(1,)
	
	// get current instance of blockchain
	let blockchain = new BlockchainClass.Blockchain()

	// get blocks with hash
	blockchain.getBlockWithHash(hash)
		.then(block => {
			res.send(block)
		})
		.catch(error => {
			res.send(error.message)
		})
})

app.post('/block', (req, res) => {

	// grab data from request
	let address = req.body.address
	let star = req.body.star
	let right_ascension = star.ra 
	let declination = star.dec 
	let magnitude = star.magnitude
	let consetllation = star.consetllation
	let story = star.story
	let timestamp = Math.round(new Date().getTime()/1000)

	// check if story is ASCII 
	if (!isASCII(star.story)) {res.send({error:'All characters in story must be ASCII'}); return;}

	// check story size
	if (byteCount(story) > 500) { res.send({error:'The story field is limited to 500 bytes (250 words). Please reduce the size of your story'}); return; }

	// make sure request has a validated address
	if (!validatedAddresses.includes(address)) {res.send({error:'Address has not been validated. Please provide a valid signature to /message-signature/validate endpoint. Only one star can be added per validation.'}); return;}


	if (address && star && right_ascension && declination && story) {
		let blockchain = new BlockchainClass.Blockchain()

		var body = {
			address: address,
			star: {
				ra: right_ascension,
				dec: declination,
				story: Buffer.from(story, 'utf8').toString('hex')
			}
		}

		// add optional fields if present
		if (magnitude) body.star.magnitude = magnitude
		if (consetllation) body.star.consetllation = consetllation

		blockchain.addBlock(new BlockClass.Block(body))
			.then(block => {
				// remove address from validated addresses to force address to generate a new request
				var index = validatedAddresses.indexOf(address);
				if (index !== -1) validatedAddresses.splice(index, 1);
				// remove address from validation window (time keeping)
				delete validationWindowRegistry[address]
				res.send(block)
			})
			.catch(error => {
				res.status(500)
				res.send(error.message)
			})
	} else {
		//incomplete request to post star
		res.status(400)
		res.send({error:'Incomplete request. Make sure all fields are provided (address, star, right_ascension, declination and story)'})
	}
})


app.post('/requestValidation', (req, res) => {

	if (req.body.walletAddress) {

		let walletAddress = req.body.walletAddress;
		let timestamp = Math.round(new Date().getTime()/1000)

		// check if there is a valid request already (timestamp exsist for address and it is less than 300 seconds old)
		if (validationWindowRegistry[walletAddress] &&  (timestamp - validationWindowRegistry[walletAddress]) < 300) {
			let response = {
				address: walletAddress,
				requestTimestamp: validationWindowRegistry[walletAddress],
				message: `${walletAddress}:${validationWindowRegistry[walletAddress]}:starRegistry`,
				validationWindow: 300
			}			
			res.send(response)
		} else {
			// if there is not valid request, create a new one
			let response = {
				address: walletAddress,
				requestTimestamp: timestamp,
				message: `${walletAddress}:${timestamp}:starRegistry`,
				validationWindow: 300
			}
			validationWindowRegistry[walletAddress] = timestamp
			res.send(response)
		}
	} else {
		res.send({error:'Please provide a walletAddress field inside the body payload to request access to the notary service.'})
	}
})

app.post('/message-signature/validate', (req, res) => {

	// check if body has necessary input
	if (req.body.walletAddress && req.body.messageSignature) {

		// pull data from request and generate signature to check against
		let walletAddress = req.body.walletAddress
		let messageSignature = req.body.messageSignature
		let message = `${walletAddress}:${validationWindowRegistry[walletAddress]}:starRegistry`

		// if signature is valid
		if (bitcoinMessage.verify(message, walletAddress, messageSignature)) {
			let success = {
				registerStar: true,
				status: {
					address: walletAddress,
					requestTimeStamp: validationWindowRegistry[walletAddress],
					message: `${walletAddress}:${validationWindowRegistry[walletAddress]}:starRegistry`,
					validationWindow: 300,
					messageSignature: 'valid'
				}	
			}
			// check if address has already been validated to not add double, // if not, add to validated addresses array
			var index = validatedAddresses.indexOf(walletAddress);
			if (!(index !== -1)) validatedAddresses.push(walletAddress)
			
			res.send(success)
		} else { // signature is invalid

			// check if we have a valid address (with active request)
			if (validationWindowRegistry[walletAddress]) { 
				res.send({error:`Signature invalid. Please sign the following message: ${walletAddress}:${validationWindowRegistry[walletAddress]}:starRegistry`})	
			} else { // direct user to create a request 
				res.send({error:'Your wallet address does not have a valid request pending. Please generate a request using /requestValidation'})
			}	
		}
	} else { // request did not provide walletAddress and messageSignature fields
		res.send({error:'Please provide a walletAddress and messageSignature field to validate your signature.'})
	}
})

app.listen(port, () => console.log(`app listening on port ${port}!`))

/**
 * UTILITIES
 */
 
function byteCount(s) {
    return encodeURI(s).split(/%..|./).length - 1;
}
function isASCII(str) {
    return /^[\x00-\x7F]*$/.test(str);
}