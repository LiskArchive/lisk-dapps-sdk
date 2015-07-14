function BackgroundProcess() {

}

BackgroundProcess.prototype.onRun = function (sandbox) {
	sandbox.sendMessage({
		call: "loader#status",
		args: ""
	}, function (err, data) {
		console.log(err, data)
	});
}

module.exports = new BackgroundProcess();