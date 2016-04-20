var util = require('util');

var private = {}, self = null,
	library = null, modules = null;

/**
 * Creates instance of Sql API. Use *modules.api.sql* to get existing object.
 *
 * @param cb - Callback.
 * @param _library - Object that contains helpers.
 * @constructor
 */
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
	var values = [];
	for (var key of Object.keys(row)) {
		values.push(row[key]);
	}

	for (var
			 out = {},
			 value = null,
			 fields = this.f,
			 parsers = this.p,
			 length = fields.length,
			 i = 0; i < length; i++
	) {
		value = values[i];

		if (parsers[i] === Buffer) {
			out[fields[i]] = parsers[i](value, 'hex');
		} else if (parsers[i] === Array) {
			out[fields[i]] = values ? value.split(",") : [];
		} else if (value) {
			out[fields[i]] = parsers[i](value);
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
			Boolean : (
			current === Date ?
				Date :
			current || String
		)
		;
	}

	return {f: fields, p: parsers};
}

/**
 * Run SQL "select" query.
 * @param request - JSON Sql request.
 * @param map - Fields map.
 * @param {Sql~selectCallback} cb - Callback handles response from Lisk.
 */
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

/**
 * @callback Sql~selectCallback
 * @param error - Error of api call execution.
 * @param response - Response of api call execution. Contains result of query execution.
 */

/**
 * Insert values to Sql tables.
 * @param request - JSON Sql request to insert.
 * @param {Sql~insertCallback} cb - Callback handles response from Lisk.
 */
Sql.prototype.insert = function (request, cb) {
	var message = {
		call: "sql#insert",
		args: request
	};

	library.sandbox.sendMessage(message, cb);
}

/**
 * @callback Sql~insertCallback
 *
 * @param error - Error of api call execution.
 * @param response - Response of api call execution.
 */


/**
 * Insert batch of items to Sql tables.
 * @param request - JSON Sql request to insert batch.
 * @param {Sql~batchCallback} cb - Callback handles response from Lisk.
 */
Sql.prototype.batch = function (request, cb) {
	var message = {
		call: "sql#batch",
		args: request
	};

	library.sandbox.sendMessage(message, cb);
}

/**
 * @callback Sql~batchCallback
 *
 * @param error - Error of api call execution.
 * @param response - Response of api call execution.
 */

/**
 * Update values in Sql table.
 * @param request - JSON Sql request to update.
 * @param {Sql~updateCallback} cb - Callback handles response from Lisk.
 */
Sql.prototype.update = function (request, cb) {
	var message = {
		call: "sql#update",
		args: request
	};

	library.sandbox.sendMessage(message, cb);
}

/**
 * @callback Sql~updateCallback
 *
 * @param error - Error of api call execution.
 * @param response - Response of api call execution.
 */

/**
 * Remove data from Sql table.
 *
 * @param request - JSON Sql request to remove data from Sql table.
 * @param {Sql~removeCallback} cb - Callback handles response from Lisk.
 */
Sql.prototype.remove = function (request, cb) {
	var message = {
		call: "sql#remove",
		args: request
	};

	library.sandbox.sendMessage(message, cb);
}

/**
 * @callback Sql~removeCallback
 *
 * @param error - Error of api call execution.
 * @param response - Response of api call execution.
 */

Sql.prototype.onBind = function (_modules) {
	modules = _modules;
}

module.exports = Sql;
