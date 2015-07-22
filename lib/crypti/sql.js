var private = {};
private.library = null;
private.modules = null;

function Sql(cb, library) {
	private.library = library;
	cb(null, this);
}

Sql.prototype.select = function (request, cb) {
	var message = {
		call: "sql#select",
		args: request
	};

	private.library.sandbox.sendMessage(message, cb);
}

Sql.prototype.insert = function (request, cb) {
	var message = {
		call: "sql#insert",
		args: request
	};

	private.library.sandbox.sendMessage(message, cb);
}

Sql.prototype.update = function (request, cb) {
	var message = {
		call: "sql#update",
		args: request
	};

	private.library.sandbox.sendMessage(message, cb);
}

Sql.prototype.remove = function (request, cb) {
	var message = {
		call: "sql#remove",
		args: request
	};

	private.library.sandbox.sendMessage(message, cb);
}

Sql.prototype.onBind = function (modules) {
	private.modules = modules;
}

module.exports = Sql;