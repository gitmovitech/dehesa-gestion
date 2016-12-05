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
app.run(function ($http, Session) {
    $http.get('/api/data', {
        params: {
            token: Session.get(),
            collection: 'modelos'
        }
    }).success(function (response) {
        if (response.success) {
            sessionStorage.tiposCasa = JSON.stringify(response.data);
        }
    });
    /*$http.get('http://mindicador.cl/api/uf', {}).success(function (response) {
        sessionStorage.uf = response.serie[0].valor;
    });*/
});
app.filter('originalname', function () {
    return function (input) {
        input = input.split('-');
        input = input.splice(1);
        return input.join('-');
    };
});
app.filter('pagosPagados', function () {
    return function (input) {
      var total = 0;
      for(var x in input){
        if(input[x]){
          if(input[x].pagado > 0)
            total ++;
        }
      }
      return total;
    };
});
app.filter('pagosPagadosCantidad', function () {
    return function (input) {
      var total = 0;
      for(var x in input){
        if(input[x]){
          if(input[x].pagado > 0){
            total = total + (input[x].pagado-0);
          }
        }
      }
      return total;
    };
});
app.filter('tipo_casa', function () {
    return function (input) {
        if (sessionStorage.tiposCasa) {
            var tipos_casa = JSON.parse(sessionStorage.tiposCasa);
            for (var x in tipos_casa) {
                if (tipos_casa[x]._id == input) {
                    return tipos_casa[x].nombre;
                }
            }
        }
        return input;
    }
});
app.filter('transformarUFdelMes', function(){
  return function(input, month){
    if(sessionStorage.valoresuf){
      var ufs = JSON.parse(sessionStorage.valoresuf);
      console.info(ufs);
      return input;
    } else {
      return input;
    }
  }
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
app.service('randomPass', function(){
  this.generate = function(){
    var length = 8,
        charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        retVal = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
  }
});
app.filter('monthSpanish', function () {
    return function (input) {
      var months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      return months[input];
    };
});
app.filter('scope', function () {
    return function (input, session) {
      var out = true;
      if(input.scope){
        out = false;
        for(var x in input.scope){
          if(input.scope[x] == session){
            out = true;
            break;
          }
        }
      }
      return out;
    };
});
app.filter('preguntas', function () {
    return function (input) {
      var out = '';
      for(var x in input){
        out += input[x].nombre+"\n";
      }
      if(input.length == 0){
        return 'No hay preguntas ingresadas';
      } else if(input.length == 1){
        return 'Existe 1 pregunta ingresada';
      }
      return 'Hay '+input.length+' preguntas ingresadas';
    };
});
