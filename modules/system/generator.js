var fs = require('fs');

var private = {}, self = null,
library = null, modules = null;

private.genesisBlock = null;

function Generator(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
}

private.getGenesis = function (cb) {
	var message = {
		call: "dapps#getGenesis",
		args: {}
	};

	library.sandbox.sendMessage(message, cb);
}

private.saveGenesis = function () {
	fs.writeFile(outputFilename, JSON.stringify(myData, null, 4), function(err) {
    if(err) {
      console.log(err);
    } else {
      console.log("JSON saved to " + outputFilename);
    }
});
}

Generator.prototype.onBind = function (_modules) {
	modules = _modules;

	private.getGenesis(function (err, res) {
		if (!err) {
			private.genesisBlock = {
				associate: res.associate,
				authorId: res.authorId,
				pointId: res.pointId,
				pointHeight: res.pointHeight
			}

			cb(err, self);
		} else {
			cb(err);
		}
	});
}

module.exports = Generator;