var lib = require('./lib');
var async = require('async');
var modules = [];

async.auto({
	sandbox: function (cb) {
		cb(null, process.binding('sandbox'));
	},

	logger: function (cb) {
		cb(null, console.log);
	},

	bus: function (cb) {
		var changeCase = require('change-case');
		var bus = function () {
			this.message = function () {
				var args = [];
				Array.prototype.push.apply(args, arguments);
				var topic = args.shift();
				modules.forEach(function (module) {
					var eventName = 'on' + changeCase.pascalCase(topic);
					if (typeof(module[eventName]) == 'function') {
						module[eventName].apply(module[eventName], args);
					}
				})
			}
		}
		cb(null, new bus)
	},

	sequence: function (cb) {
		var sequence = [];
		process.nextTick(function nextSequenceTick() {
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
		var tasks = {};

		Object.keys(lib).forEach(function (name) {
			tasks[name] = function (cb) {
				var obj = new lib[name](cb, scope);

				modules.push(obj);
			}
		})
		async.parallel(tasks, function (err, results) {
			cb(err, results);
		});
	}],

	ready: ['modules', function (cb, scope) {
		for (var name in scope.modules) {
			if (typeof(scope.modules[name].onBind) == 'function') {
				scope.modules[name].onBind(scope.modules);
			}
		}
		cb();
	}]
});