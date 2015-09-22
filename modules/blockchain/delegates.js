var extend = require('extend');
var util = require('util');
var crypto = require('crypto-browserify');
var bignum = require('browserify-bignum');

var private = {}, self = null,
	library = null, modules = null;

private.delegates = {};
private.u_delegates = {};

function Delegates(cb, _library) {
	self = this;
	library = _library;

	cb(null, self);
}

function applyDiff(source, diff) {
	var res = source ? source.slice() : [];

	for (var i = 0; i < diff.length; i++) {
		var math = diff[i][0];
		var val = diff[i].slice(1);

		if (math == "+") {
			res = res || [];

			var index = -1;
			if (res) {
				index = res.indexOf(val);
			}
			if (index != -1) {
				return false;
			}

			res.push(val);
		}
		if (math == "-") {
			var index = -1;
			if (res) {
				index = res.indexOf(val);
			}
			if (index == -1) {
				return false;
			}
			res.splice(index, 1);
			if (!res.length) {
				res = null;
			}
		}
	}
	return res;
}

Delegates.prototype.getDelegates = function (cb, height, scope) {
	cb(null, (scope || private).delegates[height]);
}

private.mergeDelegates = function (delegates, list, height, cb, scope) {
	var lastHeight = Math.max.apply(null, Object.keys(delegates));

	if (delegates[height]){
		return ("Delegate list exists")
	}

	delegates[height] = applyDiff(delegates[lastHeight], list);

	cb(null, delegates[height]);
}

private.undoLast = function (delegates, cb, scope) {
	var lastHeight = Math.max.apply(null, Object.keys(delegates));
	if (lastHeight == 1){
		return ("Genesis block is readonly")
	}
	delete delegates[lastHeight];
	lastHeight = Math.max.apply(null, Object.keys(delegates));

	cb(null, delegates[lastHeight]);
}

Delegates.prototype.mergeDelegates = function (list, height, cb, scope) {
	var delegates = (scope || private).delegates;
	private.mergeDelegates(delegates, list, height, cb, scope);
}

Delegates.prototype.mergeU_Delegates = function (list, height, cb, scope) {
	var delegates = (scope || private).u_delegates;
	private.mergeDelegates(delegates, list, height, cb, scope);
}

Delegates.prototype.undoLast = function (cb, scope) {
	var delegates = (scope || private).delegates;

	private.undoLast(delegates, cb, scope);
}

Delegates.prototype.undoU_Last = function (cb, scope) {
	var delegates = (scope || private).u_delegates;

	private.undoLast(delegates, cb, scope);
}

Delegates.prototype.onBind = function (_modules) {
	modules = _modules;
}

module.exports = Delegates;