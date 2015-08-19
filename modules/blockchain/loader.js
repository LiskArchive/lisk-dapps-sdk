var private = {}, self = null,
	library = null, modules = null;

function Loader(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
}

Loader.prototype.onBind = function (_modules) {
	modules = _modules;
}

Loader.prototype.onBlockchainReady = function () {

}

Loader.prototype.onMessage = function (msg) {

}

module.exports = Loader;