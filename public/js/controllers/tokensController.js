angular.module('tokenApp').controller('tokensController', ['userService', 'authService', '$scope', "$timeout", "ngTableParams", "$http", "$filter", "idFactory", "$mdDialog", "$mdMedia", "$state",
    function (userService, authService, $scope, $timeout, ngTableParams, $http, $filter, idFactory, $mdDialog, $mdMedia, $state) {
        var user = userService.getUser();

        $scope.totalTokens = 0;

        $scope.logout = function () {
            $state.go('main.login');
        }

        function DialogController($scope, $mdDialog, $http, idFactory) {
            $scope.sending = false;
            $scope.error = '';
            $scope.secret = user.secret;
            $scope.newToken = {
                name: '',
                description: '',
                amount: 1,
                secret: user.secret
            }
            $scope.hide = function () {
                if (!$scope.sending) {
                    $mdDialog.hide();
                }
            };
            $scope.cancel = function () {
                if (!$scope.sending) {
                    $mdDialog.cancel();
                }
            };
            $scope.create = function () {
                if (!$scope.sending) {
                    $scope.sending = true;
                    $scope.error = '';
                    $http.put('/api/dapps/' + idFactory + '/api/tokens', {
                        secret: $scope.newToken.secret,
                        name: $scope.newToken.name,
                        description: $scope.newToken.description,
                        fund: $scope.newToken.amount
                    }).then(function (resp) {

                        if (resp.data.success) {
                            $mdDialog.hide(true);
                        }
                        else {
                            $scope.sending = false;
                            $scope.error = resp.data.error;
                        }
                    }.bind(this));
                }

            };
        };

        function SendDialog($scope, $mdDialog, $http, idFactory, token) {
            $scope.error = '';
            $scope.sending = false;
            $scope.secret = user.secret;
            $scope.transaction = {
                recipientId: '',
                amount: 1,
                secret: user.secret,
                token: token
            }
            $scope.hide = function () {
                if (!$scope.sending) {
                    $mdDialog.hide();
                }
            };
            $scope.cancel = function () {
                if (!$scope.sending) {
                    $mdDialog.cancel();
                }
            };
            $scope.send = function () {
                if (!$scope.sending) {
                    $scope.error = '';
                    $scope.sending = true;
                    $http.put('/api/dapps/' + idFactory + '/api/transaction', {
                        secret: $scope.transaction.secret,
                        amount: $scope.transaction.amount,
                        recipientId: $scope.transaction.recipientId,
                        token: $scope.transaction.token
                    }).then(function (resp) {

                        if (resp.data.success) {
                            $mdDialog.hide(true);
                        }
                        else {
                            $scope.sending = false;
                            $scope.error = resp.data.error;
                        }
                    }.bind(this));
                }

            };
        };


        $scope.status = '  ';
        $scope.customFullscreen = $mdMedia('xs') || $mdMedia('sm');

        $scope.showAdvanced = function (ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs')) && $scope.customFullscreen;
            $mdDialog.show({
                    clickOutsideToClose: false,
                    controller: DialogController,
                    templateUrl: 'partials/modals/createToken.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    fullscreen: useFullScreen
                })
                .then(function (answer) {
                    if (answer) {
                        console.log('can update');
                        $scope.updateBlocks();
                    }

                }, function () {

                });
            $scope.$watch(function () {
                return $mdMedia('xs') || $mdMedia('sm');
            }, function (wantsFullScreen) {
                $scope.customFullscreen = (wantsFullScreen === true);
            });
        };

        $scope.sendAmount = function (ev, token, tokenId) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs')) && $scope.customFullscreen;
            $mdDialog.show({
                    clickOutsideToClose: false,
                    controller: SendDialog,
                    templateUrl: 'partials/modals/send.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    fullscreen: useFullScreen,
                    locals: {
                        token: token
                    }
                })
                .then(function (answer) {
                    if (answer) {
                        console.log('can update');
                        $scope.updateBlocks();
                    }

                }, function () {

                });
            $scope.$watch(function () {
                return $mdMedia('xs') || $mdMedia('sm');
            }, function (wantsFullScreen) {
                $scope.customFullscreen = (wantsFullScreen === true);
            });
        };


        function filterData(data, filter) {
            return $filter('filter')(data, filter)
        }

        function orderData(data, params) {
            return params.sorting() ? $filter('orderBy')(data, params.orderBy()) : filteredData;
        }

        function sliceData(data, params) {
            return data.slice((params.page() - 1) * params.count(), params.page() * params.count())
        }

        function transformData(data, filter, params) {
            return sliceData(orderData(filterData(data, filter), params), params);
        }

        var service = {
            cachedData: [],
            getData: function ($defer, params, filter) {
                if (false) {
                    var filteredData = filterData(service.cachedData, filter);
                    var transformedData = sliceData(orderData(filteredData, params), params);
                    params.total(filteredData.length)
                    $defer.resolve(transformedData);
                }
                else {
                    $scope.fetch = true;
                    $http.get('/api/dapps/' + idFactory + '/api/tokens').success(function (resp) {
                        angular.copy(resp.response.tokens, service.cachedData)
                        params.total(resp.response.tokens.length)
                        $scope.totalTokens = resp.response.tokens.length;
                        var filteredData = $filter('filter')(resp.response.tokens, filter);
                        var transformedData = transformData(resp.response.tokens, filter, params)
                        $defer.resolve(transformedData);
                    });
                }

            }
        };

        //tableTokens
        $scope.tableTokens = new ngTableParams({
            page: 1,
            count: 6,
            sorting: {
                name: 'asc'
            }
        }, {
            total: 0,
            counts: [],
            getData: function ($defer, params) {
                service.getData($defer, params, $scope.filter);
            }
        });

        $scope.tableTokens.settings().$scope = $scope;

        $scope.$watch("filter.$", function () {
            $scope.tableTokens.reload();
        });

        $scope.updateBlocks = function () {
            console.log('updating');
            $scope.tableTokens.reload();
        };

        //end tableTokens

    }]);


