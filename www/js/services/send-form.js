app.service('SendForm', function(){

  this.send = function($scope, $http, Session){
    var reload = false;
    if ($scope.filestosave.length > 0) {
        reload = true;
        for (var x in $scope.fields) {
            if ($scope.fields[x].type == 'file') {
                $scope.fields[x].value = $scope.filestosave;
                break;
            }
        }
    }

    if($scope.collection == 'encuestas'){
      for(var p in $scope.fields){
        if($scope.fields[p].name == 'preguntas'){
          $scope.fields[p].value = JSON.parse(JSON.stringify($scope.encuestas.preguntas));
          console.log($scope.fields[p].value);
        }
      }
    }
    var fields = $scope.fields;

    /**
    LIMPIEZA DE VALORES NO GUARDABLES
    **/
    for(var p in fields){
      if(fields[p].type == "title"){
        fields.splice(p,1);
      }
      if(typeof fields[p].value == "undefined" || fields[p].value == null){
        fields[p].value = "";
      }
      if(fields[p].type == "number"){
        fields[p].value = fields[p].value - 0;
      }
    }

    jQuery.ajax({
      type: "POST",
      url: '/api/data',
      data: {
        params: {
            token: Session.get(),
            collection: $scope.collection,
            fields: fields
        }
      },
      success: function(response){
        console.log(response);
        jQuery('#modalEdit').modal('hide');
        if (reload) {
          setTimeout(function () {
              $scope.uploader.destroy();
              delete $scope.uploader;
              setUploader();
          }, 500);
        } else {
          $scope.load($scope.page);
        }
      }
    });

    /*$http.post('/api/data', {
        params: {
            token: Session.get(),
            collection: $scope.collection,
            fields: fields
        }
    }).then(function (response) {
        jQuery('#modalEdit').modal('hide');
        if (reload) {
          setTimeout(function () {
              $scope.uploader.destroy();
              delete $scope.uploader;
              setUploader();
          }, 500);
        } else {
          $scope.load($scope.page);
        }

    });*/

  }
});
