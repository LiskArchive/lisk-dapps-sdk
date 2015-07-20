var private = {};
private.sandbox = null;

function Sql(sandbox) {
	private.sandbox = sandbox;
}

Sql.prototype.select = function (request, cb) {
	var message = {
		call: "sql#select",
		args: request
	};

	private.sandbox.sendMessage(message, cb);
}

Sql.prototype.insert = function (request, cb) {
	var message = {
		call: "sql#insert",
		args: request
	};

	private.sandbox.sendMessage(message, cb);
}

Sql.prototype.update = function (request, cb) {
	var message = {
		call: "sql#update",
		args: request
	};

	private.sandbox.sendMessage(message, cb);
}

Sql.prototype.remove = function (request, cb) {
	var message = {
		call: "sql#remove",
		args: request
	};

	private.sandbox.sendMessage(message, cb);
}

module.exports = Sql;