function beginEpochTime() {
	var d = new Date(Date.UTC(2015, 2, 6, 0, 0, 0, 0));
	return d;
}

function getEpochTime(time) {
	if (time === undefined) {
		time = (new Date()).getTime();
	}
	var d = beginEpochTime();
	var t = d.getTime();
	return Math.floor((time - t) / 1000);
}


module.exports = {
	interval: 10,
	delegates: 101,

	getTime: function (time) {
		return getEpochTime(time);
	},

	getNow: function () {
		return getEpochTime(new Date().getTime())
	},

	getRealTime: function (epochTime) {
		if (epochTime === undefined) {
			epochTime = this.getTime()
		}
		var d = beginEpochTime();
		var t = Math.floor(d.getTime() / 1000) * 1000;
		return t + epochTime * 1000;
	},
}