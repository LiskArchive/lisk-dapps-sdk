module.exports = {
	"api/accounts": require('./api/accounts.js'),
	"api/blocks": require('./api/blocks.js'),
	"api/contacts": require('./api/contacts.js'),
	"api/crypto": require('./api/crypto.js'),
	"api/delegates": require('./api/delegates.js'),
	"api/loader": require('./api/loader.js'),
	"api/multisignatures": require('./api/multisignatures.js'),
	"api/peer": require('./api/peer.js'),
	"api/signatures": require('./api/signatures.js'),
	"api/sql": require('./api/sql.js'),
	"api/transactions": require('./api/transactions.js'),
	"api/transport": require('./api/transport.js'),

	"blockchain/base": require('./blockchain/base.js'),
	"blockchain/blocks": require('./blockchain/blocks.js'),
	"blockchain/round": require('./blockchain/round.js'),
	"blockchain/transactions": require('./blockchain/transactions.js'),

	"system/background": require('./system/background.js'),
	"system/api": require('./system/api.js')
}