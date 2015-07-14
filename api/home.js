module.exports = function (query, cb) {
	setTimeout(function () {
		cb(null, {
			test: "Hello, world!"
		});
	}, 100);
}