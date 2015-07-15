var private = {};
private.sandbox = null;
private.modules = null;

function Background(sandbox) {
	private.sandbox = sandbox;
}

Background.prototype.onBind = function (modules) {
	private.modules = modules;

	private.modules.transport.message({test: "teststr"}, function (err, data) {
		console.log(err, data);
	})
}

Background.prototype.onMessage = function (msg) {
	console.log("onMessage", msg);
}

module.exports = Background;