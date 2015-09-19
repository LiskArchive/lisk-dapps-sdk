var util = require('util');

var private = {}, self = null,
	library = null, modules = null;

function Sql(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
}

private.row2object = function (row) {
	for (var
			 out = {},
			 length = this.length,
			 i = 0; i < length; i++
	) {
		out[this[i]] = row[i];
	}
	return out;
}

private.row2parsed = function (row) {
	for (var
			 out = {},
			 fields = this.f,
			 parsers = this.p,
			 length = fields.length,
			 i = 0; i < length; i++
	) {
		if (parsers[i] === Buffer) {
			out[fields[i]] = parsers[i](row[i], 'hex');
		} else if (parsers[i] === Array) {
			out[fields[i]] = row[i] ? row[i].split(",") : []
		} else {
			out[fields[i]] = parsers[i](row[i]);
		}
	}
	return out;
}

private.parseFields = function ($fields) {
	for (var
			 current,
			 fields = Object.keys($fields),
			 parsers = [],
			 length = fields.length,
			 i = 0; i < length; i++
	) {
		current = $fields[fields[i]];
		parsers[i] = current === Boolean ?
			$Boolean : (
			current === Date ?
				$Date :
			current || String
		)
		;
	}

	return {f: fields, p: parsers};
}

Sql.prototype.select = function (request, map, cb) {
	if (typeof map == 'function') {
		cb = map;
		map = null;
	}
	var message = {
		call: "sql#select",
		args: request
	};

	library.sandbox.sendMessage(message, function (err, rows) {
		if (map && !err) {
			rows = util.isArray(map) ?
				rows.map(private.row2object, map) :
				rows.map(private.row2parsed, private.parseFields(map));
		}

		cb(err, rows);
	});
}

Sql.prototype.insert = function (request, cb) {
	var message = {
		call: "sql#insert",
		args: request
	};

	library.sandbox.sendMessage(message, cb);
}

Sql.prototype.batch = function (request, cb) {
	var message = {
		call: "sql#batch",
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