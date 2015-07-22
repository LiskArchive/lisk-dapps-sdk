var private = {};
private.library = null;
private.modules = null;

function Round(cb, library) {
	private.library = library;
	cb(null, this);
}

module.exports = Round;