var private = {};
private.library = null;
private.modules = null;

function Data(cb, library) {
	private.library = library;
	cb(null, this);
}

module.exports = Data;