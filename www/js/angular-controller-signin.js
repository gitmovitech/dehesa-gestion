app.controller('auth-signin', function ($scope, $location, $http, Session,Dialog) {
    if (Session.get()) {
        $location.path('home');
    }
    $scope.input = {
        email: '',
        password: '',
        remember: false
    }
    $scope.signin = function () {
        if ($scope.input.email && $scope.input.password) {
            $http.post('/api/signin', $scope.input)
            .then(function (response) {
              response = response.data;
                if (response.success) {
                    if ($scope.input.remember) {
                        localStorage.intranetSession = response.data.token;
                    } else {
                        sessionStorage.intranetSession = response.data.token;
                    }
                    $location.path('/');
                } else {
                    Dialog.alert(response.message);
                }
            }, function (error){
              Dialog.alert('Error inesperado de conexión: signin')
            });

        }
        return false;
    }
});
