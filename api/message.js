module.exports = function (query, modules, cb) {
	modules.background.onMessage(query);
	cb();
}