/*var codius = process.binding('async'),
	routes = require('./api/routes.js'),
	jayson = require('jayson'),
	config = require('./config.json');

var server = jayson.server({
	api: function(route, method, body, callback) {
		var router = routes.filter(function (r) {
			return (r.route == route && r.method == method);
		});

		router(body, function (result) {
			return callback(null, result);
		});
	}
});

console.log(config.jayson_port)
server.http().listen(config.jayson_port);
console.log("launched");
*/

var http = require('http');

var server = http.createServer(function(req, res){
});

server.listen(8000);