angular.module('tokenApp').controller('loginController', ['authService', 'userService', '$scope',
    function (authService, userService, $scope) {
        $scope.pass = "";
        $scope.remember = true;
        $scope.login = function(pass, remember) {
            if (pass.trim() != ""){
                authService.setLogged(pass, remember);
            }
        }
    }]);