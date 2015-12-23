angular.module('tokenApp').service('authService', ['$state', 'idFactory', '$http', 'userService', function ($state, idFactory, $http, userService) {
	this.setLogged = function (secret, remember) {
		$http.post('/api/dapps/' + idFactory + '/api/openAccount', {
			secret: secret
		}).then(function (resp) {
			if (resp.data.success) {
				var user = resp.data.response.account;
				user.secret = remember ? secret: null;
				console.log(	user.secret);
				userService.setUser(user);

				this.isLogged = true;
				$state.go('main.tokens');
			}
		}.bind(this));
	}

	this.setUnlogged = function () {
		userService.clearUser();
		this.isLogged = false;
		$state.go('main.login');
	}
}]);