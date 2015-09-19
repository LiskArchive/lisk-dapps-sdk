var private = {}, self = null,
library = null, modules = null;

function Background(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
}

Background.prototype.onBind = function (_modules) {
	modules = _modules;

	//modules.api.transport.message("test", {sender: "wakeup"}, function (err, data) {
	//
	//})
}

Background.prototype.onMessage = function (msg) {
	//modules.api.transport.message("test", {test: "resend"}, function (err, data) {
	//
	//})
}

module.exports = Background;