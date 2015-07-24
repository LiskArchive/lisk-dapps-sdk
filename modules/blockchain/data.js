var private = {};
private.library = null;
private.modules = null;

function Data(cb, library) {
	private.library = library;
	cb(null, this);
}

Data.prototype.getUnconfirmedList = function(){
	return [];
}

Data.prototype.onBind = function (modules) {
	private.modules = modules;
}

module.exports = Data;