module.exports = function (body, library, modules, cb) {
	modules.crypto.decrypt(body.secret, body.nonce, body.message, function (err, resp) {
		if (err) {
			return cb(null, {error: err});
		} else {
			return cb(null, {message: resp.decrypted});
		}
	});
}