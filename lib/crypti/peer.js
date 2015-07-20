var private = {};
private.sandbox = null;

function Peer(sandbox) {
	private.sandbox = sandbox;
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

	private.sandbox.sendMessage(message, cb);
}

Peer.prototype.getPeer = function (ip_str, port, cb) {
	var message = {
		call: "peer#getPeer",
		args: {
			ip_str: ip_str,
			port: port
		}
	};

	private.sandbox.sendMessage(message, cb);
}

Peer.prototype.version = function (cb) {
	var message = {
		call: "peer#version",
		args: {}
	};

	private.sandbox.sendMessage(message, cb);
}

module.exports = Peer;