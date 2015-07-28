var private = {}, self = null,
library = null, modules = null;
private.types = {};

//constructor
function Base(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
}

//public methods
Base.prototype.create = function (data) {
	if (!private.types[data.type]) {
		throw Error('Unknown transaction type ' + data.type);
	}

	if (!data.sender) {
		throw Error("Can't find sender");
	}

	if (!data.keypair) {
		throw Error("Can't find keypair");
	}

	var trs = {
		type: data.type,
		amount: 0,
		senderPublicKey: data.sender.publicKey,
		timestamp: slots.getTime(),
		asset: {}
	};

	trs = private.types[trs.type].create.call(this, data, trs);

	trs.signature = self.sign(data.keypair, trs);

	if (data.sender.secondSignature && data.secondKeypair) {
		trs.signSignature = self.sign(data.secondKeypair, trs);
	}

	trs.id = self.getId(trs);

	trs.fee = private.types[trs.type].calculateFee.call(this, trs) || false;

	return trs;
}

Base.prototype.attachAssetType = function (typeId, instance) {
	if (instance && typeof instance.create == 'function' && typeof instance.getBytes == 'function' &&
		typeof instance.calculateFee == 'function' && typeof instance.verify == 'function' &&
		typeof instance.apply == 'function' && typeof instance.undo == 'function' &&
		typeof instance.applyUnconfirmed == 'function' && typeof instance.undoUnconfirmed == 'function' &&
		typeof instance.ready == 'function' && typeof instance.process == 'function'
	) {
		private.types[typeId] = instance;
	} else {
		throw Error('Invalid instance interface');
	}
}

Base.prototype.sign = function (keypair, trs) {
	var hash = self.getHash(trs);
	return ed.Sign(hash, keypair).toString('hex');
}

Base.prototype.getId = function (trs) {
	var hash = self.getHash(trs);
	var temp = new Buffer(8);
	for (var i = 0; i < 8; i++) {
		temp[i] = hash[7 - i];
	}

	var id = bignum.fromBuffer(temp).toString();
	return id;
}

Base.prototype.getHash = function (trs) {
	return crypto.createHash('sha256').update(self.getBytes(trs)).digest();
}

Base.prototype.getBytes = function (trs, skipSignature) {
	if (!private.types[trs.type]) {
		throw Error('Unknown transaction type ' + trs.type);
	}

	try {
		var assetBytes = private.types[trs.type].getBytes.call(this, trs, skipSignature);
		var assetSize = assetBytes ? assetBytes.length : 0;

		var bb = new ByteBuffer(1 + 4 + 32 + 8 + 8 + 64 + 64 + assetSize, true);
		bb.writeByte(trs.type);
		bb.writeInt(trs.timestamp);

		var senderPublicKeyBuffer = new Buffer(trs.senderPublicKey, 'hex');
		for (var i = 0; i < senderPublicKeyBuffer.length; i++) {
			bb.writeByte(senderPublicKeyBuffer[i]);
		}

		if (trs.recipientId) {
			var recipient = trs.recipientId.slice(0, -1);
			recipient = bignum(recipient).toBuffer({size: 8});

			for (var i = 0; i < 8; i++) {
				bb.writeByte(recipient[i] || 0);
			}
		} else {
			for (var i = 0; i < 8; i++) {
				bb.writeByte(0);
			}
		}

		bb.writeLong(trs.amount);

		if (assetSize > 0) {
			for (var i = 0; i < assetSize; i++) {
				bb.writeByte(assetBytes[i]);
			}
		}

		if (!skipSignature && trs.signature) {
			var signatureBuffer = new Buffer(trs.signature, 'hex');
			for (var i = 0; i < signatureBuffer.length; i++) {
				bb.writeByte(signatureBuffer[i]);
			}
		}

		bb.flip();
	} catch (e) {
		throw Error(e.toString());
	}
	return bb.toBuffer();
}

Base.prototype.process = function (trs, sender, cb) {
	if (!private.types[trs.type]) {
		return setImmediate(cb, 'Unknown transaction type ' + trs.type);
	}

	if (!self.ready(trs, sender)) {
		return setImmediate(cb, "Transaction is not ready: " + trs.id);
	}

	try {
		var txId = self.getId(trs);
	} catch (e) {
		return setImmediate(cb, "Invalid transaction id");
	}
	if (trs.id && trs.id != txId) {
		return setImmediate(cb, "Invalid transaction id");
	} else {
		trs.id = txId;
	}

	if (!sender) {
		return setImmediate(cb, "Can't process transaction, sender not found");
	}

	trs.senderId = sender.address;

	if (!self.verifySignature(trs, trs.senderPublicKey, trs.signature)) {
		return setImmediate(cb, "Can't verify signature");
	}

	private.types[trs.type].process.call(this, trs, sender, function (err, trs) {
		if (err) {
			return setImmediate(cb, err);
		}

		self.scope.dbLite.query("SELECT count(id) FROM trs WHERE id=$id", {id: trs.id}, {"count": Number}, function (err, rows) {
			if (err) {
				return cb("Internal sql error");
			}

			var res = rows.length && rows[0];

			if (res.count) {
				return cb("Can't process transaction, transaction already confirmed");
			}

			cb(null, trs);
		});
	}.bind(this));
}

Base.prototype.verify = function (trs, sender, cb) { //inheritance
	if (!private.types[trs.type]) {
		return setImmediate(cb, 'Unknown transaction type ' + trs.type);
	}

	if (!self.ready(trs, sender)) {
		return setImmediate(cb, "Transaction is not ready: " + trs.id);
	}

	//check sender
	if (!sender) {
		return setImmediate(cb, "Can't find sender");
	}

	//verify signature
	try {
		var valid = self.verifySignature(trs, trs.senderPublicKey, trs.signature);
	} catch (e) {
		return setImmediate(cb, e.toString());
	}
	if (!valid) {
		return setImmediate(cb, "Can't verify signature");
	}

	//verify second signature
	if (sender.secondSignature) {
		try {
			var valid = self.verifySecondSignature(trs, sender.secondPublicKey, trs.signSignature);
		} catch (e) {
			return setImmediate(cb, e.toString());
		}
		if (!valid) {
			return setImmediate(cb, "Can't verify second signature: " + trs.id);
		}
	}

	for (var s = 0; s < sender.multisignatures.length; s++) {
		var verify = false;

		if (trs.signatures) {
			for (var d = 0; d < trs.signatures.length && !verify; d++) {
				if (self.verifySecondSignature(trs, sender.multisignatures[s], trs.signatures[d])) {
					verify = true;
				}
			}
		}

		if (!verify) {
			return setImmediate(cb, "Failed multisignature: " + trs.id);
		}
	}

	//check sender
	if (trs.senderId != sender.address) {
		return setImmediate(cb, "Invalid sender id: " + trs.id);
	}

	//calc fee
	var fee = private.types[trs.type].calculateFee.call(this, trs) || false;
	if (!fee || trs.fee != fee) {
		return setImmediate(cb, "Invalid transaction type/fee: " + trs.id);
	}
	//check amount
	if (trs.amount < 0 || trs.amount > 100000000 * constants.fixedPoint || String(trs.amount).indexOf('.') >= 0 || trs.amount.toString().indexOf('e') >= 0) {
		return setImmediate(cb, "Invalid transaction amount: " + trs.id);
	}
	//check timestamp
	if (slots.getSlotNumber(trs.timestamp) > slots.getSlotNumber()) {
		return setImmediate(cb, "Invalid transaction timestamp");
	}

	//spec
	private.types[trs.type].verify.call(this, trs, sender, cb);
}

Base.prototype.verifySignature = function (trs, publicKey, signature) {
	if (!private.types[trs.type]) {
		throw Error('Unknown transaction type ' + trs.type);
	}

	if (!signature) return false;

	try {
		var bytes = self.getBytes(trs, true, true);
		var res = self.verifyBytes(bytes, publicKey, signature);
	} catch (e) {
		throw Error(e.toString());
	}

	return res;
}

Base.prototype.verifyBytes = function (bytes, publicKey, signature) {
	try {
		var data2 = new Buffer(bytes.length);

		for (var i = 0; i < data2.length; i++) {
			data2[i] = bytes[i];
		}

		var hash = crypto.createHash('sha256').update(data2).digest();
		var signatureBuffer = new Buffer(signature, 'hex');
		var publicKeyBuffer = new Buffer(publicKey, 'hex');
		var res = ed.Verify(hash, signatureBuffer || ' ', publicKeyBuffer || ' ');
	} catch (e) {
		throw Error(e.toString());
	}

	return res;
}

Base.prototype.apply = function (trs, sender, cb) {
	if (!private.types[trs.type]) {
		return setImmediate(cb, 'Unknown transaction type ' + trs.type);
	}

	if (!self.ready(trs, sender)) {
		return setImmediate(cb, "Transaction is not ready: " + trs.id);
	}

	var amount = trs.amount + trs.fee;

	if (trs.blockId != genesisblock.block.id && sender.balance < amount) {
		return setImmediate(cb, "Balance has no XCR: " + trs.id);
	}

	self.scope.account.merge(sender.address, {balance: -amount}, function (err, sender) {
		if (err) {
			return cb(err);
		}

		private.types[trs.type].apply.call(this, trs, sender, function (err) {
			if (err) {
				self.scope.account.merge(sender.address, {balance: amount}, cb);
			} else {
				setImmediate(cb);
			}
		}.bind(this));
	}.bind(this));
}

Base.prototype.undo = function (trs, sender, cb) {
	if (!private.types[trs.type]) {
		return setImmediate(cb, 'Unknown transaction type ' + trs.type);
	}

	var amount = trs.amount + trs.fee;

	self.scope.account.merge(sender.address, {balance: amount}, function (err, sender) {
		if (err) {
			return cb(err);
		}

		private.types[trs.type].undo.call(this, trs, sender, function (err) {
			if (err) {
				self.scope.account.merge(sender.address, {balance: amount}, cb);
			} else {
				setImmediate(cb);
			}
		}.bind(this));
	}.bind(this));
}

Base.prototype.applyUnconfirmed = function (trs, sender, cb) {
	if (!private.types[trs.type]) {
		return setImmediate(cb, 'Unknown transaction type ' + trs.type);
	}

	if (sender.secondSignature && !trs.signSignature) {
		return setImmediate(cb, 'Failed second signature: ' + trs.id);
	}

	if (!sender.secondSignature && (trs.signSignature && trs.signSignature.length > 0)) {
		return setImmediate(cb, "Account doesn't have second signature");
	}

	var amount = trs.amount + trs.fee;

	if (sender.u_balance < amount && trs.blockId != genesisblock.block.id) {
		return setImmediate(cb, 'Account has no balance: ' + trs.id);
	}

	self.scope.account.merge(sender.address, {u_balance: -amount}, function (err, sender) {
		if (err) {
			return cb(err);
		}

		private.types[trs.type].applyUnconfirmed.call(this, trs, sender, function (err) {
			if (err) {
				self.scope.account.merge(sender.address, {u_balance: amount}, function (err2) {
					cb(err);
				});
			} else {
				setImmediate(cb, err);
			}
		}.bind(this));
	}.bind(this));
}

Base.prototype.undoUnconfirmed = function (trs, sender, cb) {
	if (!private.types[trs.type]) {
		return setImmediate(cb, 'Unknown transaction type ' + trs.type);
	}

	var amount = trs.amount + trs.fee;

	self.scope.account.merge(sender.address, {u_balance: amount}, function (err, sender) {
		if (err) {
			return cb(err);
		}

		private.types[trs.type].undoUnconfirmed.call(this, trs, sender, function (err) {
			if (err) {
				self.scope.account.merge(sender.address, {u_balance: -amount}, cb);
			} else {
				setImmediate(cb, err);
			}
		}.bind(this));
	}.bind(this));
}

Base.prototype.onBind = function (_modules) {
	modules = _modules;
}

//export
module.exports = Base;