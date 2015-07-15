var sandbox = process.binding('sandbox');
var router = require('./routes.json');
var crypti = require('./lib/crypti.js');
var modules = {};

for (var i in crypti) {
	modules[i] = new crypti[i](sandbox);
}

for (var i in modules) {
	modules[i].onBind && modules[i].onBind(modules);
}


sandbox.onMessage(function (message, cb) {
	var handler;
	router.forEach(function (route) {
		if (route.method == message.method && route.path == message.path) {
			handler = require(route.handler);
		}
	});

	if (handler) {
		handler(message.query, modules, function (err, response) {
			if (err) {
				return console.log(err)
			}
			cb(null, response);
		});
	}else{
		cb("api not found");
	}
});