var sandbox = process.binding('sandbox');
var router = require('./routes.json');
var crypti = require('./lib/crypti.js');
var modules = {};
var apies = {};

for (var i in crypti) {
	modules[i] = new crypti[i](sandbox);
}

for (var i in modules) {
	modules[i].onBind && modules[i].onBind(modules);
}

router.forEach(function (route) {
	apies[route.method + " " + route.path] = require(route.handler);
});

sandbox.onMessage(function (message, cb) {
	var handler = apies[message.method + " " + message.path];
	if (handler) {
		handler(message.query, modules, function (err, response) {
			cb(err, response);
		});
	} else {
		cb("api not found");
	}
});