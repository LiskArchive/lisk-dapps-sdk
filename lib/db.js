var sandbox;

function Database(sandbox) {
	sandbox = sandbox;
}

Database.prototype.open = function () {
	// open database
}

Database.prototype.query = function () {
	// run query
}

Database.prototype.close = function () {
	// close database
}

module.exports = Database;