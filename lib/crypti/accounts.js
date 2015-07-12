var sandbox = null;

function Accounts(sandbox) {
	sandbox = sandbox;
}

Accounts.prototype.open = function (secret, cb) {
	var message = {
		call: "accounts#open",
		args: {
			secret: secret
		}
	};

	sandbox.sendMessage(JSON.stringify(message), cb);
}