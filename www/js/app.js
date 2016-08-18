var app = angular.module('intranet', ['ngRoute', 'ngAnimate', 'platanus.rut', 'angularFileUpload', 'simplePagination']);
app.config(function ($routeProvider, $locationProvider) {

    $locationProvider.html5Mode(true).hashPrefix('!');

    $routeProvider
            .when('/', {
                templateUrl: 'templates/auth/init.html',
                controller: 'auth-init'
            })
            .when('/signin', {
                templateUrl: 'templates/auth/signin.html',
                controller: 'auth-signin'
            })
            .when('/recovery', {
                templateUrl: 'templates/auth/recovery.html',
                controller: 'auth-recovery'
            })
            .when('/app', {
                templateUrl: 'templates/app.html',
                controller: 'app'
            })
            .otherwise({
                redirectTo: '/'
            });
});
app.run(function ($http) {
    $http.get('http://mindicador.cl/api/uf', {}).success(function (response) {
        sessionStorage.uf = response.serie[0].valor;
    });
});
app.filter('originalname', function () {
    return function (input) {
        input = input.split('-');
        input = input.splice(1);
        return input.join('-');
    };
});
app.filter('convert2UF', function () {
    return function (input) {
        if (sessionStorage.uf) {
            input = input.replace(',', '.');
            input = parseFloat(input);
            input = input * parseFloat(sessionStorage.uf);
        }
        return input;
    };
});