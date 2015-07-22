module.exports = function (query, library, modules, cb) {
	modules.transport.message(query, function () {

	});
	console.log("message", query)
	library.bus.message("message", query)
}