module.exports = function (query, modules, cb) {
	setTimeout(function () {
		cb(null, {
			test: "Hello, world!"
		});
	}, 100);
}