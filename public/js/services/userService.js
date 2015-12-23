angular.module('tokenApp').service('userService', [function () {
    this.setUser = function (user) {
        this.user = user;
    }
    this.getUser = function () {
       return this.user;
    }
    this.clearUser = function () {
        delete this.user;
    }
}]);