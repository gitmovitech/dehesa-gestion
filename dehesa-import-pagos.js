var RutJS = require('./RutJS');
var fs = require('fs');
var xlsx = require('node-xlsx');
var mongo = require('./mongodb');

var registros = [];
var month = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
exports.import = function(params, cb){
  console.log(JSON.stringify(params));
  var file = __dirname + '/uploads/' + params.filename;
  if (fs.existsSync(file)) {
    var filename = file;
    filename = filename.split('/');
    filename = filename[filename.length -1];
      var data;
      try {
          data = xlsx.parse(fs.readFileSync(file));
          var thismonth;
          for (var c in month) {
              if (month[c] == params.periodo.month) {
                  thismonth = parseInt(c);
                  break;
              }
          }
          data = data[0].data;

      } catch (e) {
          cb({
              success: false,
              message: 'El archivo excel subido no es válido. Suba el archivo en formato excel y con el formato adecuado.'
          });
      }

      var run = '';
      filename = filename.toUpperCase();
      if(filename.match(/PAC/gi) && filename.match(/PAT/gi)){
        console.log('PACPAT');
      } else if(filename.match(/PAC/gi)){
        console.log('Procesando PAC');
        procesarPAC(data, thismonth, params.periodo.year, function(data){
          cb({
              success: true
          });
        });
      } else if(filename.match(/PAT/gi)){
        console.log('PAT');
      }

  } else {
      cb({
          success: false,
          message: 'El archivo no fue encontrado en el servidor. Si el error persiste comuníquese con soporte'
      });
  }
}

var procesarPAC = function(data, month, year, cb){
console.log('REGISTROS: '+data.length);
  for(var i in data){
    if(i >= 11){
      registros[registros.length] = {
        run: data[i][1],
        pago: data[i][4],
        tarifa: data[i][4],
        estado: data[i][6]
      }
    }
  }
  registros.forEach(function(item, i){
    mongo.getUserByRun(item.run, function(asociado){
      try{
        if(item.estado != 'Pagos Procesados'){
          item.estado = 'Pendiente';
          item.debe = item.pago;
          item.pago = 0;
        } else {
          item.debe = 0
        }
        mongo.savePayment({
          id: asociado.id,
          nombre: [asociado.first_name, asociado.second_name, asociado.last_name, asociado.second_last_name].join(' '),
          tarifa: item.tarifa,
          type: item.estado,
          pagado: item.pago,
          debe: 0,
          month: month,
          year: year
        });
      } catch(e){}
    });
  });
  cb(registros);
}
