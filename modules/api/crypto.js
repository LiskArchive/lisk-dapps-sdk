var nacl_factory = require('js-nacl');
var crypto = require('crypto-browserify');
var bignum = require('browserify-bignum');

var nacl = nacl_factory.instantiate();

var private = {}, self = null,
	library = null, modules = null;

function Crypto(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
}

Crypto.prototype.keypair = function (secret) {
	var hash = crypto.createHash('sha256').update(secret, 'utf8').digest();
	var kp = nacl.crypto_sign_keypair_from_seed(hash);

	var keypair = {
		publicKey: new Buffer(kp.signPk).toString('hex'),
		privateKey: new Buffer(kp.signSk).toString('hex')
	}

	return keypair;
}

Crypto.prototype.sign = function (keypair, data) {
	var hash = crypto.createHash('sha256').update(data).digest();
	var signature = nacl.crypto_sign_detached(hash, new Buffer(keypair.privateKey, 'hex'));
	return new Buffer(signature).toString('hex');
}

Crypto.prototype.verify = function (publicKey, signature, data) {
	var hash = crypto.createHash('sha256').update(data).digest();
	var signatureBuffer = new Buffer(signature, 'hex');
	var senderPublicKeyBuffer = new Buffer(publicKey, 'hex');
	return nacl.crypto_sign_verify_detached(signatureBuffer, hash, senderPublicKeyBuffer);
}

Crypto.prototype.getId = function (data) {
	var hash = crypto.createHash('sha256').update(data).digest();
	var temp = new Buffer(8);
	for (var i = 0; i < 8; i++) {
		temp[i] = hash[7 - i];
	}

	var id = bignum.fromBuffer(temp).toString();
	return id;
}

Crypto.prototype.onBind = function (_modules) {
	modules = _modules;
}

module.exports = Crypto;