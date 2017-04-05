app.service('Session', function () {
    this.get = function () {
        if (localStorage.intranetSession || sessionStorage.intranetSession) {
            if (localStorage.intranetSession) {
                return localStorage.intranetSession;
            } else {
                return sessionStorage.intranetSession;
            }
        } else {
            return false;
        }
    }
    this.getPages = function () {
        return JSON.parse(sessionStorage.pages);
    }
    this.setPages = function (data) {
        sessionStorage.pages = JSON.stringify(data);
    }
});
app.controller('auth-init', function ($scope, $http, $location, Session,Dialog) {
    if (Session.get()) {
        $http.get('/api/config', {
            params: {
                token: Session.get()
            }
        }).success(function (response, err) {
            if (response) {
                Session.setPages(response);
                $location.path('app');
            } else {
                Dialog.alert(err)
            }
        });
    } else {
        $location.path('signin');
    }
});
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
            $http.post('/api/signin', $scope.input).success(function (response) {
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
            }).error(function () {
                Dialog.alert('Error inesperado de conexión: signin')
            });
        }
        return false;
    }
});
app.controller('auth-recovery', function ($scope, $location, Session) {
    if (Session.get()) {
        $location.path('home');
    }
    $scope.input = {
        email: ''
    }
});
