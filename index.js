var codius = process.binding('async'),
	routes = require('./api/routes.js'),
	config = require('./config.json');

console.log('started');

codius.onMessage(function (msg) {
	codius.postMessage({
		type: 'api',
		api: 'fs',
		method: 'readFile',
		data: [ 'sandbox.js' ]
	}, function (err) {
	});
});

setInterval(function () {
	console.log("working...");
}, 1000);

console.log("ended");