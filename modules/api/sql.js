var private = {}, self = null,
library = null, modules = null;

function Sql(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
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