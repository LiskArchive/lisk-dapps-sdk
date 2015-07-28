var private = {};
var library = null;
var modules = null;

function Sql(cb, _library) {
	library = _library;
	cb(null, this);
}

Sql.prototype.select = function (request, cb) {
	var message = {
		call: "sql#select",
		args: request
	};

	library.sandbox.sendMessage(message, cb);
}

Sql.prototype.insert = function (request, cb) {
	var message = {
		call: "sql#insert",
		args: request
	};

	library.sandbox.sendMessage(message, cb);
}

Sql.prototype.update = function (request, cb) {
	var message = {
		call: "sql#update",
		args: request
	};

	library.sandbox.sendMessage(message, cb);
}

Sql.prototype.remove = function (request, cb) {
	var message = {
		call: "sql#remove",
		args: request
	};

	library.sandbox.sendMessage(message, cb);
}

Sql.prototype.onBind = function (_modules) {
	modules = _modules;
}

module.exports = Sql;