module.exports = function (query, library, modules, cb) {
	modules.transport.message(query.topic, query.message, function () {

	});
	library.bus.message("message", query)
}