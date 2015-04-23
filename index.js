var codius = process.binding('async'),
	routes = require('./api/routes.js'),
	config = require('./config.json');

var stdin = process.openStdin();

var data = "";

stdin.on('data', function(chunk) {
	data += chunk;
	console.log("data");
});

stdin.on('end', function() {
	console.log("DATA:\n" + data + "\nEND DATA");
});