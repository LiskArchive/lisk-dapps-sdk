module.exports = function (body, crypti, cb) {
	crypti.crypto.decrypt(body.secret, body.nonce, body.message, function (err, resp) {
		if (err) {
			return cb(null, {error: err});
		} else {
			return cb(null, {message: resp.decrypted});
		}
	});
}