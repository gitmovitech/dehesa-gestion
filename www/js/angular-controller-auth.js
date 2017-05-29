app.controller('auth-init', function ($scope, $http, $location, Session,Dialog) {
    if (Session.get()) {
        $http.get('/api/config', {
            params: {
                token: Session.get()
            }
        }).then(function (response, err) {
          response = response.data;
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

app.controller('auth-recovery', function ($scope, $location, Session) {
    if (Session.get()) {
        $location.path('home');
    }
    $scope.input = {
        email: ''
    }
});
