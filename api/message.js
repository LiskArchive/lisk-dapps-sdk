module.exports = function (query, library, modules, cb) {
	library.bus.message("message", query)
}