var sandbox = process.binding('sandbox');
var router = require('./routes.json');
var crypti = require('./lib/crypti.js');
var modules = {};

crypti.forEach(function (module) {
	modules.push(new module(sandbox));
});

sandbox.onMessage(function (message, cb) {
	var handler;
	router.forEach(function (route) {
		if (route.method == message.method && route.path == message.path) {
			handler = require(route.handler);
		}
	});

	if (handler) {
		var query = (message.method == 'get')? req.query : req.body;
		handler(query, modules, function (err, response) {
			if (err) {
				return console.log(err)
			}
			cb(null, response);
		});
	}else{
		cb("api not found");
	}
});
