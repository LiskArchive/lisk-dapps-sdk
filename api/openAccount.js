module.exports = function (body, library, modules, cb) {
	modules.accounts.open(body.secret, function (err, account) {
		if (err) {
			return cb(null, {error: err});
		} else {
			return cb(null, {account: account});
		}
	});
}