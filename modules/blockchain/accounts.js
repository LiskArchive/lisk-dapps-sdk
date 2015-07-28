var private = {}, self = null,
library = null, modules = null;

function Accounts(cb, _library) {
	self = this;
	library = _library;

	cb(err, self);
}

Accounts.prototype.onBind = function (_modules) {
	modules = _modules;
}

module.exports = Accounts;