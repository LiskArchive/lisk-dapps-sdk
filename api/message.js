module.exports = function (query, modules, cb) {
	modules.transport.message(query, function () {

	});
	modules.background.onMessage(query);
}