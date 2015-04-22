var codius = process.binding('async');
var message = {
	type: 'api',
	api: 'fs',
	method: 'test',
	data: [ 'sandbox.js' ]
};

codius.postMessage(JSON.stringify(message), function (error, result) {
	console.log(error, result);
});