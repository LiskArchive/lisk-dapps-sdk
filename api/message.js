module.exports = function (query, cb) {
	setTimeout(function () {
		cb(null, {
			msg: "Incoming message",
			body: query
		});
	}, 100);
}