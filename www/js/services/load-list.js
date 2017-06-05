app.service('LoadList', function($http, Session){

  this.load = function($scope, item, index, fieldsReset, obtenerPagos, activos){
    if (typeof $scope.page != 'undefined')
        if (typeof $scope.page.filter != 'undefined')
            $scope.page.filter.value = '';
    $scope.tabledata = false;
    $scope.registros = false;

    $scope.valoruf = false;

    if (item) {
        sessionStorage.page = index;
        $scope.pageIndex = index;
        fieldsReset = item.fields;
        $scope.page = item;
        $scope.collection = item.collection;

        var params = {
            token: Session.get(),
            collection: item.collection,
            model: item.model
        }
        if (item.collection == 'pagos') {
            if (!$scope.currentPagosYear) {
                $scope.currentPagosYear = new Date().getFullYear();
            }
            if (!$scope.currentPagosMonth) {
                $scope.currentPagosMonth = new Date().getMonth();
            }
            obtenerPagos($scope.currentPagosYear, $scope.currentPagosMonth);
        } else {
          if(item.collection == 'asociados'){
            params.where = {
              activo: activos
            }
          }
            $http.get('/api/data', {
                params: params
            }).then(function (response) {
              response = response.data;
                if (response.success) {
                    for (var d in response.data) {
                        if (item.collection == 'pagos') {
                            response.data[d] = {
                                index: parseInt(parseInt(d) + parseInt(1)),
                                _id: response.data[d]._id,
                                nombre: response.data[d].nombre,
                                tarifa: response.data[d].tarifa,
                                type: response.data[d].type
                            }
                        } else {
                            response.data[d].index = parseInt(parseInt(d) + parseInt(1));
                        }
                    }
                    $scope.registros = response.data.length;
                    $scope.pagination.numPages = Math.ceil(response.data.length / $scope.pagination.perPage);
                    $scope.tabledata = registro_pagos = response.data;
                    fieldsdata = response.data;
                }
                jQuery('body').loader('hide');
                setTimeout(function(){
                  console.log($scope.tabledata);
                  $scope.$apply();
                },100);
            });
        }
    }
  }
});
