angular.module('tokenApp').factory('idFactory', ['$location',  function ($location) {
	var url = $location.absUrl();
	var parts = url.split('/');
	var dappId = parts[parts.indexOf('dapps') + 1];
	return dappId;
}]);