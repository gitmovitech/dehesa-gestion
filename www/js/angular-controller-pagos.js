app.controller('pagos', function ($scope, $location, Session) {
    if (Session.get()) {
        $location.path('home');
    }
    $scope.input = {
        email: ''
    }
});