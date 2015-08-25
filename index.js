console.log("dapp loading process pid " + process.pid)

require('longjohn');
var async = require('async');
var path = require('path');
var modules = {};
var ready = false;

process.on('uncaughtException', function (err) {
	console.log('dapp system error', {message: err.message, stack: err.stack});
});

var d = require('domain').create();
d.on('error', function (err) {
	console.log('domain master', {message: err.message, stack: err.stack});
});

d.run(function () {
	async.auto({
		sandbox: function (cb) {
			cb(null, process.binding('sandbox'));
		},

		logger: function (cb) {
			cb(null, console.log);
		},

		scheme: ['logger', function (cb, scope) {

			try {
				var db = require('./blockchain.json');
			} catch (e) {
				scope.logger("failed blockchain file");
			}

			var fields = [];
			var alias = {};

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

			for (var i = 0; i < db.length; i++) {
				for (var n = 0; n < db[i].tableFields.length; n++) {
					fields.push(db[i].alias + "." + db[i].tableFields[n].name);
					alias[db[i].alias + "_" + db[i].tableFields[n].name] = getType(db[i].tableFields[n].type);
				}
			}

			cb(null, {scheme: db, fields: fields, alias: alias});
		}],

		bus: function (cb) {
			var changeCase = require('change-case');
			var bus = function () {
				this.message = function () {
					if (ready) {
						var args = [];
						Array.prototype.push.apply(args, arguments);
						var topic = args.shift();
						Object.keys(modules).forEach(function (namespace) {
							Object.keys(modules[namespace]).forEach(function (moduleName) {
								var eventName = 'on' + changeCase.pascalCase(topic);
								if (typeof(modules[namespace][moduleName][eventName]) == 'function') {
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
			var sequence = [];
			setImmediate(function nextSequenceTick() {
				var task = sequence.shift();
				if (!task) {
					return setTimeout(nextSequenceTick, 100);
				}
				task(function () {
					setTimeout(nextSequenceTick, 100);
				});
			});
			cb(null, {
				add: function (worker, done) {
					sequence.push(function (cb) {
						if (worker && typeof(worker) == 'function') {
							worker(function (err, res) {
								setImmediate(cb);
								done && setImmediate(done, err, res);
							});
						} else {
							setImmediate(cb);
							done && setImmediate(done);
						}
					});
				}
			});
		},

		modules: ["sandbox", "logger", "bus", "sequence", function (cb, scope) {
			var module = path.join(__dirname, process.argv[3] || 'modules.full.json');
			var lib = require(module);

			var tasks = [];

			Object.keys(lib).forEach(function (path) {
				var raw = path.split("/");
				var namespace = raw[0];
				var moduleName = raw[1];
				tasks.push(function (cb) {
					var d = require('domain').create();
					d.on('error', function (err) {
						scope.logger('domain ' + moduleName, {message: err.message, stack: err.stack});
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

		ready: ['modules', 'bus', 'logger', function (cb, scope) {
			ready = true;

			scope.bus.message("bind", scope.modules);

			scope.logger("dapp loaded process pid " + process.pid)
			cb();
		}]
	});
});