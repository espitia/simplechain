
const BlockClass = require('./Classes/Block.js')
const BlockchainClass = require('./Classes/Blockchain.js')

const bodyParser = require('body-parser');
const express = require('express')
const app = express()
const port = 8000;
app.use(bodyParser.json())

let validationWindowRegistry = {} // object to hold wallet/timestamp pairs to validate requests


/* ===== API Routes ==========================*/

app.get('/block/:block', (req, res) => {

	// get current instance of blockchain
	let blockChain = new BlockchainClass.Blockchain()

	// get block
	blockChain.getBlock(req.params.block)
		.then(block => {
			block.body.star.storyDecoded = hexDecode(block.body.star.story)
			res.send(block) // reply with block
		})
		.catch(error => {
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
			blocks.forEach(block => {
				block.body.star.storyDecoded = hexDecode(block.body.star.story)
			})
			res.send(blocks)
		})
		.catch(error => {
			res.send(error.message)
		})
})

app.get('/stars/hash:hash', (req, res) => {
	
	// get address from request
	let hash = req.params.hash.slice(1,)
	
	// get current instance of blockchain
	let blockchain = new BlockchainClass.Blockchain()

	// get blocks with address
	blockchain.getBlockWithHash(hash)
		.then(block => {
			block.body.star.storyDecoded = hexDecode(block.body.star.story)
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

	// check story size
	if (byteCount(story) > 500) { res.send('The story field is limited to 500 bytes (250 words). Please reduce the size of your story'); return; }

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
				res.send(block)
			})
			.catch(error => {
				throw new Error(error.message)
			})
	}
})


app.post('/requestValidation', (req, res) => {

	if (req.body.walletAddress) {

		let walletAddress = req.body.walletAddress;
		let timestamp = Math.round(new Date().getTime()/1000)

		// check if there is a valid request already (timestamp exsist for address and it is less than 500 seconds old)
		if (validationWindowRegistry[walletAddress] &&  (timestamp - validationWindowRegistry[walletAddress]) < 500) {
			let timeLeft = 500 - (timestamp - validationWindowRegistry[walletAddress])
			res.send(`Your validation request for ${walletAddress} has ${timeLeft} seconds left. Please provide a valid signature to /message-signature/validate for the following message: ${walletAddress}:${validationWindowRegistry[walletAddress]}:starRegistry`)
		} else {

			// if there is not valid request, create a new one
			let response = {
				address: walletAddress,
				requestTimestamp: timestamp,
				message: `${walletAddress}:${timestamp}:starRegistry`,
				validationWindow: `Remaining time: 500 seconds`
			}
			validationWindowRegistry[walletAddress] = timestamp
			res.send(response)
		}
	} else {
		res.send('Please provide a walletAddress field inside the body payload to request access to the notary service.')
	}
})

app.post('/message-signature/validate', (req, res) => {

	// check if body has necessary input
	if (req.body.walletAddress && req.body.messageSignature) {

		// pull data from request and generate signature to check against
		let walletAddress = req.body.walletAddress
		let messageSignature = req.body.messageSignature
		let signatureToValidate = SHA256(`${walletAddress}:${validationWindowRegistry[walletAddress]}:starRegistry`).toString()
		let timeLeft = Math.round(500 - ((new Date().getTime()/1000) - validationWindowRegistry[walletAddress]))

		// if signature is valid
		if (signatureToValidate == messageSignature) {
			let success = {
				registerStar: true,
				status: {
					address: walletAddress,
					requestTimeStamp: validationWindowRegistry[walletAddress],
					message: `${walletAddress}:${validationWindowRegistry[walletAddress]}:starRegistry`,
					validationWindow: timeLeft,
					messageSignature: 'valid'
				}	
			}
			res.send(success)
		} else { // signature is invalid

			// check if we have a valid address (with active request)
			if (validationWindowRegistry[walletAddress]) { 
				res.send(`Signature invalid. Please sign the following message: ${walletAddress}:${validationWindowRegistry[walletAddress]}:starRegistry`)	
			} else { // direct user to create a request 
				res.send('Your wallet address does not have a valid request pending. Please generate a request using /requestValidation')
			}	
		}
	} else { // request did not provide walletAddress and messageSignature fields
		res.send('Please provide a walletAddress and messageSignature field to validate your signature.')
	}
})

app.listen(port, () => console.log(`app listening on port ${port}!`))


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

function byteCount(s) {
    return encodeURI(s).split(/%..|./).length - 1;
}
