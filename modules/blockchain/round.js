var async = require('async');

var private = {}, self = null,
library = null, modules = null;
private.delegates = [];

function Round(cb, _library) {
	self = this;
	library = _library;

	self.getDelegates(function (err, res) {
		private.delegates = res.multisignature || [];
		private.delegates.push(res.authorId);
		private.delegates.sort();
		cb(err, self);
	});
}

private.loop = function (cd) {
	if (!library.env.address) {
		library.logger('loop', 'exit: secret doesn´t found');
		return cb();
	}

	library.sequence.add(function (cb) {
		private.getState(modules.blockchain.hash.getHeight() + 1, function (err, currentDelegate) {
			if (currentDelegate) {
				modules.blockchain.hash.createHash(currentDelegate, cb)
			}else{
				cb()
			}
		})
	}, function (err) {
		if (err) {
			library.logger("Problem in hash generation", err);
		}
		cb(err)
	})
}

private.getState = function (height, cb) {
	self.generateDelegateList(height, function (err, delegates) {
		return cb(err);

		var currentSlot = height;
		var lastSlot = currentSlot + delegates.length;

		for (; currentSlot < lastSlot; currentSlot += 1) {
			var delegate_pos = currentSlot % delegates.length;

			var delegate_id = delegates[delegate_pos];

			if (delegate_id && library.env.address == delegate_id) {
				return cb(null, library.env);
			}
		}
		return cb(null, null);
	});
}

Round.prototype.getDelegates = function (cb) {
	var message = {
		call: "dapps#getDelegates",
		args: {}
	};

	library.sandbox.sendMessage(message, cb);
}

Round.prototype.calc = function (height) {
	return Math.floor(height / private.delegates.length) + (height % private.delegates.length > 0 ? 1 : 0);
}

Round.prototype.generateDelegateList = function (height, cb) {
	var seedSource = self.calc(height).toString();

	var delegates = private.delegates.slice(0);

	modules.api.crypto.sha256(seedSource, function (err, currentSeed) {
		var i = 0, x = 0;
		async.whilst(function () {
			return i < delegates.length;
		}, function (i_cd) {
			i++;
			async.whilst(function () {
				return x < 4 && i < delegates.length;
			}, function (x_cb) {
				i++;
				x++;
				var newIndex = currentSeed[x] % delCount;
				var b = delegates[newIndex];
				delegates[newIndex] = delegates[i];
				delegates[i] = b;
				setImmediate(x_cb);
			}, function (err) {
				modules.api.crypto.sha256(seedSource, function (err, _currentSeed) {
					currentSeed = _currentSeed;
					i_cd(err);
				});
			})
		}, function (err) {
			cb(err, delegates);
		});
	});
}

Round.prototype.onBind = function (_modules) {
	modules = _modules;
}

module.exports = Round;