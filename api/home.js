module.exports = function (query, library, modules, cb) {
	setTimeout(function () {
		cb(null, {
			test: "Hello, world!"
		});
	}, 100);
}