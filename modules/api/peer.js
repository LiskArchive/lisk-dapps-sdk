var private = {}, self = null,
library = null, modules = null;

/**
 * Creates instance of Peer API. Use *modules.api.peer* to get existing object.
 *
 * @param cb - Callback.
 * @param _library - Object that contains helpers.
 * @constructor
 */
function Peer(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
}

/**
 * Get peers of Lisk by filter.
 * @param filter - Filter with parameters.
 * @param filter.state - State of peer.
 * @param filter.os - Os of peer.
 * @param filter.version - Version of peer.
 * @param filter.limit - Limit of peers.
 * @param filter.shared - If peer shared for other peers.
 * @param filter.orderBy - Order by field for peers.
 * @param filter.offset - Offset to get peers.
 * @param filter.port - Port of peers
 * @param {Peer~getPeersCallback} cb - Callback handles response from Lisk.
 */
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

/**
 * @callback Peer~getPeersCallback
 *
 * @param error - Error of api call execution.
 * @param response - Response of api call execution.
 * @param response.peers - Array of peers.
 * @param response.peers[0].ip - Ip of peer.
 * @param response.peers[0].port - Port of peer.
 * @param response.peers[0].os - OS of peer.
 * @param response.peers[0].version - Version of peer.
 * @param response.peers[0].shared - If peer shared.
 */

/**
 * Get peer by ip or port.
 * @param ip_str - Ip of peer.
 * @param port - Port of peer.
 * @param {Peer~getPeerCallback} cb - Callback handles response from Lisk.
 */
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

/**
 * @callback Peer~getPeerCallback
 *
 * @param error - Error of api call execution.
 * @param response - Response of api call execution.
 * @param response.peer - Peer.
 * @param response.peer.ip - Ip of peer.
 * @param response.peer.port - Port of peer.
 * @param response.peer.os - OS of peer.
 * @param response.peer.version - Version of peer.
 * @param response.peer.shared - If peer shared.
 */

/**
 * Get version of our peer.
 * @param {Peer~versionCallback} cb - Callback handles response from Lisk.
 */
Peer.prototype.version = function (cb) {
	var message = {
		call: "peer#version",
		args: {}
	};

	library.sandbox.sendMessage(message, cb);
}

/**
 * @callback Peer~versionCallback
 * @param error - Error of api call execution.
 * @param response - Response of api call execution.
 * @param response.version - Version of node.
 * @param response.build - Build of node.
 */

Peer.prototype.onBind = function (_modules) {
	modules = _modules;
}

module.exports = Peer;
