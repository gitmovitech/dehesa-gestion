var mongo = require('./mongodb');
var ObjectID = require('mongodb').ObjectID;
var month = 11;
var valoruf = 26322.29;
var pagos = [];
setTimeout(function(){
  mongo.getCollection('pagos', function(data){
    for(var x in data){
      if(data[x].month == month){
        pagos[pagos.length] = data[x];
      }
    }
    mongo.getCollection('asociados', function(data){
      getAsociados(data, 0, function(){
        console.log('Registros modificados');
      });
    });
  });
}, 3000);
var getAsociados = function(data, index, cb){
  if(data[index]){
    if(data[index].formas_pago == 'PAT' || data[index].formas_pago == 'PAC'){
      for(var v in pagos){
        if(pagos[v].id == data[index].id){
          if(pagos[v].debe != 0 && pagos[v].debe != '-'){
            var estado;
            if(data[index].formas_pago == 'PAT'){
              estado = 'Aprobada';
            } else {
              estado = 'Pagos Procesados';
            }
            mongo.editCollection('pagos',[{
              name: '_id',
              value: ObjectID(pagos[v]._id)
            }, {
              name: 'pagado',
              value: pagos[v].tarifa * valoruf
            }, {
              name: 'debe',
              value: "0"
            }, {
              name: 'type',
              value: estado
            }], function(){
              delete estado;
              getAsociados(data, index + 1, cb);
            });
            break;
          } else {
            getAsociados(data, index + 1, cb);
            break;
          }
        }
      }
    } else {
      getAsociados(data, index + 1, cb);
    }
  } else {
    cb();
  }
}
