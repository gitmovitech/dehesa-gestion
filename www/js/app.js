var showPopover = function (elem) {
    var detalle = jQuery(elem).data('popover-content');
    var text = '<p>ADT: ' + detalle.adt + ' UF - (' + $filter('currency')(parseFloat(detalle.adt) * valoruf) + ')</p>';
    if (detalle.modelo)
        text += '<p>' + detalle.modelo.nombre + ': ' + detalle.modelo.valor + ' UF - (' + $filter('currency')(detalle.modelo.valor.replace(',', '.') * valoruf) + ')</p>';
    if (detalle.servicios) {
        for (var x in detalle.servicios) {
            text += '<p>' + detalle.servicios[x].nombre + ': ' + detalle.servicios[x].valor + ' UF - (' + $filter('currency')(detalle.servicios[x].valor.replace(',', '.') * valoruf) + ')</p>';
        }
    }
    jQuery(this).popover({
        title: 'Detalle de la tarifa',
        html: true,
        content: text,
        placement: 'right',
        trigger: 'focus'
    });
}
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