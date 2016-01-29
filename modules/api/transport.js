var private = {}, self = null,
	library = null, modules = null;

/**
 * Creates instance of Transport API. Use *modules.api.transport* to get existing object.
 *
 * @param cb - Callback.
 * @param _library - Object that contains helpers.
 * @constructor
 */
function Transport(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
}

/**
 * Send message to Lisk.
 * @param topic - Topic of message.
 * @param message - Message.
 * @param {Transport~message} cb - Callback handles response from Lisk.
 */
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

/**
 * @callback Transport~message
 *
 * @param error - Error of api call execution.
 * @param response - Response of api call execution.
 */

/**
 * Send http request to random peer.
 * @param method - Http Method.
 * @param path - Path (part of url).
 * @param query - Query.
 * @param {Transport~getRandomPeerCallback} cb - Callback handles response from Lisk.
 */
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

/**
 * @callback Transport~getRandomPeerCallback
 *
 * @param error - Error of api call execution.
 * @param response - Response of api call execution. Contains result of sent http query.
 */

/**
 * Send http request to peer.
 * @param peer - Peer object.
 * @param method - Http Method.
 * @param path - Path (part of url).
 * @param query - Query.
 * @param {Transport~getPeerCallback} cb - Callback handles response from Lisk.
 */
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

/**
 * @callback Transport~getPeerCallback
 *
 * @param error - Error of api call execution.
 * @param response - Response of api call execution. Contains result of sent http query.
 */

Transport.prototype.onBind = function (_modules) {
	modules = _modules;
}

module.exports = Transport;
