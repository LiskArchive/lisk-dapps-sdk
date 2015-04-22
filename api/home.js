module.exports = function (body, cb) {
	console.log("Hello, world!");
	return cb({
		success: true,
		message: "Hello, world!"
	});
}