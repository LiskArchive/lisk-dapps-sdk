var private = {};
private.sandbox = null;

function Accounts(sandbox) {
	private.sandbox = sandbox;
}

Accounts.prototype.open = function (secret, cb) {
	var message = {
		call: "accounts#open",
		args: {
			secret: secret
		}
	};

	private.sandbox.sendMessage(message, cb);
}

module.exports = Accounts;