var private = {};
private.library = null;
private.modules = null;

function Hash(cb, library) {
	private.library = library;
	cb(null, this);
}

module.exports = Hash;