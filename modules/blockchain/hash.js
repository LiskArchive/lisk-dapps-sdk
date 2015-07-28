var private = {};
private.library = null;
private.modules = null;
private.last = null;

function Hash(cb, library) {
	private.library = library;
	cb(null, this);
}

Hash.prototype.createHash = function (delegate, cb) {
	var unconfirmedList = private.modules.data.getUnconfirmedList();

	// process array of transactions

	private.modules.transport.message("hash", {"hash": "", "sign": ""})
}

Hash.prototype.getHeight = function () {
	return private.last.height;
}

Hash.prototype.onBind = function (modules) {
	private.modules = modules;
}

module.exports = Hash;