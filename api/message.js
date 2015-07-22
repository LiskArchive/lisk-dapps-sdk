module.exports = function (query, modules, cb) {
	console.log("input peer", query)
	modules.transport.message(query, function () {

	});
	modules.background.onMessage(query);
}