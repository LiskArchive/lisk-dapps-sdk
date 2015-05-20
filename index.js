var sandbox = process.binding('sandbox');

sandbox.onMessage(function(message, cb){
	cb(null, {"test": "response"});
});

/*
var router = require('./api/routes.js');

sandbox.onMessage(function (message, cb) {
	console.log(message)
	var handler;
	router.forEach(function (route) {
		if (route.method == message.method && route.path == message.path) {
			handler = route.handler;
		}
	});
	handler && handler(message.query, function (err, response) {
		if (err){
			return console.log(err)
		}
		cb(null, response);
	});
});
*/