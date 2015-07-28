var private = {};
private.library = null;
private.modules = null;
private.last = null;

function Blocks(cb, library) {
	private.library = library;
	cb(null, this);
}

Blocks.prototype.createHash = function (delegate, cb) {
	var unconfirmedList = private.modules.blockchain.data.getUnconfirmedList();
	private.modules.api.transport.message("hash", {"hash": "", "sign": ""})
}

Blocks.prototype.getHeight = function () {
	return private.last.height;
}

Blocks.prototype.onBind = function (modules) {
	private.modules = modules;
}

module.exports = Blocks;