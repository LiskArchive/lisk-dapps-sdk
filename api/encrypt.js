module.exports = function (body, modules, cb) {
	modules.crypto.encrypt(body.secret, body.message, function (err, resp) {
		if (err) {
			return cb(null, {error: err});
		} else {
			return cb(null, {message: resp.message, nonce: resp.nonce});
		}
	});
}