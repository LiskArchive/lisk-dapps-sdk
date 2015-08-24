var private = {}, self = null,
	library = null, modules = null;

function Generator(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
}

Generator.prototype.onBind = function (_modules) {
	modules = _modules;

	modules.api.dapps.getGenesis(function (err, res) {
		if (err) {
			return console.log(err)
		}

		var executor = modules.blockchain.accounts.getExecutor();
		if (res.authorId == executor.address) {

		}
		var q = {
			associate: res.associate
		}

		var genesisBlock = {
			delegate: executor.keypair.publicKey,
			pointId: res.pointId,
			pointHeight: res.pointHeight,
			count: 0,
			transactions: []
		}

		var blockBytes = modules.logic.block.getBytes(genesisBlock);

		genesisBlock.id = modules.api.crypto.getId(blockBytes);
		genesisBlock.signature = modules.api.crypto.sign(executor.keypair, blockBytes);

		console.log(JSON.stringify(genesisBlock, null, 2))
	});
}

module.exports = Generator;