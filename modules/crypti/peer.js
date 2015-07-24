var private = {};
private.library = null;
private.modules = null;

function Peer(cb, library) {
	private.library = library;
	cb(null, this);
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

	private.library.sandbox.sendMessage(message, cb);
}

Peer.prototype.getPeer = function (ip_str, port, cb) {
	var message = {
		call: "peer#getPeer",
		args: {
			ip_str: ip_str,
			port: port
		}
	};

	private.library.sandbox.sendMessage(message, cb);
}

Peer.prototype.version = function (cb) {
	var message = {
		call: "peer#version",
		args: {}
	};

	private.library.sandbox.sendMessage(message, cb);
}

Peer.prototype.onBind = function (modules) {
	private.modules = modules;
}

module.exports = Peer;