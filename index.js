var codius = process.binding('async'),
	routes = require('./api/routes.js'),
	config = require('./config.json');

setInterval(function () {
	console.log("dapp working");
}, 3000);