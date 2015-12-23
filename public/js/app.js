tokenApp = angular.module('tokenApp', ['ui.router', 'ngMaterial', 'ngTable', 'ngAnimate', 'ngMessages']);

tokenApp.config([
    "$locationProvider",
    "$stateProvider",
    "$urlRouterProvider", "$mdThemingProvider",
    function ($locationProvider, $stateProvider, $urlRouterProvider, $mdThemingProvider) {
        $mdThemingProvider.definePalette('amazingPaletteName', {
            '50': 'ffebee',
            '100': 'ffcdd2',
            '200': 'ef9a9a',
            '300': 'e57373',
            '400': 'ef5350',
            '500': 'b8b8b8',
            '600': 'e53935',
            '700': 'd32f2f',
            '800': 'c62828',
            '900': 'b71c1c',
            'A100': 'ff8a80',
            'A200': 'ff5252',
            'A400': 'ff1744',
            'A700': 'd50000',
            'contrastDefaultColor': 'light',    // whether, by default, text (contrast)
                                                // on this palette should be dark or light
            'contrastDarkColors': ['50', '100', //hues which contrast should be 'dark' by default
                '200', '300', '400', 'A100'],
            'contrastLightColors': undefined    // could also specify this if default was 'dark'
        });
        $mdThemingProvider.theme('default')
            .primaryPalette('amazingPaletteName')
        $locationProvider.html5Mode({
            enabled: false,
            requireBase: false
        });
        $urlRouterProvider.otherwise("/login");
        $stateProvider
            .state('main', {
                abstract: true,
                templateUrl: "partials/app-template.html",
                controller: "appController"
            })
            .state('main.login', {
                url: "/login",
                templateUrl: "partials/login.html",
                controller: "loginController"
            })
            .state('main.tokens', {
                url: "/tokens",
                templateUrl: "partials/tokens.html",
                controller: "tokensController"
            })

    }
]);

tokenApp.run(function ($rootScope, $location, $state, authService, idFactory) {

    $rootScope.appID = idFactory;

    angular.element(document).on("click", function (e) {
        $rootScope.$broadcast("documentClicked", angular.element(e.target));
    });

    $rootScope.$on('$stateChangeStart', function (e, toState, toParams, fromState, fromParams) {

        var isLogin = toState.name === "main.login";
        if (isLogin || authService.isLogged) {
            return; // no need to redirect
        }
        e.preventDefault(); // stop current execution
        $state.go('main.login'); // go to login

    });
});