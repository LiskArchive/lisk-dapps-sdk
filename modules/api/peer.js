var private = {}, self = null,
library = null, modules = null;

function Peer(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
}

Peer.prototype.getPeers = function (filter, cb) {
	var message = {
		call: "peer#getPeers",
		args: {
			state: filter.state,
			os: filter.os,
			version: filter.version,
			limit: filter.limit,
			shared: filter.shared,
			orderBy: filter.orderBy,
			offset: filter.offset,
			port: filter.port
		}
	};

	library.sandbox.sendMessage(message, cb);
}

Peer.prototype.getPeer = function (ip_str, port, cb) {
	var message = {
		call: "peer#getPeer",
		args: {
			ip_str: ip_str,
			port: port
		}
	};

	library.sandbox.sendMessage(message, cb);
}

Peer.prototype.version = function (cb) {
	var message = {
		call: "peer#version",
		args: {}
	};

	library.sandbox.sendMessage(message, cb);
}

Peer.prototype.onBind = function (_modules) {
	modules = _modules;
}

module.exports = Peer;