var private = {}, self = null,
library = null, modules = null;

function Dapps(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
}

Dapps.prototype.getGenesis = function (cb) {
	var message = {
		call: "dapps#getGenesis",
		args: {}
	};

	library.sandbox.sendMessage(message, cb);
}

Dapps.prototype.sendWithdrawal = function (opts, cb) {
	var message = {
		call: "dapps#sendWithdrawal",
		args: opts
	};

	library.sandbox.sendMessage(message, cb);
}

Dapps.prototype.getCommonBlock = function (cb) {
	var message = {
		call: "dapps#getCommonBlock",
		args: {}
	};

	library.sandbox.sendMessage(message, cb);
}

Dapps.prototype.setReady = function (cb) {
	var message = {
		call: "dapps#setReady",
		args: {}
	};

	library.sandbox.sendMessage(message, cb);
}

Dapps.prototype.onBind = function (_modules) {
	modules = _modules;
}

module.exports = Dapps;