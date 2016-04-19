console.log("Dapp loading process pid " + process.pid)

// require("longjohn");
var async = require("async");
var path = require("path");
var ZSchema = require("z-schema");
var extend = require("extend");
var util = require("util");
var modules = {};
var ready = false;

process.on("uncaughtException", function (err) {
	console.log("Dapp system error", {message: err.message, stack: err.stack});
});

var d = require("domain").create();
d.on("error", function (err) {
	console.log("Domain master", {message: err.message, stack: err.stack});
});

d.run(function () {
	async.auto({
		sandbox: function (cb) {
			cb(null, process.binding("sandbox"));
		},

		logger: function (cb) {
			cb(null, console.log);
		},

		config: function (cb) {
			cb(null, require("./config.json"));
		},

		scheme: ["logger", function (cb, scope) {
			try {
				var db = require("./blockchain.json");
			} catch (e) {
				scope.logger("Failed to load blockchain.json");
			}

			var fields = [],
			    aliasedFields = [],
			    types = {},
			    selector = {};

			function getType(type) {
				var nativeType;

				switch (type) {
					case "BigInt":
						nativeType = Number;
						break;
					default:
						nativeType = String;
				}

				return nativeType;
			}

			var i, n, __field, __alias, __type;

			for (i = 0; i < db.length; i++) {
				for (n = 0; n < db[i].tableFields.length; n++) {
					__field = db[i].alias + "." + db[i].tableFields[n].name;;
					__alias = db[i].alias + "_" + db[i].tableFields[n].name;
					__type  = db[i].tableFields[n].type;

					fields.push(__field);
					aliasedFields.push({ field: __field, alias: __alias });
					types[__alias] = getType(__type);
				}

				selector[db[i].table] = extend(db[i], {tableFields: undefined});
			}

			cb(null, {scheme: db, fields: fields, aliasedFields: aliasedFields, types: types, selector: selector});
		}],

		validator: function (cb) {
			ZSchema.registerFormat("publicKey", function (value) {
				try {
					var b = new Buffer(value, "hex");
					return b.length == 32;
				} catch (e) {
					return false;
				}
			});

			ZSchema.registerFormat("signature", function (value) {
				try {
					var b = new Buffer(value, "hex");
					return b.length == 64;
				} catch (e) {
					return false;
				}
			});

			ZSchema.registerFormat("hex", function (value) {
				try {
					new Buffer(value, "hex");
				} catch (e) {
					return false;
				}

				return true;
			});

			var validator = new ZSchema();
			cb(null, validator);
		},

		bus: function (cb) {
			var changeCase = require("change-case");
			var bus = function () {
				this.message = function () {
					if (ready) {
						var args = [];
						Array.prototype.push.apply(args, arguments);
						var topic = args.shift();
						Object.keys(modules).forEach(function (namespace) {
							Object.keys(modules[namespace]).forEach(function (moduleName) {
								var eventName = "on" + changeCase.pascalCase(topic);
								if (typeof(modules[namespace][moduleName][eventName]) == "function") {
									modules[namespace][moduleName][eventName].apply(modules[namespace][moduleName][eventName], args);
								}
							});
						});
					}
				}
			}
			cb(null, new bus)
		},

		sequence: function (cb) {
			var Sequence = require("./modules/helpers/sequence.js");
			var sequence = new Sequence({
				onWarning: function(current, limit){
					scope.logger.warn("Main queue", current)
				}
			});
			cb(null, sequence);
		},

		modules: ["sandbox", "config", "logger", "bus", "sequence", function (cb, scope) {
			var module = path.join(__dirname, process.argv[3] || "modules.full.json");
			var lib = require(module);

			var tasks = [];

			Object.keys(lib).forEach(function (path) {
				var raw = path.split("/");
				var namespace = raw[0];
				var moduleName = raw[1];
				tasks.push(function (cb) {
					var d = require("domain").create();
					d.on("error", function (err) {
						scope.logger("Domain " + moduleName, {message: err.message, stack: err.stack});
					});
					d.run(function () {
						var library = require(lib[path]);
						var obj = new library(cb, scope);
						modules[namespace] = modules[namespace] || {};
						modules[namespace][moduleName] = obj;
					});
				});
			})

			async.parallel(tasks, function (err) {
				cb(err, modules);
			});
		}],

		ready: ["modules", "bus", "logger", function (cb, scope) {
			ready = true;

			scope.bus.message("bind", scope.modules);

			scope.logger("Dapp loaded process pid " + process.pid)
			cb();
		}]
	});
});
