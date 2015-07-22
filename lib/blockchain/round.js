var private = {};
private.library = null;
private.modules = null;

function Round(cb, library) {
	private.library = library;
	cb(null, this);
}

Round.prototype.onBind = function (modules) {
	private.modules = modules;
}

module.exports = Round;