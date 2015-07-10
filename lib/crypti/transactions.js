/*
	Crypti transactions API calls
 */

var sandbox = null;

function Transactions(sandbox) {
	sandbox = sandbox;
}

Transactions.prototype.get = function (id) {
	// get transaction by id
}

Transactions.prototype.put = function (data) {
	// put transaction
}

Transactions.prototype.find = function (query) {
	// find transactions by query with limit (pipe limit is 64kb)
}

module.exports = Transactions;