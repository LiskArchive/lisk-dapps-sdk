var private = {};
private.library = null;
private.modules = null;

function Hash(cb, library) {
	private.library = library;
	cb(null, this);
}

Hash.prototype.onBind = function (modules) {
	private.modules = modules;
}

module.exports = Hash;