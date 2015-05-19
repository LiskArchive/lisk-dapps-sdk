var sandbox = process.binding('sandbox');
var router = require('./api/routes.js');

sandbox.onMessage(function (message) {
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
		sandbox.sendMessage(response);
	});
});