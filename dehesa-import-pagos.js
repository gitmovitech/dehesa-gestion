var RutJS = require('./RutJS');
var fs = require('fs');
var xlsx = require('node-xlsx');
var month = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
exports.import = function(params, cb){
  console.log(JSON.stringify(params));
  var file = __dirname + '/uploads/' + params.filename;
  if (fs.existsSync(file)) {
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

      var registros = [];
      for(var x in data){
        if(x > 0){
          if (data[x][0] && data[x][1] && data[x][2]){
            registros[registros.length] = {
              run: data[x][0],
              codigo: data[x][1],
              tarifa: data[x][2],
              status: 'Pendiente',
              month: thismonth,
              year: parseInt(params.periodo.year)
            }
          }
        }
      }
      cb({
          success: true,
          data: registros
      });

      //console.log(registros);
  } else {
      cb({
          success: false,
          message: 'El archivo no fue encontrado en el servidor. Si el error persiste comuníquese con soporte'
      });
  }
}
