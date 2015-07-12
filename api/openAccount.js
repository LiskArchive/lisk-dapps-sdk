module.exports = function (body, crypti, cb) {
	crypti.accounts.open(body.secret, function (err, account) {
		if (err) {
			return cb(null, {error: err});
		} else {
			return cb(null, {account: account});
		}
	});
}