var private = {};
private.library = null;
private.modules = null;

function Background(cb, library) {
	private.library = library;
	cb(null, this);
}

Background.prototype.onBind = function (modules) {
	private.modules = modules;

	private.modules.transport.message({test: "teststr"}, function (err, data) {

	})
}

Background.prototype.onMessage = function (msg) {
	private.modules.transport.message({test: "111"}, function (err, data) {

	})
}

module.exports = Background;