var private = {}, self = null,
	library = null, modules = null;

function Transport(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
}

Transport.prototype.message = function (topic, message, cb) {
	var message = {
		call: "transport#message",
		args: {
			message: message,
			topic: topic
		}
	};

	library.sandbox.sendMessage(message, cb);
}

Transport.prototype.getRandomPeer = function (method, path, query, cb) {
	//console.log(method + " " + path, query);
	var message = {
		call: "transport#request",
		args: {
			method: method,
			path: path,
			query: query
		}
	};

	library.sandbox.sendMessage(message, cb);
}

Transport.prototype.getPeer = function (peer, method, path, query, cb) {
	//console.log(method + " " + path, query);
	var message = {
		call: "transport#request",
		args: {
			peer: {
				ip: peer.ip,
				port: peer.port
			},
			method: method,
			path: path,
			query: query
		}
	};

	library.sandbox.sendMessage(message, cb);
}

Transport.prototype.onBind = function (_modules) {
	modules = _modules;
}

module.exports = Transport;