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
      var run = '';
      for(var x in data){
        if(x > 0){
          /*if (data[x][0] && data[x][1] && data[x][2]){
            run = data[x][0];
            run = run.toString();
            run = run.replace('-','');
            run = run.split(',');
            run = run.join('');
            run = run.split('.');
            run = run.join('');*/
            registros[registros.length] = {
              id: data[x][0],
              pago: data[x][1],
              tarifa: data[x][2],
              month: thismonth
            }
          //}
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
